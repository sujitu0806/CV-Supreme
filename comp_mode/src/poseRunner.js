/**
 * Pose pipeline runner: processes camera stream in real-time.
 * Runs MediaPipe Pose pipeline and emits structured data for UI/analytics.
 */

import { PosePipeline } from './pose/posePipeline.js';

/** @type {HTMLVideoElement | null} */
let videoEl = null;
/** @type {number | null} */
let rafId = null;
/** @type {PosePipeline | null} */
let pipeline = null;
/** @type {number} */
let poseIntervalMs = 0;
let lastPoseTs = 0;

const poseCallbacks = new Set();

/**
 * Subscribe to pose pipeline output (per-frame).
 * @param {(data: import('./pose/posePipeline.js').PosePipelineOutput) => void} cb
 * @returns {() => void} Unsubscribe
 */
export function onPoseData(cb) {
  poseCallbacks.add(cb);
  return () => poseCallbacks.delete(cb);
}

function emitPoseData(data) {
  poseCallbacks.forEach((cb) => {
    try {
      cb(data);
    } catch (e) {
      console.error('[pose-runner] callback error:', e);
    }
  });
  window.dispatchEvent(new CustomEvent('comp-mode:pose', { detail: data }));
}

async function processLoop() {
  if (!videoEl || !pipeline || rafId === null) return;

  const ts = performance.now();
  const shouldRun = poseIntervalMs <= 0 || ts - lastPoseTs >= poseIntervalMs;

  if (shouldRun) {
    try {
      lastPoseTs = ts;
      const data = await pipeline.processFrame(videoEl, ts);
      if (data) emitPoseData(data);
    } catch (e) {
      if (rafId !== null) console.warn('[pose-runner] frame error:', e?.message);
    }
  }

  rafId = requestAnimationFrame(processLoop);
}

/**
 * Start pose pipeline on a video element.
 * @param {HTMLVideoElement} video - Video element with camera stream
 * @param {import('./pose/posePipeline.js').PosePipelineConfig} [config]
 * @returns {Promise<void>}
 */
export async function startPosePipeline(video, config = {}) {
  if (!video) return;

  try {
    poseIntervalMs = config.poseIntervalMs ?? 0;
    lastPoseTs = 0;
    if (pipeline) {
      pipeline.resetSession();
      if (config.dominantHand) pipeline.setDominantHand(config.dominantHand);
    } else {
      pipeline = new PosePipeline(config);
    }

    videoEl = video;
    rafId = requestAnimationFrame(processLoop);
  } catch (e) {
    console.warn('[pose-runner] start failed:', e?.message ?? e);
  }
}

/**
 * Stop pose pipeline.
 */
export function stopPosePipeline() {
  if (rafId != null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  videoEl = null;
}

/**
 * Get current pipeline (for ROM, history, etc.).
 * @returns {PosePipeline | null}
 */
export function getPosePipeline() {
  return pipeline;
}
