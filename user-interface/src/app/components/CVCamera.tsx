"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectPose, type PoseLandmark } from "@/lib/pose/poseDetector";
import { computeAllAngles } from "@/lib/pose/angles";
import {
  RACKET_SPORTS_JOINTS,
  RACKET_SPORTS_JOINT_DEFINITIONS,
  SKELETON_CONNECTIONS,
} from "@/lib/pose/landmarks";
import { ExponentialSmoother } from "@/lib/pose/smoothing";

const OPENCV_API = "/api/opencv";
const POSE_INTERVAL_MS = 90; // ~11 fps, balanced for accuracy
const OPENCV_INTERVAL_MS = 110;
const MAX_OPENCV_SIZE = 560;
const MIN_LANDMARK_VISIBILITY = 0.55;

type BallPosition = { x: number; y: number } | null;

export function CVCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [landmarks, setLandmarks] = useState<PoseLandmark[] | null>(null);
  const [jointAngles, setJointAngles] = useState<Record<string, number>>({});
  const [ballPosition, setBallPosition] = useState<BallPosition>(null);
  const [ballConfidence, setBallConfidence] = useState(0);
  const [ballSpeed, setBallSpeed] = useState<number | null>(null);
  const [opencvStatus, setOpencvStatus] = useState<"checking" | "ok" | "fail">("checking");

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastBallRef = useRef<BallPosition>(null);
  const lastBallTsRef = useRef<number>(0);
  const opencvIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const opencvPendingRef = useRef(false);
  const landmarksRef = useRef<PoseLandmark[] | null>(null);
  const jointAnglesRef = useRef<Record<string, number>>({});
  const angleSmootherRef = useRef<ExponentialSmoother | null>(null);
  const posePendingRef = useRef(false);
  if (!angleSmootherRef.current) angleSmootherRef.current = new ExponentialSmoother(0.35);
  landmarksRef.current = landmarks;
  jointAnglesRef.current = jointAngles;

  // Sync video with stream
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) video.play().catch(() => {});
  }, [stream]);

  // MediaPipe pose detection loop — throttled, skip overlapping, pause when tab hidden
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;
    let lastPoseTime = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const runPose = () => {
      if (document.hidden) {
        timeoutId = setTimeout(runPose, POSE_INTERVAL_MS);
        return;
      }
      if (!video.videoWidth || posePendingRef.current) {
        timeoutId = setTimeout(runPose, POSE_INTERVAL_MS);
        return;
      }
      const now = performance.now();
      if (now - lastPoseTime < POSE_INTERVAL_MS) {
        timeoutId = setTimeout(runPose, Math.max(10, POSE_INTERVAL_MS - (now - lastPoseTime)));
        return;
      }
      lastPoseTime = now;
      posePendingRef.current = true;
      detectPose(video, now)
        .then((pose) => {
          if (!pose) return;
          setLandmarks(pose.landmarks);
          const raw = computeAllAngles(
            pose.landmarks,
            RACKET_SPORTS_JOINT_DEFINITIONS,
            !!pose.worldLandmarks
          );
          const smoothed = angleSmootherRef.current?.smoothAll(raw) ?? raw;
          setJointAngles(smoothed);
        })
        .finally(() => {
          posePendingRef.current = false;
          timeoutId = setTimeout(runPose, POSE_INTERVAL_MS);
        });
    };

    timeoutId = setTimeout(runPose, POSE_INTERVAL_MS);
    return () => clearTimeout(timeoutId);
  }, [stream]);

  // Preload MediaPipe when component mounts (reduces first-frame latency)
  useEffect(() => {
    import("@/lib/pose/poseDetector").then((m) => m.initPoseLandmarker().catch(() => null));
  }, []);

  // Check OpenCV backend
  useEffect(() => {
    fetch(`${OPENCV_API}/health`)
      .then((r) => r.json())
      .then(() => setOpencvStatus("ok"))
      .catch(() => setOpencvStatus("fail"));
  }, []);

  // OpenCV frame sender — capture frames, send to ball tracker, update overlay
  useEffect(() => {
    if (!stream || !videoRef.current) return;
    const video = videoRef.current;

    const sendFrame = async () => {
      if (!video.videoWidth || !video.videoHeight || opencvPendingRef.current) return;
      opencvPendingRef.current = true;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const scale = Math.min(1, MAX_OPENCV_SIZE / Math.max(vw, vh));
      const tw = scale < 1 ? Math.round(vw * scale) : vw;
      const th = scale < 1 ? Math.round(vh * scale) : vh;

      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const c = canvasRef.current;
      c.width = tw;
      c.height = th;
      const ctx = c.getContext("2d");
      if (!ctx) {
        opencvPendingRef.current = false;
        return;
      }
      ctx.drawImage(video, 0, 0, vw, vh, 0, 0, tw, th);

      const blob = await new Promise<Blob | null>((resolve) =>
        c.toBlob(resolve, "image/jpeg", 0.65)
      );
      if (!blob) {
        opencvPendingRef.current = false;
        return;
      }

      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");
      formData.append("frame_index", "0");
      formData.append("timestamp_sec", String(performance.now() / 1000));
      const last = lastBallRef.current;
      const lastTs = lastBallTsRef.current;
      if (last && lastTs) {
        formData.append("previous_x", String(last.x));
        formData.append("previous_y", String(last.y));
        formData.append("previous_timestamp_sec", String(lastTs));
      }

      try {
        const res = await fetch(`${OPENCV_API}/process_frame`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (data.ok && data.ball_position) {
          let bp = data.ball_position;
          if (scale < 1) {
            bp = { x: Math.round(bp.x / scale), y: Math.round(bp.y / scale) };
          }
          lastBallRef.current = bp;
          lastBallTsRef.current = performance.now() / 1000;
          setBallPosition(bp);
          setBallConfidence(data.confidence ?? 0);
          setBallSpeed(data.ball_speed_px_per_sec ?? null);
        } else {
          setBallPosition(null);
          setBallConfidence(0);
          setBallSpeed(null);
        }
      } catch {
        setBallPosition(null);
      } finally {
        opencvPendingRef.current = false;
      }
    };

    opencvIntervalRef.current = setInterval(sendFrame, OPENCV_INTERVAL_MS);
    return () => {
      if (opencvIntervalRef.current) clearInterval(opencvIntervalRef.current);
    };
  }, [stream]);

  // Draw overlay (MediaPipe skeleton + ball) — animation loop
  const ballPosRef = useRef<BallPosition>(null);
  const ballConfRef = useRef(0);
  ballPosRef.current = ballPosition;
  ballConfRef.current = ballConfidence;

  useEffect(() => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay || !stream) return;

    let rafId: number;
    let frameCount = 0;
    let displayedAngles: Record<string, number> = {};

    const draw = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      frameCount += 1;
      if (frameCount % 4 === 0) {
        displayedAngles = { ...(jointAnglesRef.current ?? {}), ...(angleSmootherRef.current?.getAllLast() ?? {}) };
      }

      if (overlay.width !== w || overlay.height !== h) {
        overlay.width = w;
        overlay.height = h;
      }
      const ctx = overlay.getContext("2d");
      if (!ctx) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const lm = landmarksRef.current;
      const toPx = (x: number, y: number) => ({ x: x * w, y: y * h });
      const fontScale = Math.max(0.85, Math.min(1.2, w / 560));
      const fontSize = Math.round(14 * fontScale);
      const arcRadius = Math.round(24 * fontScale);

      const drawArc = (
        a: { x: number; y: number },
        b: { x: number; y: number },
        c: { x: number; y: number },
        angleDeg: number,
        color: string
      ) => {
        const v1 = { x: a.x - b.x, y: a.y - b.y };
        const v2 = { x: c.x - b.x, y: c.y - b.y };
        const mag1 = Math.hypot(v1.x, v1.y) || 1e-8;
        const mag2 = Math.hypot(v2.x, v2.y) || 1e-8;
        const startAngle = Math.atan2(v1.y, v1.x);
        const sweep = (angleDeg * Math.PI) / 180;
        const r = Math.min(arcRadius, mag1 * 0.5, mag2 * 0.5);
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, startAngle, startAngle + sweep);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.stroke();
      };

      // White skeleton lines
      if (lm?.length) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        for (const [i, j] of SKELETON_CONNECTIONS) {
          const a = lm[i];
          const b = lm[j];
          if (
            !a ||
            !b ||
            (a.visibility != null && a.visibility < MIN_LANDMARK_VISIBILITY) ||
            (b.visibility != null && b.visibility < MIN_LANDMARK_VISIBILITY)
          )
            continue;
          const pa = toPx(a.x, a.y);
          const pb = toPx(b.x, b.y);
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.stroke();
        }
      }

      // Upper-body joints: arc + numeric label every 4 frames, orange box, white font
      if (lm?.length) {
        for (const jointName of RACKET_SPORTS_JOINTS) {
          const def = RACKET_SPORTS_JOINT_DEFINITIONS[jointName];
          if (!def) continue;
          const [iA, iB, iC] = def;
          const la = lm[iA];
          const lb = lm[iB];
          const lc = lm[iC];
          if (
            !la ||
            !lb ||
            !lc ||
            (la.visibility != null && la.visibility < MIN_LANDMARK_VISIBILITY) ||
            (lb.visibility != null && lb.visibility < MIN_LANDMARK_VISIBILITY) ||
            (lc.visibility != null && lc.visibility < MIN_LANDMARK_VISIBILITY)
          )
            continue;

          const a = toPx(la.x, la.y);
          const b = toPx(lb.x, lb.y);
          const c = toPx(lc.x, lc.y);
          const angle = displayedAngles[jointName] ?? jointAnglesRef.current?.[jointName] ?? angleSmootherRef.current?.getLast(jointName);
          if (angle == null || !Number.isFinite(angle)) continue;

          const arcColor = "rgba(249, 115, 22, 0.9)";
          drawArc(a, b, c, angle, arcColor);

          {
            const text = `${Math.round(angle)}°`;
            ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
            const tw = ctx.measureText(text).width;
            const pad = 6;
            const isLeft = b.x < w / 2;
            const tx = b.x + (isLeft ? -12 : 12);
            const ty = b.y - 8;

            ctx.fillStyle = "#ea580c";
            ctx.strokeStyle = "#c2410c";
            ctx.lineWidth = 1;
            ctx.strokeRect(tx - tw / 2 - pad, ty - fontSize - pad, tw + pad * 2, fontSize + pad * 2);
            ctx.fillRect(tx - tw / 2 - pad, ty - fontSize - pad, tw + pad * 2, fontSize + pad * 2);
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, tx, ty - fontSize / 2);
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
          }
        }
      }

      // Ball
      const bp = ballPosRef.current;
      const bc = ballConfRef.current;
      if (bp && bc > 0.2) {
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 165, 0, ${0.5 + bc * 0.5})`;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [stream]);

  const startCamera = useCallback(async () => {
    setError(null);
    setStarting(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Permission") || msg.includes("denied") || msg.includes("NotAllowed")) {
        setError("Camera permission denied. Allow camera access and try again.");
      } else if (msg.includes("NotFound") || msg.includes("not found")) {
        setError("No camera found. Connect a camera and try again.");
      } else {
        setError(`Camera error: ${msg}`);
      }
    } finally {
      setStarting(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setError(null);
    setLandmarks(null);
    setJointAngles({});
    angleSmootherRef.current?.reset();
    setBallPosition(null);
    lastBallRef.current = null;
  }, [stream]);

  const displayAngles = Object.entries(jointAngles)
    .filter(([k, v]) => RACKET_SPORTS_JOINTS.includes(k as (typeof RACKET_SPORTS_JOINTS)[number]) && v != null && !Number.isNaN(v))
    .map(([k, v]) => `${k}: ${Math.round(v)}°`)
    .join(" · ");

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border-2 border-orange-200 bg-zinc-100">
      <div className="relative aspect-video min-h-[320px] w-full overflow-hidden bg-zinc-900">
        {stream ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
            <canvas
              ref={overlayRef}
              className="absolute inset-0 h-full w-full object-cover pointer-events-none"
              style={{ width: "100%", height: "100%" }}
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-zinc-500">
            <p className="text-center text-sm">Click Start to turn on your camera.</p>
            <button
              type="button"
              onClick={startCamera}
              disabled={starting}
              className="rounded-lg bg-orange-500 px-6 py-2.5 font-medium text-white transition hover:bg-orange-600 disabled:opacity-60"
            >
              {starting ? "Starting…" : "Start camera"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          {stream ? (
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              disabled={starting}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {starting ? "Starting…" : "Start"}
            </button>
          )}
          <span className="text-sm text-zinc-500">
            {opencvStatus === "ok"
              ? "OpenCV ball tracking connected"
              : "OpenCV: run python server.py in training-mode-openCV"}
          </span>
          {stream && landmarks && (
            <span className="text-sm font-medium text-blue-600">MediaPipe Pose</span>
          )}
        </div>
        {stream && (
          <div className="space-y-1 text-sm">
            {displayAngles && (
              <p className="text-zinc-700">
                <strong>Joint angles:</strong> {displayAngles}
              </p>
            )}
            {ballPosition && (
              <p className="text-zinc-700">
                <strong>Ball:</strong> ({ballPosition.x}, {ballPosition.y})
                {ballConfidence > 0 && ` · ${(ballConfidence * 100).toFixed(0)}% conf`}
                {ballSpeed != null && ` · ${ballSpeed.toFixed(0)} px/s`}
              </p>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="border-t border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
