/**
 * Gemini prompt for opponent play-style analysis from comp-mode session metadata.
 * Input: MediaPipe only (joint angles, ROM, symmetry). No paddle/camera metadata.
 * Output: play style, common shots inferred from posture/angles, and very short combat suggestions.
 */

export const SYSTEM_INSTRUCTION = `You are a table tennis coach. You will receive ONLY MediaPipe pose data: joint angles (elbows, wrists, knees, shoulders, hips), range of motion (ROM) per joint, and left/right symmetry. There is no paddle, camera, or strike metadata—ignore any such data if present.

Your job:
1. **Play style** — In 1–2 sentences, categorize their style from body mechanics only (e.g. compact blocker, full-swing attacker, chopper, all-rounder). Use ROM and joint angles: e.g. large elbow/wrist ROM suggests big swings; small ROM suggests short strokes; asymmetry may indicate one-sided play.
2. **Common shots** — Infer likely shot types from the joint patterns (e.g. "forehand drive", "backhand block", "chop", "loop"). Base this only on angle ranges and symmetry, not on any other metadata.
3. **Combat suggestions** — Give 2–4 tips. Each tip is ONE short sentence only—something you can say out loud in a few words (e.g. "Keep the ball short." or "Attack their weak side."). No long sentences or paragraphs.`;

export const OUTPUT_SCHEMA_HINT = `Respond with valid JSON only, no markdown or extra text. Keep it brief so the response is not truncated:
{
  "play_style_summary": "One or two short sentences only.",
  "common_shots": ["shot 1", "shot 2"],
  "combat_suggestions": ["One short sentence.", "Another short sentence."]
}`;

/**
 * Build the user prompt from a session summary (MediaPipe only).
 * @param {Object} summary - from buildSessionSummary()
 * @returns {string}
 */
export function buildUserPrompt(summary) {
  const lines = [
    'Analyze this table tennis opponent using ONLY the MediaPipe joint and ROM data below. Ignore any other metadata.',
    '',
    '## Session',
    `- Session ID: ${summary.sessionId}`,
    `- Started: ${summary.startedAt}`,
    `- Ended: ${summary.endedAt}`,
    `- Frames with pose: ${summary.frameCount}`,
    '',
  ];

  if (summary.rom && Object.keys(summary.rom).length > 0) {
    lines.push('### Range of motion (degrees) per joint');
    lines.push('min/max/range/sampleCount for elbows, wrists, knees, shoulders, hips.');
    lines.push(JSON.stringify(summary.rom, null, 2));
    lines.push('');
  }

  if (summary.sampleFrames && summary.sampleFrames.length > 0) {
    lines.push('### Sample of frame-level joint angles and symmetry');
    lines.push('jointAngles: elbow/wrist angles. jointAnglesHorizontal: angles to horizontal. symmetry: left/right romDifference, asymmetryFlagged.');
    lines.push(JSON.stringify(summary.sampleFrames, null, 2));
    lines.push('');
  }

  lines.push('---');
  lines.push('Remember: play_style_summary = 1–2 short sentences. Each combat_suggestion = one short sentence only (sayable quickly out loud).');
  lines.push(OUTPUT_SCHEMA_HINT);

  return lines.join('\n');
}
