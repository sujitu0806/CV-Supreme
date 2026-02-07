/**
 * Pose pipeline: pose detection → angles → smoothing → ROM → symmetry.
 * Orchestrates all components and exposes structured data for UI/analytics/ML.
 */

import { JOINT_DEFINITIONS, SEGMENT_FOR_HORIZONTAL } from './landmarks.js';
import { computeAllAngles, computeAnglesToHorizontal } from './angles.js';
import { ROMTracker } from './rom.js';
import { SymmetryAnalyzer } from './symmetry.js';
import { ExponentialSmoother } from './smoothing.js';
import { detectPose } from './poseDetector.js';

/**
 * @typedef {Object} PosePipelineOutput
 * @property {number} timestamp
 * @property {Record<string, number>} jointAngles - Smoothed joint angles (degrees)
 * @property {Record<string, number>} jointAnglesHorizontal - Angles to screen horizontal (degrees)
 * @property {Record<string, number>} [jointAngles3D] - 3D angles if available
 * @property {Record<string, { min: number, max: number, range: number }>} rom
 * @property {Record<string, { absoluteDifference: number, averageDifference: number, romDifference: number, asymmetryFlagged: boolean }>} symmetry
 * @property {Array<{x: number, y: number, z: number}>} [landmarks] - Raw landmarks for debugging
 */

/**
 * @typedef {Object} PosePipelineConfig
 * @property {number} [smoothingAlpha=0.3]
 * @property {number} [asymmetryThreshold=15]
 * @property {boolean} [use3DAngles=true]
 * @property {'left'|'right'} [dominantHand=right]
 */

/**
 * Pose pipeline for real-time CV analysis.
 */
export class PosePipeline {
  /**
   * @param {PosePipelineConfig} [config]
   */
  constructor(config = {}) {
    this.smoothingAlpha = config.smoothingAlpha ?? 0.3;
    this.asymmetryThreshold = config.asymmetryThreshold ?? 15;
    this.use3DAngles = config.use3DAngles !== false;
    this.dominantHand = config.dominantHand ?? 'right';

    this.angleSmoother2D = new ExponentialSmoother(this.smoothingAlpha);
    this.angleSmoother3D = new ExponentialSmoother(this.smoothingAlpha);
    this.angleSmootherHorizontal = new ExponentialSmoother(this.smoothingAlpha);
    this.romTracker = new ROMTracker();
    this.symmetryAnalyzer = new SymmetryAnalyzer(this.asymmetryThreshold);

    /** @type {Array<{timestamp: number, landmarks: Array, worldLandmarks: Array | null}>} */
    this.landmarkHistory = [];
    this.maxHistoryLength = 300; // ~5 sec at 60fps
  }

  /**
   * Process one frame. Call from video loop.
   * @param {HTMLVideoElement} video
   * @param {number} timestampMs
   * @returns {Promise<PosePipelineOutput | null>}
   */
  async processFrame(video, timestampMs) {
    const pose = await detectPose(video, timestampMs);
    if (!pose) return null;

    const { landmarks, worldLandmarks } = pose;

    // Store landmarks over time
    this.landmarkHistory.push({ timestamp: timestampMs, landmarks, worldLandmarks: worldLandmarks ?? null });
    if (this.landmarkHistory.length > this.maxHistoryLength) this.landmarkHistory.shift();

    const lm = worldLandmarks && this.use3DAngles ? worldLandmarks : landmarks;
    const use3D = !!worldLandmarks && this.use3DAngles;
    const lmFor2D = landmarks; // use landmarks (have visibility) for confidence guards

    const rawAngles2D = computeAllAngles(lmFor2D, JOINT_DEFINITIONS, false);
    const rawAngles3D = use3D ? computeAllAngles(lm, JOINT_DEFINITIONS, true) : null;
    const rawHorizontal = computeAnglesToHorizontal(lm, SEGMENT_FOR_HORIZONTAL);

    const smoothed2D = this.angleSmoother2D.smoothAll(rawAngles2D);
    const smoothedHorizontal = this.angleSmootherHorizontal.smoothAll(rawHorizontal);
    const smoothed3D = rawAngles3D ? this.angleSmoother3D.smoothAll(rawAngles3D) : null;

    this.romTracker.updateAll(smoothed2D);
    if (smoothed3D) this.romTracker.updateAll(smoothed3D);

    const romAll = this.romTracker.getAll();
    const romSimple = Object.fromEntries(
      Object.entries(romAll).map(([k, v]) => [k, { min: v.min, max: v.max, range: v.range }])
    );

    const symmetry = this.symmetryAnalyzer.analyze(smoothed2D, romSimple);

    return {
      timestamp: timestampMs,
      dominantHand: this.dominantHand,
      jointAngles: smoothed2D,
      jointAnglesHorizontal: smoothedHorizontal,
      jointAngles3D: smoothed3D ?? undefined,
      rom: romSimple,
      symmetry,
      landmarks,
    };
  }

  /**
   * Get current ROM values.
   */
  getROM() {
    return this.romTracker.getAll();
  }

  /** Update dominant hand for overlay. */
  setDominantHand(hand) {
    this.dominantHand = hand === 'left' ? 'left' : 'right';
  }

  /**
   * Get landmark history for post-session analytics.
   */
  getLandmarkHistory() {
    return [...this.landmarkHistory];
  }

  /**
   * Reset session (ROM, symmetry, smoothing state).
   */
  resetSession() {
    this.romTracker.reset();
    this.symmetryAnalyzer.reset();
    this.angleSmoother2D.reset();
    this.angleSmoother3D.reset();
    this.angleSmootherHorizontal.reset();
    this.landmarkHistory = [];
  }
}
