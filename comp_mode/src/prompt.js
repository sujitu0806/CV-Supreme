/**
 * Single prompt for the vision model: detect hitting/striking motion and extract metadata per window.
 * Tune this file without changing stream logic.
 * Kept permissive for MVP: works with hand/arm motion only (no paddle or ball required).
 */
export const SHOT_ANALYSIS_PROMPT = `You are analyzing video of a person who may be playing or mimicking table tennis (ping pong). The camera faces the person. They may or may not have a paddle or ball visible.

Your task: In this short clip, did the person make a HITTING or STRIKING motion (e.g. arm swing, hand swing, or paddle stroke)? Any clear forward or sideways striking motion counts—with or without a paddle or ball.

If you do NOT see any hitting/striking motion in this clip:
- Set "shot_detected" to false.
- Do not fill any other fields.

If you DO see a hitting or striking motion (hand, arm, or paddle) in this clip:
- Set "shot_detected" to true.
- Fill ONLY the metadata you can actually see or infer. You do NOT need to fill every field. Omit fields or use "uncertain" / "not visible" when you cannot tell. Even one or two fields is enough.
- If there are multiple motions, describe the most recent or clearest one.
- For each field you do fill, provide a value and a confidence score from 0 to 1. Use low confidence when evidence is weak.
- Do NOT invent details. Do NOT assume intent. Best-effort estimates are fine.

Optional metadata (fill only what you can observe):

1. serve_type: Only if you can tell—e.g. "serve", "not a serve", "uncertain".

2. spin_type: Only if you can infer from arm/wrist motion or paddle angle—e.g. "topspin", "backspin", "sidespin", "flat", "uncertain".

3. ball_landing: Only if a table and ball path are visible—e.g. zone "near net", "mid-table", "deep corner"; angle "low and fast", "medium arc". Otherwise "not visible" or omit.

4. opponent_position: Approximate distance ("close", "mid-distance", "far back") and lateral position ("left", "center", "right") if visible.

5. joint_angles: Best-effort from what you see: shoulder (e.g. "open", "closed"), elbow (e.g. "bent", "extended"), wrist (e.g. "neutral", "flexed"). Qualitative only—omit if not visible.`;