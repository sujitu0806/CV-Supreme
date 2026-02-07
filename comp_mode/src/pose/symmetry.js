/**
 * Symmetry analysis: left vs right joint comparison.
 */

import { SYMMETRY_PAIRS_CANONICAL } from './landmarks.js';

// Extend with wrist pairs for overlay
const PAIRS = [...SYMMETRY_PAIRS_CANONICAL, ['leftWrist', 'rightWrist']];

/**
 * @typedef {Object} SymmetryMetric
 * @property {number} absoluteDifference - |left - right| for current frame
 * @property {number} averageDifference - Running average of absolute difference
 * @property {number} romDifference - |romLeft - romRight| if both have ROM
 * @property {boolean} asymmetryFlagged - True if exceeds threshold
 */

/** @typedef {Record<string, SymmetryMetric>} SymmetryMetrics */

/**
 * Symmetry analyzer.
 */
export class SymmetryAnalyzer {
  /**
   * @param {number} [asymmetryThreshold=15] - Degrees: flag if avg difference exceeds this
   */
  constructor(asymmetryThreshold = 15) {
    this.asymmetryThreshold = asymmetryThreshold;
    /** @type {Record<string, { sum: number, count: number }>} */
    this.runningSums = {};
    /** @type {Record<string, [number, number]>} - [leftROM, rightROM] per pair */
    this.romCache = {};
  }

  /**
   * Reset for new session.
   */
  reset() {
    this.runningSums = {};
    this.romCache = {};
  }

  /**
   * Update ROM cache for a pair (call when ROM is available).
   * @param {string} leftJoint
   * @param {string} rightJoint
   * @param {number} leftROM
   * @param {number} rightROM
   */
  setROM(leftJoint, rightJoint, leftROM, rightROM) {
    const key = `${leftJoint}_${rightJoint}`;
    this.romCache[key] = [leftROM, rightROM];
  }

  /**
   * Compute symmetry metrics for current frame.
   * @param {Record<string, number>} angles - Current joint angles
   * @param {Record<string, { range: number }>} rom - ROM values
   * @returns {SymmetryMetrics}
   */
  analyze(angles, rom = {}) {
    const result = /** @type {SymmetryMetrics} */ ({});

    for (const [leftJoint, rightJoint] of PAIRS) {
      const leftAngle = angles[leftJoint];
      const rightAngle = angles[rightJoint];

      if (leftAngle == null || rightAngle == null) continue;

      const absDiff = Math.abs(leftAngle - rightAngle);

      const pairKey = `${leftJoint}_${rightJoint}`;
      if (!this.runningSums[pairKey]) {
        this.runningSums[pairKey] = { sum: 0, count: 0 };
      }
      const rs = this.runningSums[pairKey];
      rs.sum += absDiff;
      rs.count += 1;
      const avgDiff = rs.count > 0 ? rs.sum / rs.count : 0;

      const leftROM = rom[leftJoint]?.range;
      const rightROM = rom[rightJoint]?.range;
      const romDiff = leftROM != null && rightROM != null
        ? Math.abs(leftROM - rightROM)
        : 0;

      const flagged = avgDiff > this.asymmetryThreshold;

      result[pairKey] = {
        absoluteDifference: absDiff,
        averageDifference: avgDiff,
        romDifference: romDiff,
        asymmetryFlagged: flagged,
      };
    }

    return result;
  }
}
