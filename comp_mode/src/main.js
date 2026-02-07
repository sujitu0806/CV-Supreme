/**
 * Live Competition Mode: per-shot metadata extraction via Overshoot.
 * Processes live camera stream; emits one structured observation per detected opponent shot.
 */

import { RealtimeVision } from '@overshoot/sdk';
import { SHOT_ANALYSIS_PROMPT } from './prompt.js';
import { SHOT_OUTPUT_SCHEMA } from './schema.js';

/** Minimal prompt to test if Overshoot returns anything (no JSON schema). */
export const SIMPLE_TEST_PROMPT = 'In one short sentence, what is the person in the video doing right now?';

const API_URL = 'https://cluster1.overshoot.ai/api/v0.2';
const API_KEY = import.meta.env?.VITE_OVERSHOOT_API_KEY ?? '<INSERT_API_KEY_HERE>';

/** @type {import('@overshoot/sdk').RealtimeVision | null} */
let vision = null;

/** In-memory list of shot observations for this session. Downstream can read or subscribe via onShot. */
export const shots = [];

/** Callbacks to invoke when a shot observation is emitted. */
const shotCallbacks = new Set();

/**
 * Subscribe to shot observations. Callback receives one shot object per detected shot.
 * @param {(observation: import('./types').ShotObservation) => void} cb
 * @returns {() => void} Unsubscribe function.
 */
export function onShot(cb) {
  shotCallbacks.add(cb);
  return () => shotCallbacks.delete(cb);
}

/**
 * Emit one shot observation: add to shots, call callbacks, dispatch event.
 * @param {import('./types').ShotObservation} observation
 */
function emitShot(observation) {
  shots.push(observation);
  shotCallbacks.forEach((cb) => {
    try {
      cb(observation);
    } catch (e) {
      console.error('[comp-mode] shot callback error:', e);
    }
  });
  window.dispatchEvent(
    new CustomEvent('comp-mode:shot', { detail: observation })
  );
}

/**
 * Format current time as HH:MM:SS.mmm for shot_timestamp.
 */
function formatTimestamp() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

/**
 * Get a camera stream for preview only (e.g. before or when analysis is unavailable).
 * Prefer 'environment' (rear/opponent-facing); fall back to 'user' (e.g. MacBook front camera).
 * @returns {Promise<MediaStream>}
 */
export async function getPreviewStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
  } catch {
    return navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
  }
}

/**
 * Build RealtimeVision and start the stream. Idempotent: if already running, no-op.
 * @param {{ onStatus?: (status: string) => void, onStream?: (stream: MediaStream) => void, onError?: (message: string) => void, onRawResult?: (data: { shot_detected?: boolean } & Record<string, unknown>) => void, onDebugResult?: (info: { count: number, ok: boolean, error: string | null, raw: string, parsed: unknown, parseError?: string }) => void, useSimpleTest?: boolean }} options
 */
export async function start(options = {}) {
  const {
    onStatus = () => {},
    onStream = () => {},
    onError = () => {},
    onRawResult = () => {},
    onDebugResult = () => {},
    useSimpleTest = false,
  } = options;
  if (vision) {
    onStatus('already_running');
    const stream = vision.getMediaStream?.() ?? null;
    if (stream) onStream(stream);
    return;
  }

  let resultCount = 0;
  try {
    onStatus('starting');
    const prompt = useSimpleTest ? SIMPLE_TEST_PROMPT : SHOT_ANALYSIS_PROMPT;
    const outputSchema = useSimpleTest ? undefined : SHOT_OUTPUT_SCHEMA;
    vision = new RealtimeVision({
      apiUrl: API_URL,
      apiKey: API_KEY,
      prompt,
      outputSchema,
      source: {
        type: 'camera',
        cameraFacing: 'environment',
      },
      processing: {
        clip_length_seconds: 0.6,
        delay_seconds: 0.7,
        fps: 45,
        sampling_ratio: 0.7,
      },
      onResult(result) {
        resultCount += 1;
        const raw = result?.result;
        const ok = result?.ok !== false;
        const err = result?.error ?? null;
        const rawStr = raw != null && typeof raw === 'string' ? raw : String(raw ?? '');
        let parsed = null;
        let parseError = null;
        try {
          parsed = rawStr ? JSON.parse(rawStr) : null;
        } catch (e) {
          parseError = e?.message ?? String(e);
          if (!useSimpleTest) {
            console.warn('[comp-mode] onResult parse error:', e);
          }
        }
        try {
          onDebugResult({
            count: resultCount,
            ok,
            error: err,
            raw: rawStr,
            parsed,
            parseError: parseError ?? undefined,
          });
        } catch (_) {}
        if (!ok && err) {
          console.warn('[comp-mode] API result not ok:', err);
        }
        if (useSimpleTest) {
          return;
        }
        const data = parsed;
        if (data == null) return;
        try {
          onRawResult(data);
        } catch (_) {}
        // Paddle-focused: emit when paddle visible AND strike detected, or any paddle primitive present
        const paddleVisible = data.paddle_visible === true;
        const strikeDetected = data.strike_detected === true;
        const hasHandedness = data.handedness?.value && String(data.handedness.value).trim();
        const hasPaddleSide = data.paddle_side?.value && String(data.paddle_side.value).trim();
        const hasSpeed = data.speed?.value && String(data.speed.value).trim();
        const hasFollowThrough = data.follow_through?.value && String(data.follow_through.value).trim();
        const hasMotion = data.motion?.horizontal_direction?.value || data.motion?.vertical_component?.value || data.motion?.plane?.value;
        const hasFace = data.face_orientation?.vertical_angle?.value || data.face_orientation?.lateral_angle?.value;
        const impliedStrike = hasHandedness || hasPaddleSide || hasSpeed || hasFollowThrough || hasMotion || hasFace;
        if (!paddleVisible && !strikeDetected && !impliedStrike) return;
        const observation = {
          shot_timestamp: formatTimestamp(),
          paddle_visible: !!paddleVisible,
          strike_detected: !!strikeDetected,
          handedness: data.handedness ?? { value: '', confidence: 0 },
          paddle_distance: data.paddle_distance ?? { value: '', confidence: 0 },
          paddle_side: data.paddle_side ?? { value: '', confidence: 0 },
          face_orientation: data.face_orientation ?? {
            vertical_angle: { value: '', confidence: 0 },
            lateral_angle: { value: '', confidence: 0 },
          },
          motion: data.motion ?? {
            horizontal_direction: { value: '', confidence: 0 },
            vertical_component: { value: '', confidence: 0 },
            plane: { value: '', confidence: 0 },
          },
          speed: data.speed ?? { value: '', confidence: 0 },
          follow_through: data.follow_through ?? { value: '', confidence: 0 },
          rotation: data.rotation ?? { value: '', confidence: 0 },
          strike_height: data.strike_height ?? '',
          swing_timing: data.swing_timing ?? '',
        };
        emitShot(observation);
      },
    });
    await vision.start();
    const stream = vision.getMediaStream?.() ?? null;
    if (stream) onStream(stream);
    onStatus('running');
  } catch (e) {
    const message = e?.message ?? e?.error ?? String(e);
    console.error('[comp-mode] start error:', e);
    vision = null;
    onError(message);
    onStatus('error');
  }
}

/**
 * Stop the stream and release the camera.
 * @param {{ onStatus?: (status: string) => void }} options
 */
export async function stop(options = {}) {
  const { onStatus = () => {} } = options;
  if (!vision) {
    onStatus('stopped');
    return;
  }
  try {
    await vision.stop();
  } catch (e) {
    console.warn('[comp-mode] stop error:', e);
  }
  vision = null;
  onStatus('stopped');
}
