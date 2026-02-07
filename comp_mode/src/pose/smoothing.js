/**
 * Temporal smoothing to reduce pose jitter.
 * Uses exponential moving average for minimal delay.
 */

/**
 * Exponential moving average filter.
 * Alpha: 0 = no smoothing (raw), 1 = no change. Typical: 0.2–0.4 for real-time.
 */
export class ExponentialSmoother {
  /**
   * @param {number} [alpha=0.3] - Smoothing factor. Lower = smoother, more delay.
   */
  constructor(alpha = 0.3) {
    this.alpha = Math.max(0, Math.min(1, alpha));
    /** @type {Record<string, number>} */
    this.previous = {};
  }

  /**
   * @param {string} key
   * @param {number} value
   * @returns {number}
   */
  smooth(key, value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return value;

    const prev = this.previous[key];
    if (prev == null) {
      this.previous[key] = value;
      return value;
    }

    const smoothed = this.alpha * prev + (1 - this.alpha) * value;
    this.previous[key] = smoothed;
    return smoothed;
  }

  /**
   * Smooth all values in a record.
   * @param {Record<string, number>} values
   * @returns {Record<string, number>}
   */
  smoothAll(values) {
    const result = {};
    for (const [k, v] of Object.entries(values)) {
      if (v != null) result[k] = this.smooth(k, v);
    }
    return result;
  }

  reset() {
    this.previous = {};
  }
}

/**
 * Shortest-path difference for angles in [0, 360].
 * @param {number} prev
 * @param {number} value
 * @returns {number} Signed difference (-180 to 180)
 */
function angularDiff(prev, value) {
  let d = value - prev;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

/**
 * Exponential smoother for angles (0–360). Handles wrap to avoid 359→1 spikes.
 */
export class AngleSmoother {
  constructor(alpha = 0.1) {
    this.alpha = Math.max(0, Math.min(1, alpha));
    /** @type {Record<string, number>} */
    this.previous = {};
  }

  smooth(key, value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return value;

    const prev = this.previous[key];
    if (prev == null) {
      this.previous[key] = value;
      return value;
    }

    const d = angularDiff(prev, value);
    const smoothed = prev + (1 - this.alpha) * d;
    const out = ((smoothed % 360) + 360) % 360;
    this.previous[key] = out;
    return out;
  }

  reset() {
    this.previous = {};
  }
}

/**
 * Sliding window moving average (alternative to exponential).
 */
export class MovingAverageSmoother {
  /**
   * @param {number} [windowSize=5]
   */
  constructor(windowSize = 5) {
    this.windowSize = Math.max(1, windowSize);
    /** @type {Record<string, number[]>} */
    this.buffers = {};
  }

  /**
   * @param {string} key
   * @param {number} value
   * @returns {number}
   */
  smooth(key, value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return value;

    if (!this.buffers[key]) this.buffers[key] = [];
    const buf = this.buffers[key];
    buf.push(value);
    if (buf.length > this.windowSize) buf.shift();

    const sum = buf.reduce((a, b) => a + b, 0);
    return sum / buf.length;
  }

  smoothAll(values) {
    const result = {};
    for (const [k, v] of Object.entries(values)) {
      if (v != null) result[k] = this.smooth(k, v);
    }
    return result;
  }

  reset() {
    this.buffers = {};
  }
}
