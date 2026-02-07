/**
 * Training Mode: process video stream and extract structured metadata
 * (ball placement, spin, shot type, player locations) for BOTH players.
 * Uses Overshoot for prompt-driven vision reasoning. Data only; no coaching advice.
 */

import { RealtimeVision } from '@overshoot/sdk';
import { TRAINING_ANALYSIS_PROMPT } from './prompt.js';
import { TRAINING_OUTPUT_SCHEMA } from './schema.js';

const API_URL = 'https://cluster1.overshoot.ai/api/v0.2';
const API_KEY = import.meta.env?.VITE_OVERSHOOT_API_KEY ?? '<INSERT_API_KEY_HERE>';

/** @type {import('@overshoot/sdk').RealtimeVision | null} */
let vision = null;

/** In-memory list of observations for this session. */
export const observations = [];

/** Callbacks invoked when a new observation is emitted. */
const observationCallbacks = new Set();

/**
 * Subscribe to training observations.
 * @param {(observation: import('./types.js').TrainingObservation) => void} cb
 * @returns {() => void} Unsubscribe function.
 */
export function onObservation(cb) {
  observationCallbacks.add(cb);
  return () => observationCallbacks.delete(cb);
}

/**
 * Emit one observation: add to list, notify callbacks, dispatch event.
 * @param {import('./types.js').TrainingObservation} observation
 */
function emitObservation(observation) {
  observations.push(observation);
  observationCallbacks.forEach((cb) => {
    try {
      cb(observation);
    } catch (e) {
      console.error('[training-mode] observation callback error:', e);
    }
  });
  window.dispatchEvent(
    new CustomEvent('training-mode:observation', { detail: observation })
  );
}

/**
 * Format current time as HH:MM:SS.mmm for timestamp.
 * @returns {string}
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
 * Build a safe observation from raw API data. Fills defaults for missing fields.
 * @param {unknown} data - Parsed JSON from Overshoot
 * @returns {import('./types.js').TrainingObservation}
 */
function buildObservation(data) {
  const obj = data && typeof data === 'object' ? /** @type {Record<string, unknown>} */ (data) : {};
  const ball = obj.ball_placement && typeof obj.ball_placement === 'object' ? obj.ball_placement : {};
  const spin = obj.spin_type && typeof obj.spin_type === 'object' ? obj.spin_type : {};
  const shot = obj.shot_type && typeof obj.shot_type === 'object' ? obj.shot_type : {};
  const players = obj.player_locations && typeof obj.player_locations === 'object' ? obj.player_locations : {};
  const pa = players.player_a && typeof players.player_a === 'object' ? players.player_a : {};
  const pb = players.player_b && typeof players.player_b === 'object' ? players.player_b : {};

  const num = (x) => (typeof x === 'number' && !Number.isNaN(x) ? x : 0);
  const str = (x) => (typeof x === 'string' ? x : 'unknown');

  return {
    timestamp: formatTimestamp(),
    ball_placement: {
      zone: str(ball.zone),
      confidence: num(ball.confidence),
    },
    spin_type: {
      value: str(spin.value),
      confidence: num(spin.confidence),
    },
    shot_type: {
      value: str(shot.value),
      confidence: num(shot.confidence),
    },
    player_locations: {
      player_a: {
        distance_from_table: str(pa.distance_from_table),
        lateral_position: str(pa.lateral_position),
        confidence: num(pa.confidence),
      },
      player_b: {
        distance_from_table: str(pb.distance_from_table),
        lateral_position: str(pb.lateral_position),
        confidence: num(pb.confidence),
      },
    },
  };
}

/**
 * Get a camera stream for preview (e.g. before or when analysis is off).
 * Prefer 'environment'; fall back to 'user'.
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
 * Start the video stream and Overshoot analysis. Idempotent.
 * @param {{
 *   onStatus?: (status: string) => void,
 *   onStream?: (stream: MediaStream) => void,
 *   onError?: (message: string) => void,
 *   onRawResult?: (data: Record<string, unknown>) => void,
 *   onDebugResult?: (info: { count: number, ok: boolean, error: string | null, raw: string, parsed: unknown, parseError?: string }) => void
 * }} options
 */
export async function start(options = {}) {
  const {
    onStatus = () => {},
    onStream = () => {},
    onError = () => {},
    onRawResult = () => {},
    onDebugResult = () => {},
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
    vision = new RealtimeVision({
      apiUrl: API_URL,
      apiKey: API_KEY,
      prompt: TRAINING_ANALYSIS_PROMPT,
      outputSchema: TRAINING_OUTPUT_SCHEMA,
      source: {
        type: 'camera',
        cameraFacing: 'environment',
      },
      processing: {
        clip_length_seconds: 1,
        delay_seconds: 1,
        fps: 30,
        sampling_ratio: 0.1,
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
          console.warn('[training-mode] onResult parse error:', e);
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
          console.warn('[training-mode] API result not ok:', err);
        }
        if (parsed == null) return;
        try {
          onRawResult(/** @type {Record<string, unknown>} */ (parsed));
        } catch (_) {}
        const observation = buildObservation(parsed);
        emitObservation(observation);
      },
    });
    await vision.start();
    const stream = vision.getMediaStream?.() ?? null;
    if (stream) onStream(stream);
    onStatus('running');
  } catch (e) {
    const message = e?.message ?? e?.error ?? String(e);
    console.error('[training-mode] start error:', e);
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
    console.warn('[training-mode] stop error:', e);
  }
  vision = null;
  onStatus('stopped');
}
