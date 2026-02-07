# Training Mode (OpenCV) – Ball Tracking Only

This mode is **strictly limited to tracking the table tennis ball** in **recorded video or live camera feed**. It does not identify players, analyze shots, or provide coaching feedback.

All code and outputs live inside `training-mode-openCV/`. This directory is **fully self-contained**; it does not reference or depend on any other part of the project.

## What it does

- **Detects** the ball in video frames (OpenCV: HSV color + contour/blob detection).
- **Tracks** position over time.
- **Estimates** approximate ball speed (pixels per second from frame-to-frame movement).

## What it does not do

- Identify players  
- Analyze shots, spin, or tactics  
- Detect scoring events  
- Provide coaching feedback  

## Tech stack

- **Backend**: Python, OpenCV, Flask.
- **Frontend**: JavaScript (Vite), like the rest of the project.
- **Output**: Simple JSON (frame, timestamp, ball position, ball speed).

## Setup

### Backend (Python)

```bash
cd training-mode-openCV
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

Server runs at `http://127.0.0.1:5000`.

### Frontend (JavaScript)

In a second terminal:

```bash
cd training-mode-openCV
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`).

- **Recorded video**: Choose "Recorded video", select a file, then click **Process video**. The backend runs ball tracking and returns JSON.
- **Live camera**: Choose "Live camera", click **Start camera**, then **Start tracking**. The frontend captures frames from the camera and sends them to the backend; the latest detection JSON is shown (position and speed when the ball is visible).

## Output format (JSON)

Example structure:

```json
{
  "ok": true,
  "fps": 30,
  "frames_processed": 150,
  "detections": [
    {
      "frame": 124,
      "timestamp": "00:00:05.16",
      "ball_position": { "x": 412, "y": 238 },
      "ball_speed_px_per_sec": 185.4
    },
    {
      "frame": 125,
      "timestamp": "00:00:05.19",
      "ball_position": null,
      "ball_speed_px_per_sec": null
    }
  ]
}
```

- When the ball is **not visible** in a frame, `ball_position` and `ball_speed_px_per_sec` are `null` (no invented data).
- `ball_speed_px_per_sec` is derived from position change between consecutive frames where the ball was detected.

## CLI (optional)

Run the tracker without the web UI:

```bash
python ball_tracker.py path/to/video.mp4
# Prints JSON to stdout

python ball_tracker.py path/to/video.mp4 --output results.json
# Writes JSON to results.json
```

## Camera / video

- Input: **recorded video file** (e.g. MP4, MOV, AVI, WebM, MKV) or **live camera** (browser `getUserMedia`; frames sent to backend at ~5 Hz).
- Camera is assumed to be on the **side** of the table, angled slightly downward.
- Lighting is assumed to be reasonable and consistent.
- Ball detection uses color (orange/white) and simple contour criteria; no ML.

### API (backend)

- `POST /process`: multipart `file` = video file. Returns `{ ok, fps, frames_processed, detections }`.
- `POST /process_frame`: multipart `file` = image (frame), `frame_index`, `timestamp_sec`, optional `previous_x`, `previous_y`, `previous_timestamp_sec` for speed. Returns single `{ ok, frame_index, timestamp, ball_position, ball_speed_px_per_sec }`.

## Constraints

- Do not invent data when the ball is not visible.
- Handle occlusion conservatively (prefer missing data over wrong data).
- All code and outputs stay inside `training-mode-openCV/`.
