# Gemini pipeline for comp mode

When new session metadata is exported to `metadata_exports/`, this pipeline sends a **summary** of the session to the Gemini API. Gemini returns:

- **Play style summary** — 1–2 sentence categorization of the opponent (e.g. aggressive attacker, defensive chopper).
- **Common shots** — List of typical shots and tendencies.
- **Combat suggestions** — 3–5 concrete tactics to counter this play style.

## Setup

1. **API key**  
   Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey). Put it in the repo root `.env`:

   ```
   GEMINI_API_KEY=your_key_here
   ```

   Or set `GOOGLE_API_KEY` instead.

2. **Automatic run**  
   With `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) set, the Vite dev server will run this pipeline automatically when a session ends (POST `/api/session/end`). The analysis is spawned in the background and does not block the response.

## Test on current metadata

From the **repo root** (so paths resolve correctly):

```bash
# One file (writes <name>.gemini.json next to the file)
node comp_mode/gemini/run.js comp_mode/metadata_exports/backChop.json

# All JSON files in metadata_exports (writes each .gemini.json alongside)
node comp_mode/gemini/run.js comp_mode/metadata_exports

# Watch for new files and run on each new/modified session JSON
node comp_mode/gemini/run.js --watch comp_mode/metadata_exports
```

Output is written to **`comp_mode/gemini_outputs/`** (not `metadata_exports`). Use `--out-dir <path>` to write elsewhere. Output is also printed to stdout when processing a single file. Written files look like:

```json
{
  "sourceFile": "backChop.json",
  "sessionId": "1770486194339",
  "analyzedAt": "2026-02-07T...",
  "play_style_summary": "...",
  "common_shots": ["...", "..."],
  "combat_suggestions": ["...", "..."]
}
```

## Files

| File | Purpose |
|------|--------|
| `prompt.js` | System instruction and user prompt builder; defines the JSON output shape. |
| `analyze.js` | Builds a session summary (counts by paddle side, speed, motion, etc.) from raw session JSON. |
| `client.js` | Calls Gemini REST API and parses the response. |
| `run.js` | CLI: process one file, a directory, or watch for new exports. |
