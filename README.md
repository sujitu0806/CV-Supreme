# TartanHacks

One app, one localhost: **Comp Mode** (opponent analysis) and **Training Mode** (both players) run together. Same API key; the toggle selects which prompt and logic run. Code for each mode stays in `comp_mode/` and `training-mode/` so you can work on both without merge conflicts.

## Run (single localhost)

**Important:** Start the app from the **repo root** (this folder), not from `comp_mode/` or `training-mode/`. Only the root app shows the **Comp Mode / Training Mode** toggle.

1. **API key** — Put your Overshoot key in a `.env` file at the **repo root** (this folder):

   ```
   VITE_OVERSHOOT_API_KEY=your_key_here
   ```

   Get a key at [Overshoot Platform](https://platform.overshoot.ai/api-keys).

2. **From the repo root**, install and run:

   ```bash
   npm install
   npm run dev
   ```

   Open the URL shown (e.g. `http://localhost:5173`). You should see **“Ping Pong Trainer”** with **Comp Mode** and **Training Mode** buttons at the top. Use the toggle, then **Start** to begin the camera and analysis. One API key is used for both modes.

## Structure

- **Root** — `package.json`, `vite.config.js`, `index.html`, `src/main.js`: single entry point and UI. Orchestrates the two modes and loads `.env` from here.
- **comp_mode/** — Comp-mode-only code (prompts, schema, runner). Opponent-focused shot metadata; session export to `comp_mode/metadata_exports/`.
- **training-mode/** — Training-mode-only code. Both players; ball placement, spin, shot type, player locations.

Edits in `comp_mode/` or `training-mode/` do not touch the other; the root app imports both and switches by toggle. You can still run `npm run dev` from inside `comp_mode/` or `training-mode/` to work on one mode in isolation (each has its own `package.json` and loads `.env` from repo root via `envDir: '..'`).