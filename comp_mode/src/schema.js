/**
 * JSON Schema for Overshoot outputSchema.
 * When shot_detected is false, only shot_detected is required.
 * When shot_detected is true, all other fields should be filled with value + confidence where applicable.
 */
export const SHOT_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    shot_detected: {
      type: 'boolean',
      description: 'True if the opponent struck the ball in this clip, false otherwise.',
    },
    serve_type: {
      type: 'object',
      properties: {
        value: { type: 'string', description: 'e.g. "short backspin serve", "not a serve"' },
        confidence: { type: 'number', description: '0-1' },
      },
    },
    spin_type: {
      type: 'object',
      properties: {
        value: { type: 'string', description: 'e.g. topspin, backspin, sidespin, flat, uncertain' },
        confidence: { type: 'number', description: '0-1' },
      },
    },
    ball_landing: {
      type: 'object',
      properties: {
        zone: { type: 'string', description: 'e.g. near net, mid-table, deep right corner' },
        angle: { type: 'string', description: 'e.g. low and fast, medium arc' },
        confidence: { type: 'number', description: '0-1' },
      },
    },
    opponent_position: {
      type: 'object',
      properties: {
        distance_from_table: { type: 'string', description: 'e.g. close, mid-distance, far back' },
        lateral_position: { type: 'string', description: 'left, center, or right' },
        confidence: { type: 'number', description: '0-1' },
      },
    },
    joint_angles: {
      type: 'object',
      properties: {
        shoulder: { type: 'string', description: 'e.g. open, closed' },
        elbow: { type: 'string', description: 'e.g. bent ~90 degrees, extended' },
        wrist: { type: 'string', description: 'e.g. neutral, slightly flexed' },
        confidence: { type: 'number', description: '0-1' },
      },
    },
  },
  required: ['shot_detected'],
};
