/**
 * Build a session summary from comp_mode session JSON for Gemini.
 * Uses ONLY MediaPipe data: joint angles, ROM (range of motion), and symmetry.
 * Ignores shots/paddle/camera metadata.
 */

/**
 * @param {Object} session - Parsed session JSON { sessionId, startedAt, endedAt, mediapipe?: { rom, frameSample } }
 * @returns {Object} summary for the prompt (MediaPipe only)
 */
export function buildSessionSummary(session) {
  const mp = session.mediapipe || {};
  const rom = mp.rom || {};
  const frameSample = Array.isArray(mp.frameSample) ? mp.frameSample : [];

  const sampleFrames = frameSample.slice(0, 30).map((f) => ({
    timestamp: f.timestamp,
    jointAngles: f.jointAngles || {},
    jointAnglesHorizontal: f.jointAnglesHorizontal || {},
    symmetry: f.symmetry
      ? Object.fromEntries(
          Object.entries(f.symmetry).map(([k, v]) => [
            k,
            v && typeof v === 'object' ? { romDifference: v.romDifference, asymmetryFlagged: v.asymmetryFlagged } : v,
          ])
        )
      : undefined,
  }));

  return {
    sessionId: session.sessionId,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    rom,
    sampleFrames,
    frameCount: frameSample.length,
  };
}
