/**
 * Call Gemini API to analyze opponent session and return play style + combat suggestions.
 * Uses REST API: generativelanguage.googleapis.com
 */

import { buildUserPrompt, SYSTEM_INSTRUCTION } from './prompt.js';
import { buildSessionSummary } from './analyze.js';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * @param {string} apiKey - GEMINI_API_KEY or GOOGLE_API_KEY
 * @param {Object} session - Parsed session JSON
 * @param {{ systemInstruction?: string }} [opts]
 * @returns {Promise<{ play_style_summary: string, common_shots: string[], combat_suggestions: string[] }>}
 */
export async function analyzeSessionWithGemini(apiKey, session, opts = {}) {
  const summary = buildSessionSummary(session);
  const userPrompt = buildUserPrompt(summary);
  const systemInstruction = opts.systemInstruction ?? SYSTEM_INSTRUCTION;

  const body = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  };

  const url = `${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned no text');
  }

  let cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf('{');
    if (start !== -1) {
      const end = cleaned.lastIndexOf('}') + 1;
      if (end > start) {
        let slice = cleaned.slice(start, end);
        slice = slice.replace(/,(\s*[}\]])/g, '$1');
        try {
          parsed = JSON.parse(slice);
        } catch (_) {
          parsed = {
            play_style_summary: '(Response truncated; raw: ' + cleaned.slice(0, 200) + '…)',
            common_shots: [],
            combat_suggestions: ['Re-run the analysis; the model output was truncated.'],
          };
        }
      } else {
        parsed = { play_style_summary: cleaned.slice(0, 500) ?? '', common_shots: [], combat_suggestions: [] };
      }
    } else {
      parsed = { play_style_summary: cleaned.slice(0, 500) ?? '', common_shots: [], combat_suggestions: [] };
    }
  }

  if (typeof parsed.play_style_summary === 'string' && parsed.play_style_summary.trim().startsWith('{')) {
    try {
      const inner = JSON.parse(parsed.play_style_summary);
      if (inner.play_style_summary != null) parsed.play_style_summary = inner.play_style_summary;
      if (Array.isArray(inner.common_shots)) parsed.common_shots = inner.common_shots;
      if (Array.isArray(inner.combat_suggestions)) parsed.combat_suggestions = inner.combat_suggestions;
    } catch (_) {}
  }

  return {
    play_style_summary: typeof parsed.play_style_summary === 'string' ? parsed.play_style_summary : '',
    common_shots: Array.isArray(parsed.common_shots) ? parsed.common_shots : [],
    combat_suggestions: Array.isArray(parsed.combat_suggestions) ? parsed.combat_suggestions : [],
  };
}
