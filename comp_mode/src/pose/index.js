/**
 * Pose pipeline: MediaPipe Pose → joint angles → ROM → symmetry.
 * Exports for use in comp_mode and elsewhere.
 */

export { LANDMARKS, JOINT_DEFINITIONS, SYMMETRY_PAIRS_CANONICAL } from './landmarks.js';
export { angleAt, computeAllAngles, getPoint } from './angles.js';
export { ROMTracker } from './rom.js';
export { SymmetryAnalyzer } from './symmetry.js';
export { ExponentialSmoother, MovingAverageSmoother } from './smoothing.js';
export { initPoseLandmarker, detectPose } from './poseDetector.js';
export { PosePipeline } from './posePipeline.js';
export { PoseOverlay, DEFAULT_ANGLE_RANGES } from './poseOverlay.js';
export { PING_PONG_JOINT_CONFIG, getPingPongFeedback, PLAYER_STYLE_MODIFIERS } from './pingPongRanges.js';
