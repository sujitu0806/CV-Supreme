/**
 * Single prompt for the vision model: detect opponent shot and extract metadata per window.
 * Tune this file without changing stream logic.
 */
export const SHOT_ANALYSIS_PROMPT = `You are analyzing a LIVE table tennis (ping pong) match. The camera is positioned with a FRONT-FACING view of the OPPONENT (the person across the table from the camera). The opponent is the primary subject. The table, paddle, and ball may be partially visible.

Your task: For this short clip of video, determine whether the OPPONENT struck the ball. Analyze ONLY the opponent—not any other player.

If the opponent did NOT strike the ball in this clip:
- Set "shot_detected" to false.
- Do not fill any other fields.

If the opponent DID strike the ball in this clip:
- Set "shot_detected" to true.
- Fill all metadata below. If there are multiple shots in the clip, describe the most recent or clearest one only.
- For each field, provide a value and a confidence score from 0 to 1. Use low confidence or "uncertain" when visual evidence is weak.
- Do NOT invent details that are not visible. Do NOT assume player intent or strategy. Prefer conservative estimates.

Required metadata when shot_detected is true:

1. serve_type: Is this shot a serve? If yes, describe the serve (e.g. "short backspin serve", "long topspin serve", "side-spin serve"). If not a serve, use "not a serve".

2. spin_type: Infer from paddle angle, swing motion, follow-through, and any visible ball behavior. Examples: "topspin", "backspin", "sidespin", "flat", "uncertain".

3. ball_landing: Approximate landing zone on the far side of the table (the side away from the opponent), e.g. "near net", "mid-table", "deep left corner", "deep right corner". Also describe trajectory angle: e.g. "low and fast", "medium arc", "high and steep".

4. opponent_position: Approximate distance from the table ("close", "mid-distance", "far back") and lateral position from camera view ("left", "center", "right").

5. joint_angles: Rough visual estimates only—no need to be precise. Describe shoulder (e.g. "open", "closed"), elbow (e.g. "bent ~90 degrees", "extended"), wrist (e.g. "neutral", "slightly flexed"). Use qualitative terms or coarse numbers.`;
