/**
 * Joint angle computation using vector math.
 * Computes angles from three points: angle at the middle point (joint).
 * Works with both 2D (x,y) and 3D (x,y,z) coordinates.
 */

/**
 * @typedef {{ x: number, y: number, z?: number }} Point
 */

/**
 * Compute angle at point B formed by A-B-C (in degrees).
 * Uses atan2 for numerical stability.
 *
 * @param {Point} a - Proximal point
 * @param {Point} b - Joint (vertex)
 * @param {Point} c - Distal point
 * @param {boolean} [use3D=false] - Use z coordinate if available
 * @returns {number} Angle in degrees [0, 180]
 */
export function angleAt(a, b, c, use3D = false) {
  const v1 = use3D && a.z != null && b.z != null && c.z != null
    ? { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
    : { x: a.x - b.x, y: a.y - b.y };
  const v2 = use3D && c.z != null && b.z != null
    ? { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z }
    : { x: c.x - b.x, y: c.y - b.y };

  if (use3D && v1.z != null && v2.z != null) {
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
    if (mag1 < 1e-8 || mag2 < 1e-8) return NaN;
    const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    return (Math.acos(cos) * 180) / Math.PI;
  }

  const angle1 = Math.atan2(v1.y, v1.x);
  const angle2 = Math.atan2(v2.y, v2.x);
  let diff = Math.abs(angle1 - angle2);
  if (diff > Math.PI) diff = 2 * Math.PI - diff;
  return (diff * 180) / Math.PI;
}

/**
 * Extract landmark point from MediaPipe landmarks array.
 * @param {Array<{x: number, y: number, z?: number}>} landmarks
 * @param {number} index
 * @returns {Point}
 */
export function getPoint(landmarks, index) {
  const lm = landmarks[index];
  if (!lm) return { x: NaN, y: NaN, z: NaN };
  return { x: lm.x, y: lm.y, z: lm.z };
}

/**
 * Compute angles of limb segments relative to screen horizontal.
 * @param {Array<{x: number, y: number, z?: number}>} landmarks
 * @param {Record<string, number[]>} segmentDefs - [startIdx, endIdx] per joint
 * @returns {Record<string, number>}
 */
export function computeAnglesToHorizontal(landmarks, segmentDefs) {
  const result = {};
  for (const [jointName, [iA, iB]] of Object.entries(segmentDefs)) {
    const a = getPoint(landmarks, iA);
    const b = getPoint(landmarks, iB);
    const angle = angleToHorizontal(a, b);
    result[jointName] = Number.isNaN(angle) ? undefined : angle;
  }
  return result;
}

const DEFAULT_MIN_VISIBILITY = 0.4;

/**
 * Check if landmark has sufficient visibility.
 * @param {Array<{visibility?: number}>} landmarks
 * @param {number} index
 * @param {number} minVis
 */
function hasVisibility(landmarks, index, minVis) {
  const lm = landmarks[index];
  if (!lm) return false;
  const v = lm.visibility;
  return v == null || v >= minVis;
}

/**
 * Compute all joint angles from landmarks.
 * Skips joints with missing or low-confidence landmarks.
 * @param {Array<{x: number, y: number, z?: number, visibility?: number}>} landmarks
 * @param {Record<string, number[]>} jointDefs
 * @param {boolean} [use3D=false]
 * @param {number} [minVisibility=0.4]
 * @returns {Record<string, number>}
 */
export function computeAllAngles(landmarks, jointDefs, use3D = false, minVisibility = DEFAULT_MIN_VISIBILITY) {
  const result = {};
  for (const [jointName, [iA, iB, iC]] of Object.entries(jointDefs)) {
    if (!hasVisibility(landmarks, iA, minVisibility) || !hasVisibility(landmarks, iB, minVisibility) || !hasVisibility(landmarks, iC, minVisibility)) {
      continue;
    }
    const a = getPoint(landmarks, iA);
    const b = getPoint(landmarks, iB);
    const c = getPoint(landmarks, iC);
    const angle = angleAt(a, b, c, use3D);
    result[jointName] = Number.isNaN(angle) ? undefined : angle;
  }
  return result;
}

/**
 * Angle of segment A→B relative to screen horizontal (x-axis).
 * 0° = horizontal right, 90° = down, 180°/-180° = horizontal left, -90° = up.
 * Uses 2D image coordinates (y increases downward).
 *
 * @param {Point} a - Start of segment
 * @param {Point} b - End of segment
 * @returns {number} Angle in degrees [-180, 180]
 */
export function angleToHorizontal(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) < 1e-8 && Math.abs(dy) < 1e-8) return NaN;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}
