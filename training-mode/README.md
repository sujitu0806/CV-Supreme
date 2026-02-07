# Training Mode

Training Mode analyzes practice or friendly match footage to extract **structured gameplay data** for both players. It is intended for data collection and analysis—not real-time opponent exploitation. This is an MVP for a hackathon setting; perfect accuracy is not required.

## Scope

- **Input**: Live or recorded video (camera on the **side** of the table, both players visible).
- **Output**: Structured JSON-like observations (ball placement, spin type, shot type, player locations) with confidence scores and explicit uncertainty.
- **No**: Custom-trained models, fine-tuned pipelines, or frame-perfect tracking.
- **Yes**: Prompt-driven vision reasoning (Overshoot), approximate estimation, conservative conclusions.

All code lives in `training-mode/`. This mode is **modular and self-contained**; it does not depend on or reference `comp-mode/`.

## Setup

1. Install dependencies:
   ```bash
   cd training-mode && npm install
   ```

2. API key (add when available):
   - Get an API key from [Overshoot Platform](https://platform.overshoot.ai/api-keys).
   - Create `.env` in `training-mode/` with:
     ```
     VITE_OVERSHOOT_API_KEY=your_key_here
     ```
   - Until then, the app uses the placeholder `OVERSHOOT_API_KEY = "<INSERT_API_KEY_HERE>"` and API calls will fail until a real key is set.

3. Run the dev server:
   ```bash
   npm run dev
   ```
   Open the URL shown (e.g. `http://localhost:5173`) and use **Start** to begin the camera stream and Overshoot analysis.

## Output format

Each observation is a structured object, for example:

```json
{
  "timestamp": "00:02:14.820",
  "ball_placement": {
    "zone": "deep left corner",
    "confidence": 0.74
  },
  "spin_type": {
    "value": "topspin",
    "confidence": 0.62
  },
  "shot_type": {
    "value": "forehand drive",
    "confidence": 0.68
  },
  "player_locations": {
    "player_a": {
      "distance_from_table": "close",
      "lateral_position": "center",
      "confidence": 0.80
    },
    "player_b": {
      "distance_from_table": "mid-distance",
      "lateral_position": "right",
      "confidence": 0.77
    }
  }
}
```

- **Confidence** is 0–1; use low values or `"uncertain"` when evidence is weak.
- Do not invent details; prefer conservative estimates and explicit uncertainty.
- This mode outputs **data only**; no intent or coaching advice is inferred here. Downstream logic can aggregate observations to generate training feedback.

## Structure

- `src/main.js` — Stream lifecycle, Overshoot integration, observation emission.
- `src/prompt.js` — Natural language prompt for the vision model.
- `src/schema.js` — JSON schema for Overshoot `outputSchema`.
- `src/types.js` — JSDoc types for observations.
- `index.html` — Minimal UI to run the camera and view observations.

## Recorded video

The current MVP uses a **live camera** stream via the Overshoot SDK. Recorded video support (e.g. file upload) can be added later if the SDK or API supports feeding pre-recorded video; the same prompt and schema can be reused.
