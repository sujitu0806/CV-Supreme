/**
 * JSON Schema for Overshoot outputSchema (paddle-focused competition mode).
 * Matches prompt.js: paddle_visible, strike_detected, then optional motion primitives.
 */
export const SHOT_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    paddle_visible: { type: 'boolean', description: 'True if paddle is visible in the clip' },
    strike_detected: { type: 'boolean', description: 'True if a striking motion of the paddle was detected' },
    person_position_in_frame: {
      type: 'object',
      properties: { value: { type: 'string' }, confidence: { type: 'number' } },
      description: 'Where the person is in the frame: centered, left, or right (camera/viewer perspective)',
    },
    handedness: {
      type: 'object',
      properties: { value: { type: 'string' }, confidence: { type: 'number' } },
    },
    paddle_distance: {
      type: 'object',
      properties: { value: { type: 'string' }, confidence: { type: 'number' } },
    },
    paddle_side: {
      type: 'object',
      properties: { value: { type: 'string' }, confidence: { type: 'number' } },
    },
    face_orientation: {
      type: 'object',
      properties: {
        vertical_angle: { type: 'object', properties: { value: { type: 'string' }, confidence: { type: 'number' } } },
        vertical_angle_degrees_estimate: { type: 'number', description: 'Optional estimate in degrees (0-180) of paddle face to table' },
        lateral_angle: { type: 'object', properties: { value: { type: 'string' }, confidence: { type: 'number' } } },
      },
    },
    motion: {
      type: 'object',
      properties: {
        horizontal_direction: { type: 'object', properties: { value: { type: 'string' }, confidence: { type: 'number' } } },
        vertical_component: { type: 'object', properties: { value: { type: 'string' }, confidence: { type: 'number' } } },
        plane: { type: 'object', properties: { value: { type: 'string' }, confidence: { type: 'number' } } },
      },
    },
    speed: {
      type: 'object',
      properties: { value: { type: 'string' }, confidence: { type: 'number' } },
    },
    follow_through: {
      type: 'object',
      properties: { value: { type: 'string' }, confidence: { type: 'number' } },
    },
    rotation: {
      type: 'object',
      properties: { value: { type: 'string' }, confidence: { type: 'number' } },
    },
    strike_height: { type: 'string' },
    swing_timing: { type: 'string' },
  },
  required: ['paddle_visible'],
};
