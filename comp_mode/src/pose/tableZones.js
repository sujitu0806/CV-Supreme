/**
 * Table zones: CENTER (between hips), LEFT (left hip to left edge), RIGHT (right hip to right edge).
 * Projects hip positions onto the table plane to create zone boundaries.
 * Camera: front/front-angle viewing the player.
 */

import { LANDMARKS } from './landmarks.js';

/** Table band in normalized coords: y range where table is visible (bottom ~55% of frame) */
const TABLE_TOP_Y = 0.45;
const TABLE_BOTTOM_Y = 0.98;

/** Zone colors: center (blue), left (green), right (orange) */
export const ZONE_COLORS = {
  CENTER: 'rgba(59, 130, 246, 0.25)',
  CENTER_ACTIVE: 'rgba(59, 130, 246, 0.45)',
  LEFT: 'rgba(34, 197, 94, 0.25)',
  LEFT_ACTIVE: 'rgba(34, 197, 94, 0.45)',
  RIGHT: 'rgba(249, 115, 22, 0.25)',
  RIGHT_ACTIVE: 'rgba(249, 115, 22, 0.45)',
};

/** Boundary line color */
export const BOUNDARY_COLOR = 'rgba(255, 255, 255, 0.7)';

/**
 * Get zone boundaries from pose landmarks (hip x positions projected onto table plane).
 * @param {Array<{x: number, y: number, visibility?: number}>} landmarks - Normalized 0-1
 * @param {number} minVisibility
 * @returns {{ leftHipX: number, rightHipX: number } | null}
 */
export function getZoneBoundaries(landmarks, minVisibility = 0.4) {
  if (!landmarks?.length) return null;
  const leftHip = landmarks[LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[LANDMARKS.RIGHT_HIP];
  if (!leftHip || !rightHip) return null;
  if ((leftHip.visibility != null && leftHip.visibility < minVisibility) ||
      (rightHip.visibility != null && rightHip.visibility < minVisibility)) return null;
  return {
    leftHipX: leftHip.x,
    rightHipX: rightHip.x,
  };
}

/**
 * Determine which zone a point (paddle/hand) is in.
 * @param {number} handX - Normalized x (0-1)
 * @param {number} leftHipX
 * @param {number} rightHipX
 * @returns {'CENTER'|'LEFT'|'RIGHT'}
 */
export function getCurrentZone(handX, leftHipX, rightHipX) {
  if (handX < leftHipX) return 'LEFT';
  if (handX > rightHipX) return 'RIGHT';
  return 'CENTER';
}

/**
 * Track zone transitions and count them.
 */
export class ZoneTransitionTracker {
  constructor() {
    /** @type {'CENTER'|'LEFT'|'RIGHT'|null} */
    this._lastZone = null;
    this._transitionCount = 0;
  }

  /**
   * Update with current zone. Returns true if a transition occurred.
   * @param {'CENTER'|'LEFT'|'RIGHT'|null} zone
   * @returns {boolean}
   */
  update(zone) {
    if (zone == null) return false;
    const changed = this._lastZone !== null && this._lastZone !== zone;
    if (changed) this._transitionCount += 1;
    this._lastZone = zone;
    return changed;
  }

  getTransitionCount() {
    return this._transitionCount;
  }

  reset() {
    this._lastZone = null;
    this._transitionCount = 0;
  }
}

/**
 * Get paddle hand wrist x from landmarks (normalized 0-1).
 * @param {Array<{x: number, y: number, visibility?: number}>} landmarks
 * @param {'left'|'right'} dominantHand
 * @param {number} minVisibility
 * @returns {number|null}
 */
export function getPaddleWristX(landmarks, dominantHand, minVisibility = 0.4) {
  if (!landmarks?.length) return null;
  const idx = dominantHand === 'left' ? LANDMARKS.LEFT_WRIST : LANDMARKS.RIGHT_WRIST;
  const wrist = landmarks[idx];
  if (!wrist || (wrist.visibility != null && wrist.visibility < minVisibility)) return null;
  return wrist.x;
}

export { TABLE_TOP_Y, TABLE_BOTTOM_Y };
