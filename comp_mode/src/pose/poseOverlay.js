/**
 * Pose overlay visualization — draws on canvas over video.
 * Separate from pose detection and angle math. Ping pong–specific ranges.
 */

import { JOINT_DEFINITIONS, UPPER_BODY_JOINTS, PADDLE_ARM_CONNECTIONS } from './landmarks.js';
import { PING_PONG_JOINT_CONFIG } from './pingPongRanges.js';

const MIN_VISIBILITY = 0.4;

/** Backward compat: [min, max] for legacy consumers */
export const DEFAULT_ANGLE_RANGES = Object.fromEntries(
  Object.entries(PING_PONG_JOINT_CONFIG).map(([k, v]) => [k, [v.optimalMin, v.optimalMax]])
);

const COLORS = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  skeleton: 'rgba(255,255,255,0.6)',
  textBg: 'rgba(0,0,0,0.6)',
};

/**
 * @typedef {Object} OverlayConfig
 * @property {string[]} [joints=UPPER_BODY_JOINTS] - Which joints to show
 * @property {boolean} [showNumeric=true]
 * @property {boolean} [showArcs=true]
 * @property {boolean} [showHints=true] - Contextual ping pong hints
 * @property {string} [playerStyle=default] - fallback when no stroke detected
 * @property {'left'|'right'} [dominantHand=right] - Only show paddle arm
 * @property {number} [textOffset=12] - Pixels from joint
 * @property {number} [minLandmarkConfidence=0.4]
 */

/**
 * Map normalized landmark (0–1) to canvas pixel coords.
 */
function toCanvas(x, y, width, height) {
  return { x: x * width, y: y * height };
}

// Removed: getAngleColor — now use getPingPongFeedback

/**
 * Draw arc between two vectors at joint B.
 */
function drawArc(ctx, a, b, c, angleDeg, color, radius) {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const mag1 = Math.hypot(v1.x, v1.y) || 1e-8;
  const mag2 = Math.hypot(v2.x, v2.y) || 1e-8;
  const startAngle = Math.atan2(v1.y, v1.x);
  const sweep = (angleDeg * Math.PI) / 180;
  const r = Math.min(radius, mag1 * 0.5, mag2 * 0.5);

  ctx.beginPath();
  ctx.arc(b.x, b.y, r, startAngle, startAngle + sweep);
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.stroke();
}

/**
 * Pose overlay renderer.
 */
export class PoseOverlay {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {OverlayConfig} [config]
   */
  constructor(canvas, config = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.joints = config.joints ?? [...UPPER_BODY_JOINTS];
    this.showNumeric = config.showNumeric !== false;
    this.showArcs = config.showArcs !== false;
    this.showHints = config.showHints !== false;
    this.dominantHand = config.dominantHand ?? 'right';
    this.playerStyle = config.playerStyle ?? 'default';
    this.pingPongConfig = { ...PING_PONG_JOINT_CONFIG };
    this.textOffset = config.textOffset ?? 12;
    this.minConfidence = config.minLandmarkConfidence ?? MIN_VISIBILITY;
  }

  /**
   * Update config at runtime.
   */
  setConfig(config) {
    if (config.joints != null) this.joints = config.joints;
    if (config.showNumeric != null) this.showNumeric = config.showNumeric;
    if (config.showArcs != null) this.showArcs = config.showArcs;
    if (config.showHints != null) this.showHints = config.showHints;
    if (config.playerStyle != null) this.playerStyle = config.playerStyle;
    if (config.dominantHand != null) this.dominantHand = config.dominantHand;
  }

  /** Clear the overlay. */
  clear() {
    if (this.ctx && this.canvas.width && this.canvas.height) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Resize canvas to match video.
   */
  setSize(width, height) {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  /**
   * Render overlay. Call each frame.
   * @param {import('./posePipeline.js').PosePipelineOutput} data - From pipeline
   * @param {Array<{x: number, y: number, visibility?: number}>} landmarks - Normalized 0–1
   * @param {HTMLVideoElement} video - For dimensions
   * @param {Record<string, boolean>} [asymmetryFlags] - Joint pair keys that are asymmetric
   */
  render(data, landmarks, video, asymmetryFlags = {}) {
    const ctx = this.ctx;
    const w = video.videoWidth || this.canvas.width || 640;
    const h = video.videoHeight || this.canvas.height || 480;
    if (!w || !h) return;
    this.setSize(w, h);

    ctx.clearRect(0, 0, w, h);
    if (!landmarks?.length) return;

    const scale = Math.min(this.canvas.width / w, this.canvas.height / h);
    const offsetX = (this.canvas.width - w * scale) / 2;
    const offsetY = (this.canvas.height - h * scale) / 2;

    const px = (x, y) => ({
      x: offsetX + x * w * scale,
      y: offsetY + y * h * scale,
    });

    // Skeleton: only paddle arm (hand holding paddle)
    const skeletonConnections = PADDLE_ARM_CONNECTIONS[this.dominantHand] ?? PADDLE_ARM_CONNECTIONS.right;
    ctx.strokeStyle = COLORS.skeleton;
    ctx.lineWidth = 4;
    for (const [i, j] of skeletonConnections) {
      const a = landmarks[i];
      const b = landmarks[j];
      if (!a || !b || (a.visibility != null && a.visibility < this.minConfidence) || (b.visibility != null && b.visibility < this.minConfidence)) continue;
      const pa = px(a.x, a.y);
      const pb = px(b.x, b.y);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    const angles = data?.jointAngles ?? {};
    const fontScale = Math.max(0.7, Math.min(1.4, w / 640));
    const fontSize = Math.round(22 * fontScale);

    const paddleArmJoints = this.dominantHand === 'right' ? ['rightElbow', 'rightShoulder', 'rightWrist'] : ['leftElbow', 'leftShoulder', 'leftWrist'];
    const jointsToShow = this.joints.filter((j) => paddleArmJoints.includes(j));

    for (const jointName of jointsToShow) {
      const def = JOINT_DEFINITIONS[jointName];
      if (!def) continue;
      const [iA, iB, iC] = def;
      const la = landmarks[iA];
      const lb = landmarks[iB];
      const lc = landmarks[iC];
      if (!la || !lb || !lc) continue;
      if ((la.visibility != null && la.visibility < this.minConfidence) ||
          (lb.visibility != null && lb.visibility < this.minConfidence) ||
          (lc.visibility != null && lc.visibility < this.minConfidence)) continue;

      const a = px(la.x, la.y);
      const b = px(lb.x, lb.y);
      const c = px(lc.x, lc.y);

      const angle = angles[jointName];
      const color = COLORS.skeleton;

      if (this.showArcs && angle != null) {
        drawArc(ctx, a, b, c, angle, color, 42 * scale);
      }

      if (this.showNumeric && angle != null) {
        ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
        const text = `${Math.round(angle)}°`;
        const tw = ctx.measureText(text).width;
        const tx = b.x + this.textOffset;
        const ty = b.y - this.textOffset;
        ctx.fillStyle = COLORS.textBg;
        ctx.fillRect(tx - 4, ty - fontSize, tw + 8, fontSize + 6);
        ctx.fillStyle = color;
        ctx.fillText(text, tx, ty + 2);
      }
    }

  }
}
