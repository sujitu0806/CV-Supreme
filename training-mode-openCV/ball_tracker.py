"""
Training Mode (OpenCV) – Ball tracking only.
Detects the table tennis ball in video frames, tracks position, estimates speed.
No player detection, shots, or tactics. Outputs structured JSON-like data.
"""

import json
import sys
from pathlib import Path

import cv2
import numpy as np


def _frame_to_timestamp(frame_index: int, fps: float) -> str:
    """Convert frame index to HH:MM:SS.mm string."""
    if fps <= 0:
        return "00:00:00.00"
    total_sec = frame_index / fps
    h = int(total_sec // 3600)
    m = int((total_sec % 3600) // 60)
    s = total_sec % 60
    return f"{h:02d}:{m:02d}:{s:05.2f}"


def _orange_score(hsv_roi: np.ndarray) -> float:
    """
    Score how close a region is to ideal bright orange (table tennis ball).
    Higher = better match. Uses mean H, S, V in the region.
    """
    if hsv_roi.size == 0:
        return -1.0
    # Ideal bright orange: H ~10–14, S high, V high (OpenCV H 0–180)
    ideal_h, ideal_s, ideal_v = 12.0, 220.0, 240.0
    mean_h = np.mean(hsv_roi[:, :, 0])
    mean_s = np.mean(hsv_roi[:, :, 1])
    mean_v = np.mean(hsv_roi[:, :, 2])
    # Prefer H in 8–18 (pure orange), high S and V
    dh = min(abs(mean_h - ideal_h), 180 - abs(mean_h - ideal_h))
    ds = ideal_s - mean_s if mean_s < ideal_s else 0
    dv = ideal_v - mean_v if mean_v < ideal_v else 0
    return 100.0 - (dh * 2 + ds * 0.1 + dv * 0.05)


# Minimum orange score to accept a blob (reject skin/faces/hands which score low)
MIN_ORANGE_SCORE = 62.0


def _find_best_ball_candidate(contours, small_h, small_w, hsv=None, allow_streak=False):
    """
    Pick best blob; if hsv is provided, prefer the blob closest to bright orange.
    Returns (cx, cy, orange_score, circularity) or (None, None, 0.0, 0.0).
    Does not filter by MIN_ORANGE_SCORE so we can still return low-confidence detections.
    """
    min_area = 8  # Balance: filter noise, keep close/mid-range balls
    max_area_mult = 0.03
    max_area = min(small_h, small_w) ** 2 * max_area_mult
    min_circularity = 0.08 if (hsv is not None and allow_streak) else 0.25
    candidates = []
    for c in contours:
        area = cv2.contourArea(c)
        if area < min_area or area > max_area:
            continue
        perimeter = cv2.arcLength(c, True)
        if perimeter <= 0:
            continue
        circularity = 4 * np.pi * area / (perimeter * perimeter)
        if circularity < min_circularity:
            continue
        M = cv2.moments(c)
        if M["m00"] <= 0:
            continue
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
        orange_s = 0.0
        score = area
        if hsv is not None:
            r = max(2, int(np.sqrt(area) * 0.7))
            y0 = max(0, cy - r)
            y1 = min(hsv.shape[0], cy + r + 1)
            x0 = max(0, cx - r)
            x1 = min(hsv.shape[1], cx + r + 1)
            roi = hsv[y0:y1, x0:x1]
            orange_s = _orange_score(roi)
            if orange_s > 0:
                score = orange_s * 1000 + area
        candidates.append((score, cx, cy, orange_s, circularity))
    if not candidates:
        return None, None, 0.0, 0.0
    candidates.sort(key=lambda t: -t[0])
    _, cx, cy, orange_s, circ = candidates[0]
    return cx, cy, orange_s, circ


def _detect_ball_in_frame(frame: np.ndarray) -> tuple[int | None, int | None, float]:
    """
    Detect ball in a single frame using color (HSV) and contour/blob detection.
    Returns (x, y, confidence). Confidence 0-1 from orangeness and circularity; never stop tracking.
    """
    h, w = frame.shape[:2]
    # Use 640px to preserve distant balls (smaller targets need more resolution)
    scale = 640 / max(h, w) if max(h, w) > 640 else 1.0
    small = cv2.resize(frame, None, fx=scale, fy=scale) if scale != 1.0 else frame
    small_h, small_w = small.shape[:2]

    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)

    # Wider HSV for distant balls (often washed out: lower S, V)
    lower_orange = np.array([5, 120, 120])
    upper_orange = np.array([25, 255, 255])
    mask_orange = cv2.inRange(hsv, lower_orange, upper_orange)

    # Smaller kernels preserve small blobs (distant balls)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask_o = cv2.morphologyEx(mask_orange, cv2.MORPH_CLOSE, kernel)
    mask_o = cv2.morphologyEx(mask_o, cv2.MORPH_OPEN, kernel)
    kernel_dilate = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    mask_o = cv2.dilate(mask_o, kernel_dilate)
    contours_o, _ = cv2.findContours(mask_o, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    best_cx, best_cy, orange_s, circ = _find_best_ball_candidate(
        contours_o, small_h, small_w, hsv, allow_streak=True
    )

    if best_cx is None or best_cy is None:
        lower_white = np.array([0, 0, 170])
        upper_white = np.array([180, 50, 255])
        mask_white = cv2.inRange(hsv, lower_white, upper_white)
        mask_w = cv2.morphologyEx(mask_white, cv2.MORPH_CLOSE, kernel)
        mask_w = cv2.morphologyEx(mask_w, cv2.MORPH_OPEN, kernel)
        contours_w, _ = cv2.findContours(mask_w, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        best_cx, best_cy, orange_s, circ = _find_best_ball_candidate(
            contours_w, small_h, small_w, hsv=hsv, allow_streak=True
        )

    if best_cx is None or best_cy is None:
        return None, None, 0.0

    # Confidence 0-1: orangeness (normalized 0-100 -> 0-1) and circularity (round = confident)
    orange_norm = max(0.0, min(1.0, orange_s / 100.0))
    confidence = float(round(orange_norm * 0.65 + circ * 0.35, 3))
    confidence = max(0.0, min(1.0, confidence))

    if scale != 1.0:
        best_cx = int(best_cx / scale)
        best_cy = int(best_cy / scale)
    return best_cx, best_cy, confidence


def process_frame(frame_bgr: np.ndarray) -> tuple[int | None, int | None, float]:
    """
    Detect ball in a single frame (BGR image). For use with live camera feed.
    Returns (x, y, confidence). Never stops tracking; low confidence = uncertain detection.
    """
    return _detect_ball_in_frame(frame_bgr)


def process_video(video_path: str | Path) -> dict:
    """
    Process a video file: detect ball per frame, track position, estimate speed.
    Returns { "detections": [ { frame, timestamp, ball_position, ball_speed_px_per_sec }, ... ], "fps": float }.
    When ball is not visible, position and speed are null (no hallucination).
    """
    path = Path(video_path)
    if not path.is_file():
        raise FileNotFoundError(f"Video file not found: {path}")

    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        raise IOError(f"Cannot open video: {path}")

    fps = float(cap.get(cv2.CAP_PROP_FPS) or 25.0)
    results = []
    prev_xy = None
    prev_frame = None
    frame_index = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        x, y, confidence = _detect_ball_in_frame(frame)

        if x is not None and y is not None:
            pos = {"x": int(x), "y": int(y)}
            speed_px_per_sec = None
            if prev_xy is not None and prev_frame is not None:
                dx = x - prev_xy[0]
                dy = y - prev_xy[1]
                dist = np.hypot(dx, dy)
                frames_elapsed = frame_index - prev_frame
                if frames_elapsed > 0:
                    speed_px_per_sec = float(dist * fps / frames_elapsed)
            results.append({
                "frame": frame_index,
                "timestamp": _frame_to_timestamp(frame_index, fps),
                "ball_position": pos,
                "ball_speed_px_per_sec": round(speed_px_per_sec, 1) if speed_px_per_sec is not None else None,
                "confidence": round(confidence, 3),
            })
            prev_xy = (x, y)
            prev_frame = frame_index
        else:
            results.append({
                "frame": frame_index,
                "timestamp": _frame_to_timestamp(frame_index, fps),
                "ball_position": None,
                "ball_speed_px_per_sec": None,
                "confidence": 0.0,
            })

        frame_index += 1

    cap.release()
    return {"detections": results, "fps": fps}


def main() -> None:
    """CLI: python ball_tracker.py <video_path> [--output results.json]"""
    if len(sys.argv) < 2:
        print("Usage: python ball_tracker.py <video_path> [--output results.json]", file=sys.stderr)
        sys.exit(1)
    video_path = sys.argv[1]
    output_path = None
    if len(sys.argv) >= 4 and sys.argv[2] == "--output":
        output_path = sys.argv[3]

    try:
        result = process_video(video_path)
        detections = result["detections"]
        fps = result["fps"]
        out = {"fps": fps, "frames_processed": len(detections), "detections": detections}
        json_str = json.dumps(out, indent=2)
        if output_path:
            Path(output_path).write_text(json_str, encoding="utf-8")
            print(f"Wrote {len(detections)} frames to {output_path}")
        else:
            print(json_str)
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
