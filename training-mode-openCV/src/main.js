/**
 * Training Mode (OpenCV) – Frontend.
 * Option: Recorded video (upload + Process) or Live camera (Start camera → Start tracking).
 * POST to backend, display JSON output. Self-contained; no imports from other directories.
 */

const API_BASE = '/api';

const videoFile = document.getElementById('video-file');
const btnProcess = document.getElementById('btn-process');
const panelFile = document.getElementById('panel-file');
const panelLive = document.getElementById('panel-live');
const liveVideo = document.getElementById('live-video');
const livePlaceholder = document.getElementById('live-placeholder');
const btnStartCamera = document.getElementById('btn-start-camera');
const btnStopCamera = document.getElementById('btn-stop-camera');
const btnStartTracking = document.getElementById('btn-start-tracking');
const btnStopTracking = document.getElementById('btn-stop-tracking');
const statusEl = document.getElementById('status');
const errorEl = document.getElementById('error');
const summaryEl = document.getElementById('summary');
const jsonOutput = document.getElementById('json-output');
const liveOverlay = document.getElementById('live-overlay');
const previewWrap = document.getElementById('preview-wrap');
const previewVideo = document.getElementById('preview-video');
const previewOverlay = document.getElementById('preview-overlay');

const sourceRadios = document.querySelectorAll('input[name="source"]');

let liveStream = null;
let lastProcessedData = null;
let previewObjectURL = null;
let trackingInterval = null;
let liveFrameIndex = 0;
let lastPosition = null;
let lastTimestampSec = null;
let canvas = null;
let liveDetections = [];

function setStatus(text) {
  statusEl.textContent = text;
}

function hideError() {
  errorEl.style.display = 'none';
  errorEl.textContent = '';
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.style.display = 'block';
}

function getSource() {
  return document.querySelector('input[name="source"]:checked')?.value || 'file';
}

/**
 * Get the rectangle where the video is actually drawn inside the element
 * (letterbox/pillarbox when aspect ratio is preserved).
 */
function getVideoDisplayRect(videoEl) {
  const vw = videoEl.videoWidth || 1;
  const vh = videoEl.videoHeight || 1;
  const cw = videoEl.clientWidth || vw;
  const ch = videoEl.clientHeight || vh;
  const videoAspect = vw / vh;
  const containerAspect = cw / ch;
  let x, y, width, height;
  if (containerAspect > videoAspect) {
    width = ch * videoAspect;
    height = ch;
    x = (cw - width) / 2;
    y = 0;
  } else {
    width = cw;
    height = cw / videoAspect;
    x = 0;
    y = (ch - height) / 2;
  }
  return { x, y, width, height, vw, vh };
}

/** Confidence above this: green dot; below: red dot. */
const CONFIDENCE_HIGH = 0.6;

/** Draw a dot at (x, y) in video coords on overlay; green if high confidence, red if low. */
function drawDotOnOverlay(overlay, videoEl, x, y, confidence) {
  if (!overlay || !videoEl || x == null || y == null) return;
  const rect = getVideoDisplayRect(videoEl);
  const cw = videoEl.clientWidth || 1;
  const ch = videoEl.clientHeight || 1;
  overlay.width = cw;
  overlay.height = ch;
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, cw, ch);
  const px = rect.x + (x / rect.vw) * rect.width;
  const py = rect.y + (y / rect.vh) * rect.height;
  const r = Math.max(6, Math.min(rect.width, rect.height) * 0.02);
  const highConf = confidence != null ? confidence >= CONFIDENCE_HIGH : true;
  ctx.fillStyle = highConf ? '#00ff00' : '#e00';
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function clearLiveOverlay() {
  if (liveOverlay) {
    const ctx = liveOverlay.getContext('2d');
    ctx.clearRect(0, 0, liveOverlay.width, liveOverlay.height);
  }
}

sourceRadios.forEach((r) => {
  r.addEventListener('change', () => {
    const src = getSource();
    panelFile.style.display = src === 'file' ? 'block' : 'none';
    panelLive.style.display = src === 'live' ? 'block' : 'none';
    if (src === 'file') {
      stopLiveTracking();
      stopLiveCamera();
    }
  });
});

videoFile.addEventListener('change', () => {
  btnProcess.disabled = !videoFile.files?.length;
});

// —— Recorded video ——
btnProcess.addEventListener('click', async () => {
  const file = videoFile.files?.[0];
  if (!file) return;

  hideError();
  setStatus('Processing…');
  btnProcess.disabled = true;
  jsonOutput.textContent = 'Processing…';

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API_BASE}/process`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStatus('Error');
      showError(data.error || `HTTP ${res.status}`);
      jsonOutput.textContent = JSON.stringify(data, null, 2);
      return;
    }

    if (!data.ok) {
      setStatus('Error');
      showError(data.error || 'Processing failed');
      jsonOutput.textContent = JSON.stringify(data, null, 2);
      return;
    }

    setStatus('Done');
    const detections = data.detections || [];
    const withPos = detections.filter((d) => d.ball_position != null).length;
    summaryEl.textContent = `Frames: ${data.frames_processed ?? 0} | FPS: ${data.fps ?? '—'} | Detections: ${withPos}`;
    jsonOutput.textContent = JSON.stringify(data, null, 2);
    lastProcessedData = data;
    showPreviewWithDot(file);
  } catch (e) {
    setStatus('Error');
    showError(e?.message || String(e));
    jsonOutput.textContent = '';
  } finally {
    btnProcess.disabled = false;
  }
});

// —— Live camera ——
function stopLiveCamera() {
  if (liveStream) {
    liveStream.getTracks().forEach((t) => t.stop());
    liveStream = null;
  }
  liveVideo.srcObject = null;
  liveVideo.style.display = 'none';
  livePlaceholder.style.display = 'flex';
  clearLiveOverlay();
  btnStartCamera.disabled = false;
  btnStopCamera.disabled = true;
  btnStartTracking.disabled = true;
  btnStopTracking.disabled = true;
}

function stopLiveTracking() {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  btnStartTracking.disabled = !liveStream;
  btnStopTracking.disabled = true;
}

async function captureAndSendFrame() {
  if (!liveVideo.videoWidth || !liveVideo.videoHeight) return;
  if (!canvas) {
    canvas = document.createElement('canvas');
  }
  canvas.width = liveVideo.videoWidth;
  canvas.height = liveVideo.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(liveVideo, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) return;

  const now = performance.now() / 1000;
  const formData = new FormData();
  formData.append('file', blob, 'frame.jpg');
  formData.append('frame_index', String(liveFrameIndex));
  formData.append('timestamp_sec', String(now));
  if (lastPosition && lastTimestampSec != null) {
    formData.append('previous_x', String(lastPosition.x));
    formData.append('previous_y', String(lastPosition.y));
    formData.append('previous_timestamp_sec', String(lastTimestampSec));
  }

  try {
    const res = await fetch(`${API_BASE}/process_frame`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok) {
      lastTimestampSec = now;
      if (data.ball_position) {
        lastPosition = data.ball_position;
        drawDotOnOverlay(liveOverlay, liveVideo, data.ball_position.x, data.ball_position.y, data.confidence);
      } else {
        clearLiveOverlay();
      }
      liveDetections.push({
        frame_index: data.frame_index,
        timestamp: data.timestamp,
        ball_position: data.ball_position,
        ball_speed_px_per_sec: data.ball_speed_px_per_sec,
        confidence: data.confidence,
      });
      if (liveDetections.length > 50) liveDetections = liveDetections.slice(-50);
      summaryEl.textContent = `Live: frame ${data.frame_index} | detections: ${liveDetections.filter((d) => d.ball_position).length}`;
      jsonOutput.textContent = JSON.stringify(
        { ok: true, live: true, latest: data, recent: liveDetections.slice(-10) },
        null,
        2
      );
    }
  } catch (_) {}
  liveFrameIndex += 1;
}

btnStartCamera.addEventListener('click', async () => {
  hideError();
  setStatus('Starting camera…');
  btnStartCamera.disabled = true;
  try {
    liveStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    liveVideo.srcObject = liveStream;
    liveVideo.style.display = 'block';
    livePlaceholder.style.display = 'none';
    await liveVideo.play();
    btnStopCamera.disabled = false;
    btnStartTracking.disabled = false;
    liveFrameIndex = 0;
    lastPosition = null;
    lastTimestampSec = null;
    liveDetections = [];
    setStatus('Camera on. Click Start tracking to run ball detection.');
  } catch (e) {
    setStatus('');
    showError(e?.message || 'Camera access failed');
    btnStartCamera.disabled = false;
  }
});

btnStopCamera.addEventListener('click', () => {
  stopLiveTracking();
  stopLiveCamera();
  setStatus('');
});

btnStartTracking.addEventListener('click', () => {
  hideError();
  stopLiveTracking();
  // High sampling rate (33 ms ≈ 30 fps) for frequent tracking
  trackingInterval = setInterval(captureAndSendFrame, 33);
  btnStartTracking.disabled = true;
  btnStopTracking.disabled = false;
  setStatus('Tracking… sending frames to backend.');
});

btnStopTracking.addEventListener('click', () => {
  stopLiveTracking();
  setStatus('Tracking stopped.');
});

// —— Recorded video preview with dot ——
function showPreviewWithDot(file) {
  if (previewObjectURL) URL.revokeObjectURL(previewObjectURL);
  previewObjectURL = URL.createObjectURL(file);
  previewVideo.src = previewObjectURL;
  previewWrap.style.display = 'block';
  previewVideo.addEventListener('loadedmetadata', () => {
    previewOverlay.width = previewVideo.clientWidth;
    previewOverlay.height = previewVideo.clientHeight;
  });
  previewVideo.addEventListener('timeupdate', () => {
    if (!lastProcessedData?.detections?.length) return;
    const cw = previewVideo.clientWidth || 1;
    const ch = previewVideo.clientHeight || 1;
    previewOverlay.width = cw;
    previewOverlay.height = ch;
    const fps = lastProcessedData.fps || 30;
    const frameIndex = Math.min(
      Math.floor(previewVideo.currentTime * fps),
      lastProcessedData.detections.length - 1
    );
    const det = lastProcessedData.detections[frameIndex];
    if (det?.ball_position) {
      drawDotOnOverlay(previewOverlay, previewVideo, det.ball_position.x, det.ball_position.y, det.confidence);
    } else {
      previewOverlay.getContext('2d').clearRect(0, 0, cw, ch);
    }
  });
}
