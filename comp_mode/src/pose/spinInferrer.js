/**
 * Spin inference from paddle face angle (vertical-relative) and motion direction.
 * Primary input: faceAngleToVertical. Secondary: paddle motion.
 */

/** @typedef {'topspin' | 'backspin' | 'unclear'} SpinType */

const HISTORY_LENGTH = 12;
const SMOOTH_VOTES = 5;
const ANGLE_THRESHOLD = 12;
const MOTION_WEIGHT = 0.35;

export class SpinInferrer {
  constructor(config = {}) {
    this.dominantHand = config.dominantHand ?? 'right';
    /** @type {number[]} */
    this.paddleHistoryY = [];
    /** @type {number[]} */
    this.angleHistory = [];
    /** @type {number[]} */
    this.topspinVotes = [];
  }

  setDominantHand(hand) {
    this.dominantHand = hand === 'left' ? 'left' : 'right';
  }

  /**
   * Infer spin from paddle data (legacy - paddle tracking removed).
   * @param {{ valid?: boolean, position?: { y: number }, faceAngleToVertical?: number } | null} paddle
   * @returns {{ spin: SpinType, confidence: number }}
   */
  infer(paddle) {
    if (!paddle?.valid) return { spin: 'unclear', confidence: 0 };

    const angle = paddle.faceAngleToVertical ?? 0;
    this.angleHistory.push(angle);
    if (this.angleHistory.length > HISTORY_LENGTH) this.angleHistory.shift();

    this.paddleHistoryY.push(paddle.position.y);
    if (this.paddleHistoryY.length > HISTORY_LENGTH) this.paddleHistoryY.shift();

    let motionDir = 0;
    if (this.paddleHistoryY.length >= 6) {
      const dy = this.paddleHistoryY[this.paddleHistoryY.length - 1] - this.paddleHistoryY[0];
      if (Math.abs(dy) > 0.002) motionDir = -dy;
    }

    const avgAngle = this.angleHistory.reduce((a, b) => a + b, 0) / this.angleHistory.length;
    let vote = 0;
    if (avgAngle > ANGLE_THRESHOLD) vote = 1;
    else if (avgAngle < -ANGLE_THRESHOLD) vote = -1;
    if (motionDir > 0) vote += 0.4;
    else if (motionDir < 0) vote -= 0.4;

    this.topspinVotes.push(vote > 0 ? 1 : vote < 0 ? 0 : 0.5);
    if (this.topspinVotes.length > SMOOTH_VOTES) this.topspinVotes.shift();

    const ratio = this.topspinVotes.reduce((a, b) => a + b, 0) / this.topspinVotes.length;
    const confidence = Math.abs(ratio - 0.5) * 2;

    let spin = 'unclear';
    if (confidence >= 0.45) {
      spin = ratio > 0.55 ? 'topspin' : 'backspin';
    }

    return { spin, confidence };
  }

  reset() {
    this.paddleHistoryY = [];
    this.angleHistory = [];
    this.topspinVotes = [];
  }
}
