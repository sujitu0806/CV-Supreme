/**
 * Paddle-focused vision prompt for Live Competition Mode.
 *
 * Purpose:
 * Extract low-level, observable paddle motion primitives from a short
 * video clip. These primitives will be consumed by a downstream LLM
 * to diagnose shot type, spin, and strategy.
 *
 * This prompt intentionally avoids naming shot types or tactics.
 * It focuses ONLY on what can be visually observed from the paddle.
 */
export const SHOT_ANALYSIS_PROMPT = `
You are analyzing a short video clip from a live, front-facing camera.
The camera faces an opponent actively playing ping pong.

IMPORTANT:
Your task is NOT to analyze the full body or infer intent.
Your task is to focus ONLY on the PADDLE and its motion over time.

You MUST reason TEMPORALLY.
Compare earlier frames to later frames to detect motion, orientation
changes, and follow-through.

Assume the paddle may be partially occluded at times.
Best-effort estimates are acceptable.

========================
PRIMARY OBJECT OF INTEREST
========================
- The ping pong paddle (if visible)
- The hand holding the paddle
- Ignore facial expression, stance, or full-body pose
- Ignore ball unless it clearly aids paddle motion inference

========================
STEP 1 — PADDLE VISIBILITY
========================
Determine whether a paddle is visible at any point in the clip.

If NO paddle is visible:
- Set "paddle_visible" to false
- Do NOT fill any other fields
- Return immediately

If paddle IS visible:
- Set "paddle_visible" to true
- Continue to motion analysis

========================
STEP 2 — STRIKING MOTION
========================
Determine whether the paddle undergoes a STRIKING MOTION.

A striking motion is defined as:
- Rapid movement of the paddle over a short time window
- Clear acceleration followed by deceleration or follow-through
- Linear or rotational motion consistent with hitting a ball

Slow repositioning or idle holding does NOT count.

If NO striking motion is detected:
- Set "strike_detected" to false
- Do NOT fill any other fields
- Return immediately

If a striking motion IS detected:
- Set "strike_detected" to true
- Analyze ONLY the clearest or most recent striking motion

========================
STEP 3 — STATIC PADDLE CONTEXT
========================
Extract context that does NOT require knowing the shot outcome.

--- Handedness ---
Which hand is holding the paddle?
- "left_hand"
- "right_hand"
- "uncertain"

--- Paddle distance from camera ---
Approximate distance of the paddle at strike moment:
- "close" (dominates frame, near camera)
- "medium"
- "far" (small in frame, near table or body)
- "uncertain"

--- Paddle side ---
If visible, identify which side of the paddle faces the camera:
- "red"
- "black"
- "uncertain"

========================
STEP 4 — MOTION PRIMITIVES
========================
Extract ONLY what you can directly observe.
Do NOT infer shot names, intent, or strategy.

For each field you include:
- Provide a value
- Provide a confidence score (0.0–1.0)
- Use "uncertain" or omit fields if evidence is weak

--- Paddle face orientation (near contact moment) ---
Vertical angle relative to table:
- "angled_up"
- "angled_down"
- "mostly_vertical"
- "uncertain"

Lateral orientation:
- "inward" (toward player’s body)
- "neutral"
- "outward"
- "uncertain"

--- Motion direction ---
Dominant paddle movement:
- Horizontal direction: "left_to_right", "right_to_left", "none"
- Vertical component: "upward", "downward", "minimal"
- Motion plane: "mostly_horizontal", "mostly_vertical", "diagonal"

--- Speed (qualitative) ---
Relative speed of the striking motion:
- "very_slow"
- "slow"
- "medium"
- "fast"
- "very_fast"

--- Follow-through ---
Motion after the main strike:
- "long_forward"
- "short_cutoff"
- "rotational"
- "none_visible"
- "uncertain"

--- Rotation / wrist action (if visible) ---
Observed rotational behavior:
- "pronation"
- "supination"
- "wrist_snap"
- "none_visible"
- "uncertain"

========================
OPTIONAL ADDITIONAL SIGNALS
========================
Include ONLY if clearly visible:

- Approximate strike height relative to table:
  "below_table", "near_table", "above_table"

- Swing timing within arc:
  "early", "on_time", "late"

========================
OUTPUT FORMAT
========================
Return a single structured object.

Example (illustrative only):

{
  "paddle_visible": true,
  "strike_detected": true,
  "handedness": {
    "value": "right_hand",
    "confidence": 0.86
  },
  "paddle_distance": {
    "value": "medium",
    "confidence": 0.73
  },
  "paddle_side": {
    "value": "red",
    "confidence": 0.80
  },
  "face_orientation": {
    "vertical_angle": {
      "value": "angled_up",
      "confidence": 0.69
    },
    "lateral_angle": {
      "value": "inward",
      "confidence": 0.66
    }
  },
  "motion": {
    "horizontal_direction": {
      "value": "left_to_right",
      "confidence": 0.78
    },
    "vertical_component": {
      "value": "upward",
      "confidence": 0.61
    },
    "plane": {
      "value": "diagonal",
      "confidence": 0.72
    }
  },
  "speed": {
    "value": "fast",
    "confidence": 0.75
  },
  "follow_through": {
    "value": "long_forward",
    "confidence": 0.70
  },
  "rotation": {
    "value": "wrist_snap",
    "confidence": 0.64
  }
}

========================
RULES
========================
- Focus on observable paddle motion only
- Do NOT name shot types or spins
- Do NOT hallucinate ball trajectory
- Conservative estimates are preferred
- Motion primitives are more important than completeness
`;