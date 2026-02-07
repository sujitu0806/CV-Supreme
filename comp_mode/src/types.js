/**
 * Paddle-focused competition mode: observable paddle motion primitives.
 * Consumed by downstream LLM for shot type / spin / strategy diagnosis.
 */

/**
 * @typedef {Object} ValueConfidence
 * @property {string} value
 * @property {number} confidence
 */

/**
 * @typedef {Object} FaceOrientation
 * @property {ValueConfidence} vertical_angle
 * @property {ValueConfidence} lateral_angle
 */

/**
 * @typedef {Object} Motion
 * @property {ValueConfidence} horizontal_direction
 * @property {ValueConfidence} vertical_component
 * @property {ValueConfidence} plane
 */

/**
 * One paddle-strike observation emitted when paddle is visible and/or strike detected.
 * @typedef {Object} ShotObservation
 * @property {string} shot_timestamp
 * @property {boolean} paddle_visible
 * @property {boolean} strike_detected
 * @property {ValueConfidence} person_position_in_frame - centered | left | right (camera/viewer perspective)
 * @property {ValueConfidence} handedness
 * @property {ValueConfidence} paddle_distance
 * @property {ValueConfidence} paddle_side - red (forehand face) or black (backhand face)
 * @property {FaceOrientation} face_orientation
 * @property {Motion} motion
 * @property {ValueConfidence} speed
 * @property {ValueConfidence} follow_through
 * @property {ValueConfidence} rotation
 * @property {string} [strike_height]
 * @property {string} [swing_timing]
 */
