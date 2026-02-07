/**
 * JSON Schema for Overshoot outputSchema (Training Mode).
 * Ensures structured output with confidence scores and explicit uncertainty.
 */

export const TRAINING_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ball_placement: {
      type: 'object',
      description: 'Approximate landing zone of the ball on the table.',
      properties: {
        zone: {
          type: 'string',
          description: 'e.g. near net, mid-table, deep, deep left corner, deep right corner, center, corner, unknown',
        },
        confidence: { type: 'number', description: '0-1' },
      },
      required: ['zone', 'confidence'],
    },
    spin_type: {
      type: 'object',
      description: 'Type of spin inferred from paddle and trajectory.',
      properties: {
        value: {
          type: 'string',
          description: 'e.g. topspin, backspin, sidespin, flat, uncertain',
        },
        confidence: { type: 'number', description: '0-1' },
      },
      required: ['value', 'confidence'],
    },
    shot_type: {
      type: 'object',
      description: 'Type of shot being played.',
      properties: {
        value: {
          type: 'string',
          description: 'e.g. serve, push, drive, loop, smash, block, chop, unknown, uncertain',
        },
        confidence: { type: 'number', description: '0-1' },
      },
      required: ['value', 'confidence'],
    },
    player_locations: {
      type: 'object',
      description: 'Approximate positions of both players.',
      properties: {
        player_a: {
          type: 'object',
          properties: {
            distance_from_table: {
              type: 'string',
              description: 'close, mid-distance, far back, unknown',
            },
            lateral_position: {
              type: 'string',
              description: 'left, center, right, unknown',
            },
            confidence: { type: 'number', description: '0-1' },
          },
          required: ['distance_from_table', 'lateral_position', 'confidence'],
        },
        player_b: {
          type: 'object',
          properties: {
            distance_from_table: {
              type: 'string',
              description: 'close, mid-distance, far back, unknown',
            },
            lateral_position: {
              type: 'string',
              description: 'left, center, right, unknown',
            },
            confidence: { type: 'number', description: '0-1' },
          },
          required: ['distance_from_table', 'lateral_position', 'confidence'],
        },
      },
      required: ['player_a', 'player_b'],
    },
  },
  required: ['ball_placement', 'spin_type', 'shot_type', 'player_locations'],
};
