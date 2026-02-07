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

--- Person position in frame (use THRESHOLDS) ---
Divide the frame width into three equal vertical bands (left 33%, center 33%, right 33%) from the VIEWER’s perspective.
Where does the CENTER OF MASS of the person (torso/body) fall?
- "left" — center of mass is in the LEFT third of the frame (leftmost 0–33% of frame width)
- "centered" — center of mass is in the MIDDLE third (33–67% of frame width)
- "right" — center of mass is in the RIGHT third (67–100% of frame width)
- "uncertain" — only if you truly cannot judge
Do NOT default to "centered". Actively decide which third contains most of the person.

--- Handedness ---
Which hand is holding the paddle?
- "left_hand"
- "right_hand"
- "uncertain"

--- Paddle distance from camera (use SENSITIVE bands) ---
At the strike moment, how large does the paddle (or paddle+hand) appear in the frame?
Use the paddle’s apparent size relative to frame height as the main cue:
- "very_close" — paddle/hand occupies a large part of the frame (e.g. paddle length > ~25% of frame height); arm and paddle in clear detail
- "close" — paddle clearly prominent (e.g. ~15–25% of frame height); easily visible
- "medium" — paddle visible but not dominant (e.g. ~8–15% of frame height); mid-range
- "far" — paddle small (e.g. ~4–8% of frame height); table or body dominates
- "very_far" — paddle quite small (e.g. < ~4% of frame height); near table or distant
Reserve "medium" only when truly between close and far. Prefer "close" or "far" when the paddle is clearly not in the middle range.
- "uncertain" — only if occlusion or motion blur prevents judgment

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

--- Paddle face vertical angle (near contact) — CRITICAL: ESTIMATE DEGREES FIRST ---
You MUST output "vertical_angle_degrees_estimate" as a number from 0 to 180. This is the angle of the paddle FACE to the TABLE PLANE (horizontal). Then set "vertical_angle" to the band that contains that number.

How to read the angle from the CAMERA view (front-facing the opponent):
- 0° = paddle face lying flat on the table (face horizontal).
- 90° = paddle vertical, edge toward ceiling (face perpendicular to table).
- LARGE angle (120°–180°), BACKSPIN: The TOP EDGE of the paddle is tilted FORWARD — toward the camera or toward the net. The face appears to be "closing" or angled so it would chop down over the ball. The face is tilted AWAY from vertical in the direction of "face pointing somewhat down/forward." Use 135–180 when this is strong.
- SMALL angle (0°–60°), TOPSPIN: The TOP EDGE of the paddle is tilted BACK — away from the camera, toward the ceiling or the player's body. The face "opens" upward. Use 0–45 when the face is clearly tilted back.

Do NOT default to closed_0_to_45. Actively decide: is the top edge forward (→ large angle, backspin) or back (→ small angle, topspin)?

Bands (set "vertical_angle" to match your vertical_angle_degrees_estimate):
- "strongly_open_135_to_180" — 135°–180°. Top edge forward; BACKSPIN. Use when paddle is clearly closed/chopping.
- "open_90_to_135" — 90°–135°. Between vertical and strongly open.
- "vertical_near_90" — ~80°–100°. Paddle roughly vertical.
- "neutral_45_to_90" — 45°–90°. Between closed and vertical.
- "closed_0_to_45" — 0°–45°. Top edge back; TOPSPIN. Use only when face is tilted back/up.
- "uncertain" — only if angle is not discernible (still try to output a number if possible).

Lateral orientation:
- "inward" (toward player’s body)
- "neutral"
- "outward"
- "uncertain"

--- Motion direction ---
Dominant paddle movement. All directions use the CAMERA / VIEWER perspective (as seen on the video):
- Horizontal direction:
  - "left_to_right" — paddle moves from the LEFT side of the frame toward the RIGHT side (viewer’s left → viewer’s right)
  - "right_to_left" — paddle moves from the RIGHT side of the frame toward the LEFT (viewer’s right → viewer’s left)
  - "none"
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
  "person_position_in_frame": {
    "value": "centered",
    "confidence": 0.82
  },
  "handedness": {
    "value": "right_hand",
    "confidence": 0.86
  },
  "paddle_distance": {
    "value": "close",
    "confidence": 0.73
  },
  "paddle_side": {
    "value": "red",
    "confidence": 0.80
  },
  "face_orientation": {
    "vertical_angle": {
      "value": "closed_0_to_45",
      "confidence": 0.69
    },
    "vertical_angle_degrees_estimate": 35,
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
- USE THE THRESHOLDS: person position (left/center/right thirds), paddle distance (size bands), vertical angle (degree ranges). Do not default to "medium" or "centered" or "mostly_vertical" without actively checking the criteria.
- When in doubt, prefer a specific band over "uncertain" if you have a reasonable estimate
- Motion primitives are more important than completeness
`;