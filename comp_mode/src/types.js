/**
 * @typedef {Object} ValueConfidence
 * @property {string} value
 * @property {number} confidence
 */

/**
 * @typedef {Object} BallLanding
 * @property {string} zone
 * @property {string} angle
 * @property {number} confidence
 */

/**
 * @typedef {Object} OpponentPosition
 * @property {string} distance_from_table
 * @property {string} lateral_position
 * @property {number} confidence
 */

/**
 * @typedef {Object} JointAngles
 * @property {string} shoulder
 * @property {string} elbow
 * @property {string} wrist
 * @property {number} confidence
 */

/**
 * One opponent shot observation emitted when a shot is detected.
 * Consumed by downstream aggregator for playstyle inference.
 * @typedef {Object} ShotObservation
 * @property {string} shot_timestamp - Client-side time when result was received (e.g. "14:32:01.234")
 * @property {ValueConfidence} serve_type
 * @property {ValueConfidence} spin_type
 * @property {BallLanding} ball_landing
 * @property {OpponentPosition} opponent_position
 * @property {JointAngles} joint_angles
 */
