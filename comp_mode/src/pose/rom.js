/**
 * Range of Motion (ROM) tracking per joint.
 * Tracks min, max, and total range over a session.
 */

/** @typedef {{ min: number, max: number, range: number, sampleCount: number }} ROMValue */

/**
 * ROM tracker - updates dynamically per session.
 */
export class ROMTracker {
  constructor() {
    /** @type {Record<string, ROMValue>} */
    this.rom = {};
  }

  /**
   * Update ROM with new angle value.
   * @param {string} jointName
   * @param {number} angle
   */
  update(jointName, angle) {
    if (typeof angle !== 'number' || !Number.isFinite(angle)) return;

    if (!this.rom[jointName]) {
      this.rom[jointName] = { min: angle, max: angle, range: 0, sampleCount: 1 };
      return;
    }

    const r = this.rom[jointName];
    r.min = Math.min(r.min, angle);
    r.max = Math.max(r.max, angle);
    r.range = r.max - r.min;
    r.sampleCount += 1;
  }

  /**
   * Update ROM with all joint angles.
   * @param {Record<string, number>} angles
   */
  updateAll(angles) {
    for (const [jointName, angle] of Object.entries(angles)) {
      if (angle != null) this.update(jointName, angle);
    }
  }

  /**
   * Get current ROM for a joint.
   * @param {string} jointName
   * @returns {ROMValue | undefined}
   */
  get(jointName) {
    return this.rom[jointName];
  }

  /**
   * Get all ROM values.
   * @returns {Record<string, ROMValue>}
   */
  getAll() {
    return { ...this.rom };
  }

  /** Reset ROM for a new session. */
  reset() {
    this.rom = {};
  }
}
