# Live Competition Mode (MVP)

Analyzes a **live** table tennis match from the camera: detects when the **opponent** strikes the ball and extracts structured metadata per shot (serve type, spin, ball landing, position, joint angles) for downstream playstyle aggregation.

## Setup

1. **Install dependencies**

   ```bash
   cd comp_mode
   npm install
   ```

2. **API key**

   Put your Overshoot API key in a `.env` file at the **repo root** (the `TartanHacks/` folder), not inside `comp_mode/`:

   ```
   VITE_OVERSHOOT_API_KEY=your_key_here
   ```

   Get a key at [Overshoot Platform](https://platform.overshoot.ai/api-keys). This same file is used by training-mode. If you don’t set it, the app will use a placeholder and the vision API will not work.

3. **Run**

   ```bash
   npm run dev
   ```

   Open the URL shown (e.g. `http://localhost:5173`). Allow camera access when prompted.

## Camera

Position the device so the **camera faces the opponent** (front-facing POV of the opponent across the table). The opponent should be the main subject; the table, paddle, and ball may be partially visible.

## Usage

- **Start**: begins the live stream and sends short video windows to Overshoot for analysis.
- **Stop**: stops the stream and releases the camera. Each shot is auto-saved during the stream; when you stop, the full session is written to `metadata_exports/session_<id>.json` (when running with `npm run dev`).
- **Last result**: while running, the UI shows whether the last analysis window had a shot or not (“Last result: no shot” / “shot detected”) to help debug detection.
- The list shows the **last 10 shot observations** (timestamp, serve, spin, landing zone, position, confidence).
- **Download copy**: downloads the current session’s shots as JSON to your device.

## Output format (per-shot observation)

Each detected opponent shot is emitted as one object. Downstream modules (e.g. playstyle aggregator) can consume it in three ways:

1. **Callback**: `import { onShot } from './src/main.js'; onShot((observation) => { ... });`
2. **In-memory array**: `import { shots } from './src/main.js';` — `shots` is appended to on each new shot.
3. **Custom event**: `window.addEventListener('comp-mode:shot', (e) => { const observation = e.detail; });`

**Shape of one observation:**

| Field | Type | Description |
|-------|------|-------------|
| `shot_timestamp` | string | Client time when the result was received (e.g. `"14:32:01.234"`) |
| `serve_type` | `{ value, confidence }` | e.g. `"not a serve"`, `"short backspin serve"`; confidence 0–1 |
| `spin_type` | `{ value, confidence }` | e.g. `"topspin"`, `"backspin"`, `"uncertain"`; confidence 0–1 |
| `ball_landing` | `{ zone, angle, confidence }` | e.g. zone `"deep right corner"`, angle `"low and fast"`; confidence 0–1 |
| `opponent_position` | `{ distance_from_table, lateral_position, confidence }` | e.g. `"mid-distance"`, `"left"`; confidence 0–1 |
| `joint_angles` | `{ shoulder, elbow, wrist, confidence }` | Qualitative (e.g. `"open"`, `"bent ~90 degrees"`); confidence 0–1 |

Uncertainty is expressed via low confidence or values like `"uncertain"`. Do not infer intent or strategy from this data; use it only as input for aggregation.

## Build

```bash
npm run build
npm run preview
```

Files are emitted into `dist/` for static hosting.
