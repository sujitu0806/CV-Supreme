/**
 * Training Mode: vision prompt for extracting structured gameplay metadata.
 * Camera is on the SIDE of the table; BOTH players are visible.
 * Used with Overshoot for prompt-driven vision reasoning.
 */

export const TRAINING_ANALYSIS_PROMPT = `You are analyzing table tennis (ping pong) practice or friendly match footage. The camera is positioned on the SIDE of the table, angled slightly downward. BOTH players are visible in frame. The table, paddles, and ball are generally visible, with occasional occlusion during fast motion.

Your task: For this short clip of video, extract structured metadata describing shots, ball placement, and player positioning. This data will be used for training analysis and coaching-style feedback for BOTH players. Do NOT infer intent, strategy, or coaching advice—output DATA ONLY.

Rules:
- Do NOT invent details that are not visible. If something is unclear or occluded, use "uncertain" or "unknown" and set confidence low (0–1).
- Prefer conservative, explainable estimates. Clearly mark uncertainty.
- For each field, provide a confidence score from 0 to 1. Use low confidence when visual evidence is weak.

Extract the following when possible:

1. ball_placement: Approximate landing location of the ball on the table (if a shot is visible in this clip). Use zones such as: "near net", "mid-table", "deep", "deep left corner", "deep right corner", "center", "corner". If no clear shot or landing is visible, use "unknown" and low confidence.

2. spin_type: Type of spin on the ball, inferred from paddle motion and visible trajectory. Examples: "topspin", "backspin", "sidespin", "flat", "uncertain". Use "uncertain" when unclear.

3. shot_type: Type of shot being played. Examples: "serve", "push", "drive", "loop", "smash", "block", "chop". If no clear shot in clip or type is ambiguous, use "unknown" or "uncertain".

4. player_locations: For BOTH players (player_a and player_b), estimate:
   - distance_from_table: "close", "mid-distance", or "far back"
   - lateral_position: "left", "center", or "right" (from camera's point of view)
   Use "unknown" and low confidence if a player is not clearly visible.

Return one structured object per clip. If multiple shots appear in the clip, describe the most recent or clearest one. When in doubt, prefer "uncertain" or low confidence over guessing.`;
