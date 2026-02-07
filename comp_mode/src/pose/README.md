# Pose Pipeline (MediaPipe)

Computer vision pipeline for joint angle tracking, ROM, and symmetry analysis.

## Structure

| Module | Purpose |
|--------|---------|
| `landmarks.js` | MediaPipe landmark indices, joint definitions, symmetry pairs |
| `angles.js` | Joint angle computation (vector math, 2D/3D) |
| `rom.js` | Range of motion per joint (min, max, range) |
| `symmetry.js` | Left/right symmetry, asymmetry threshold |
| `smoothing.js` | Exponential moving average (reduces jitter) |
| `poseDetector.js` | MediaPipe Pose detection (dynamic import) |
| `posePipeline.js` | Orchestrator: pose → angles → smooth → ROM → symmetry |

## Tracked Joints

- **Elbows**: shoulder–elbow–wrist
- **Knees**: hip–knee–ankle
- **Shoulders**: hip–shoulder–elbow
- **Hips**: shoulder–hip–knee

## Config

```js
new PosePipeline({
  smoothingAlpha: 0.3,    // 0–1, lower = smoother
  asymmetryThreshold: 15,  // flag if avg L-R diff > this (degrees)
  use3DAngles: true,
});
```

## Extensibility

- Add joints in `landmarks.js` → `JOINT_DEFINITIONS`
- Add symmetry pairs in `SYMMETRY_PAIRS_CANONICAL`
- Angle logic is separate from pose detection (`angles.js` vs `poseDetector.js`)

## Dependencies

`@mediapipe/tasks-vision` — if missing, the pipeline fails gracefully and comp mode still runs.
