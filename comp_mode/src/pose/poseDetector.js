/**
 * MediaPipe Pose detection — extracts landmarks from video frames.
 * Keeps pose detection logic separate from angle/ROM/symmetry logic.
 * Uses dynamic import to avoid crashing if @mediapipe/tasks-vision isn't installed.
 */

const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

/** @type {import('@mediapipe/tasks-vision').PoseLandmarker | null} */
let landmarker = null;
let mediapipeLoaded = false;

/**
 * Initialize PoseLandmarker. Idempotent.
 * Returns null if MediaPipe fails to load (package missing, network, etc.).
 * @returns {Promise<import('@mediapipe/tasks-vision').PoseLandmarker | null>}
 */
export async function initPoseLandmarker() {
  if (landmarker) return landmarker;
  if (!mediapipeLoaded) {
    try {
      const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: POSE_MODEL_URL },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.25,
        minPosePresenceConfidence: 0.25,
        minTrackingConfidence: 0.25,
      });
      mediapipeLoaded = true;
    } catch (e) {
      console.warn('[pose] MediaPipe not available:', e?.message ?? e);
      return null;
    }
  }
  return landmarker;
}

/**
 * Detect pose in a video frame.
 * @param {HTMLVideoElement} video
 * @param {number} timestampMs - Frame timestamp for VIDEO mode
 * @returns {Promise<{ landmarks: Array<{x: number, y: number, z: number}>, worldLandmarks: Array<{x: number, y: number, z: number}> | null } | null>}
 */
export async function detectPose(video, timestampMs) {
  const lm = landmarker ?? await initPoseLandmarker();
  if (!lm || !video || video.readyState < 2) return null;

  const result = lm.detectForVideo(video, timestampMs);
  if (!result?.landmarks?.length) return null;

  const pose = result.landmarks[0];
  const world = result.worldLandmarks?.[0] ?? null;

  return {
    landmarks: pose.map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0, visibility: p.visibility ?? 1 })),
    worldLandmarks: world ? world.map((p) => ({ x: p.x, y: p.y, z: p.z ?? 0 })) : null,
  };
}
