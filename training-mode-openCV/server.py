"""
Minimal Flask server for Training Mode (OpenCV).
Accepts video upload, runs ball_tracker, returns JSON.
All code and outputs stay inside training-mode-openCV/.
"""

import json
import os
import tempfile
from pathlib import Path

import time

from flask import Flask, request, jsonify

import cv2
import numpy as np

from ball_tracker import process_video, process_frame

app = Flask(__name__)
# Keep uploads inside this directory
BASE = Path(__file__).resolve().parent
UPLOAD_DIR = BASE / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "mode": "training-mode-openCV"})


@app.route("/process", methods=["POST"])
def process():
    """
    POST with multipart/form-data: file = video file.
    Returns JSON: { ok, frames_processed, detections: [ { frame, timestamp, ball_position, ball_speed_px_per_sec }, ... ] }.
    """
    if "file" not in request.files:
        return jsonify({"ok": False, "error": "No file in request"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"ok": False, "error": "Empty filename"}), 400
    # Allow common video extensions only
    ext = Path(f.filename).suffix.lower()
    if ext not in (".mp4", ".mov", ".avi", ".webm", ".mkv"):
        return jsonify({"ok": False, "error": "Unsupported video format"}), 400

    path = None
    try:
        fd, path = tempfile.mkstemp(suffix=ext, dir=UPLOAD_DIR)
        os.close(fd)
        f.save(path)
        result = process_video(path)
        detections = result["detections"]
        fps = result["fps"]
        return jsonify({
            "ok": True,
            "fps": fps,
            "frames_processed": len(detections),
            "detections": detections,
        })
    except FileNotFoundError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        if path and os.path.isfile(path):
            try:
                os.unlink(path)
            except OSError:
                pass


@app.route("/process_frame", methods=["POST"])
def process_frame_endpoint():
    """
    POST multipart: file = image (frame), frame_index, timestamp_sec,
    optional previous_x, previous_y, previous_timestamp_sec for speed.
    Returns single detection: { ok, frame_index, timestamp, ball_position, ball_speed_px_per_sec }.
    """
    if "file" not in request.files:
        return jsonify({"ok": False, "error": "No file in request"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"ok": False, "error": "Empty filename"}), 400
    frame_index = request.form.get("frame_index", type=int, default=0)
    timestamp_sec = request.form.get("timestamp_sec", type=float, default=None)
    if timestamp_sec is None:
        timestamp_sec = time.time()
    prev_x = request.form.get("previous_x", type=float)
    prev_y = request.form.get("previous_y", type=float)
    prev_ts = request.form.get("previous_timestamp_sec", type=float)

    try:
        buf = np.frombuffer(f.read(), dtype=np.uint8)
        frame_bgr = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if frame_bgr is None:
            return jsonify({"ok": False, "error": "Could not decode image"}), 400
        x, y, confidence = process_frame(frame_bgr)
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

    ball_position = {"x": int(x), "y": int(y)} if x is not None and y is not None else None
    conf = round(confidence, 3) if x is not None else 0.0
    ball_speed_px_per_sec = None
    if ball_position and prev_x is not None and prev_y is not None and prev_ts is not None:
        dt = timestamp_sec - prev_ts
        if dt > 0:
            dist = ((x - prev_x) ** 2 + (y - prev_y) ** 2) ** 0.5
            ball_speed_px_per_sec = round(dist / dt, 1)

    # Format timestamp as HH:MM:SS.mm for display
    s = timestamp_sec
    h = int(s // 3600)
    m = int((s % 3600) // 60)
    sec = s % 60
    timestamp_str = f"{h:02d}:{m:02d}:{sec:05.2f}"

    return jsonify({
        "ok": True,
        "frame_index": frame_index,
        "timestamp": timestamp_str,
        "ball_position": ball_position,
        "ball_speed_px_per_sec": ball_speed_px_per_sec,
        "confidence": conf,
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
