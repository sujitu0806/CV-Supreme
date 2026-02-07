/**
 * Types for Training Mode observations.
 * Output is DATA ONLY; no intent or coaching advice.
 */

/**
 * @typedef {Object} BallPlacement
 * @property {string} zone - e.g. near net, mid-table, deep left corner
 * @property {number} confidence - 0-1
 */

/**
 * @typedef {Object} ValueConfidence
 * @property {string} value - e.g. topspin, drive, uncertain
 * @property {number} confidence - 0-1
 */

/**
 * @typedef {Object} PlayerLocation
 * @property {string} distance_from_table - close | mid-distance | far back
 * @property {string} lateral_position - left | center | right
 * @property {number} confidence - 0-1
 */

/**
 * @typedef {Object} PlayerLocations
 * @property {PlayerLocation} player_a
 * @property {PlayerLocation} player_b
 */

/**
 * One observation per video clip: shot, ball placement, and both players' positions.
 * Consumed by downstream aggregator for training feedback.
 * @typedef {Object} TrainingObservation
 * @property {string} timestamp - Client-side time when result was received (e.g. "00:02:14.820")
 * @property {BallPlacement} ball_placement
 * @property {ValueConfidence} spin_type
 * @property {ValueConfidence} shot_type
 * @property {PlayerLocations} player_locations
 */
