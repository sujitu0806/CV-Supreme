/**
 * Ping pong–specific optimal angle ranges and feedback.
 * Tuned for close-to-table offensive play. Compact movements, control, spin, reaction speed.
 */

/**
 * @typedef {Object} JointFeedbackConfig
 * @property {number} optimalMin - Green: optimal range start
 * @property {number} optimalMax - Green: optimal range end
 * @property {number} yellowMargin - Degrees outside optimal → yellow (usable)
 * @property {number} redMarginLow - Below optimalMin - this → red
 * @property {number} redMarginHigh - Above optimalMax + this → red (elbow: avoid >150)
 * @property {Record<string, string>} hints
 */

/** Base ranges for close-to-table offensive play */
export const PING_PONG_JOINT_CONFIG = {
  leftElbow: {
    optimalMin: 70,
    optimalMax: 110,
    yellowMargin: 15,
    redMarginLow: 25,
    redMarginHigh: 40,
    hints: {
      tooLow: 'Elbow too closed for effective stroke',
      tooHigh: 'Elbow too open for fast recovery',
      optimal: 'Good elbow position',
    },
  },
  rightElbow: {
    optimalMin: 70,
    optimalMax: 110,
    yellowMargin: 15,
    redMarginLow: 25,
    redMarginHigh: 40,
    hints: {
      tooLow: 'Elbow too closed for effective stroke',
      tooHigh: 'Elbow too open for fast recovery',
      optimal: 'Good elbow position',
    },
  },
  leftShoulder: {
    optimalMin: 30,
    optimalMax: 60,
    yellowMargin: 12,
    redMarginLow: 20,
    redMarginHigh: 20,
    hints: {
      tooLow: 'Shoulder too closed',
      tooHigh: 'Excessive shoulder opening reduces recovery speed',
      optimal: 'Good shoulder rotation',
    },
  },
  rightShoulder: {
    optimalMin: 30,
    optimalMax: 60,
    yellowMargin: 12,
    redMarginLow: 20,
    redMarginHigh: 20,
    hints: {
      tooLow: 'Shoulder too closed',
      tooHigh: 'Excessive shoulder opening reduces recovery speed',
      optimal: 'Good shoulder rotation',
    },
  },
  leftWrist: {
    optimalMin: 160,
    optimalMax: 180,
    yellowMargin: 10,
    redMarginLow: 20,
    redMarginHigh: 20,
    hints: {
      tooLow: 'Wrist too flexed — consistency at risk',
      tooHigh: 'Wrist angle extreme',
      optimal: 'Neutral wrist good for control',
    },
  },
  rightWrist: {
    optimalMin: 160,
    optimalMax: 180,
    yellowMargin: 10,
    redMarginLow: 20,
    redMarginHigh: 20,
    hints: {
      tooLow: 'Wrist too flexed — consistency at risk',
      tooHigh: 'Wrist angle extreme',
      optimal: 'Neutral wrist good for control',
    },
  },
};

/** Style modifiers: additive degrees (for non-stroke-based style) */
export const PLAYER_STYLE_MODIFIERS = {
  default: { elbow: 0, shoulder: 0, wrist: 0 },
  forehand: { elbow: 5, shoulder: 5, wrist: 0 },
  backhand: { elbow: -5, shoulder: -5, wrist: 0 },
  offensive: { elbow: 0, shoulder: 10, wrist: 0 },
  defensive: { elbow: 0, shoulder: -5, wrist: 0 },
  closeToTable: { elbow: 0, shoulder: 0, wrist: 0 },
  midDistance: { elbow: 10, shoulder: 15, wrist: 0 },
};

/** Forehand stroke profile: larger shoulder rotation, more elbow extension at contact */
export const FOREHAND_STROKE_CONFIG = {
  leftElbow: { optimalMin: 70, optimalMax: 125, yellowMargin: 15, redMarginLow: 25, redMarginHigh: 30, hints: { tooLow: 'Elbow too closed', tooHigh: 'Elbow too open for recovery', optimal: 'Good' } },
  rightElbow: { optimalMin: 70, optimalMax: 125, yellowMargin: 15, redMarginLow: 25, redMarginHigh: 30, hints: { tooLow: 'Elbow too closed', tooHigh: 'Elbow too open for recovery', optimal: 'Good' } },
  leftShoulder: { optimalMin: 30, optimalMax: 70, yellowMargin: 12, redMarginLow: 20, redMarginHigh: 25, hints: { tooLow: 'Shoulder too closed', tooHigh: 'Excessive opening', optimal: 'Good' } },
  rightShoulder: { optimalMin: 30, optimalMax: 70, yellowMargin: 12, redMarginLow: 20, redMarginHigh: 25, hints: { tooLow: 'Shoulder too closed', tooHigh: 'Excessive opening', optimal: 'Good' } },
  leftWrist: { optimalMin: 155, optimalMax: 180, yellowMargin: 10, redMarginLow: 20, redMarginHigh: 20, hints: { tooLow: 'Wrist too flexed', tooHigh: 'Wrist extreme', optimal: 'Good' } },
  rightWrist: { optimalMin: 155, optimalMax: 180, yellowMargin: 10, redMarginLow: 20, redMarginHigh: 20, hints: { tooLow: 'Wrist too flexed', tooHigh: 'Wrist extreme', optimal: 'Good' } },
};

/** Backhand stroke profile: compact elbow, reduced shoulder, faster recovery */
export const BACKHAND_STROKE_CONFIG = {
  leftElbow: { optimalMin: 60, optimalMax: 95, yellowMargin: 12, redMarginLow: 20, redMarginHigh: 25, hints: { tooLow: 'Elbow too closed', tooHigh: 'Elbow too open — reduce for recovery', optimal: 'Good' } },
  rightElbow: { optimalMin: 60, optimalMax: 95, yellowMargin: 12, redMarginLow: 20, redMarginHigh: 25, hints: { tooLow: 'Elbow too closed', tooHigh: 'Elbow too open — reduce for recovery', optimal: 'Good' } },
  leftShoulder: { optimalMin: 25, optimalMax: 50, yellowMargin: 10, redMarginLow: 18, redMarginHigh: 18, hints: { tooLow: 'Shoulder too closed', tooHigh: 'Reduce shoulder — faster recovery', optimal: 'Good' } },
  rightShoulder: { optimalMin: 25, optimalMax: 50, yellowMargin: 10, redMarginLow: 18, redMarginHigh: 18, hints: { tooLow: 'Shoulder too closed', tooHigh: 'Reduce shoulder — faster recovery', optimal: 'Good' } },
  leftWrist: { optimalMin: 160, optimalMax: 180, yellowMargin: 10, redMarginLow: 20, redMarginHigh: 20, hints: { tooLow: 'Wrist too flexed', tooHigh: 'Wrist extreme', optimal: 'Good' } },
  rightWrist: { optimalMin: 160, optimalMax: 180, yellowMargin: 10, redMarginLow: 20, redMarginHigh: 20, hints: { tooLow: 'Wrist too flexed', tooHigh: 'Wrist extreme', optimal: 'Good' } },
};

/**
 * Get config for stroke type. Falls back to PING_PONG_JOINT_CONFIG when null.
 */
export function getConfigForStroke(stroke) {
  if (stroke === 'forehand') return FOREHAND_STROKE_CONFIG;
  if (stroke === 'backhand') return BACKHAND_STROKE_CONFIG;
  return null;
}

/**
 * Get feedback (color + hint) for angle.
 * @param {number} angle
 * @param {JointFeedbackConfig} config
 * @param {boolean} isAsymmetric
 * @returns {{ color: string, hint: string }}
 */
export function getPingPongFeedback(angle, config, isAsymmetric) {
  if (isAsymmetric) {
    return { color: 'red', hint: 'Left/right asymmetry — check form' };
  }
  if (angle == null || !config) return { color: 'green', hint: '' };

  const { optimalMin, optimalMax, yellowMargin, redMarginLow = 25, redMarginHigh = 25, hints } = config;

  if (angle >= optimalMin && angle <= optimalMax) {
    return { color: 'green', hint: hints.optimal };
  }

  if (angle < optimalMin) {
    const diff = optimalMin - angle;
    const isRed = diff > redMarginLow;
    return {
      color: isRed ? 'red' : 'yellow',
      hint: isRed ? hints.tooLow : hints.optimal,
    };
  }

  if (angle > optimalMax) {
    const diff = angle - optimalMax;
    const isRed = diff > redMarginHigh;
    return {
      color: isRed ? 'red' : 'yellow',
      hint: isRed ? hints.tooHigh : hints.optimal,
    };
  }

  return { color: 'green', hint: hints.optimal };
}

/**
 * Apply style modifiers to config.
 * @param {JointFeedbackConfig} config
 * @param {string} jointName
 * @param {keyof typeof PLAYER_STYLE_MODIFIERS} [style]
 */
export function applyStyleModifier(config, jointName, style = 'default') {
  const mod = PLAYER_STYLE_MODIFIERS[style] ?? PLAYER_STYLE_MODIFIERS.default;
  let shift = 0;
  if (jointName.includes('Elbow')) shift = mod.elbow;
  else if (jointName.includes('Shoulder')) shift = mod.shoulder;
  else if (jointName.includes('Wrist')) shift = mod.wrist;

  return {
    ...config,
    optimalMin: config.optimalMin + shift,
    optimalMax: config.optimalMax + shift,
  };
}

/** Backward compat: [min, max] for arc color logic */
export function toAngleRanges(config) {
  const c = config || {};
  return [c.optimalMin ?? 0, c.optimalMax ?? 180];
}
