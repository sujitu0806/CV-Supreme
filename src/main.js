/**
 * Unified app: Comp Mode and Training Mode on one localhost.
 * Same API key (from root .env). Toggle selects which prompt/runner is used.
 * Mode code stays in comp_mode/ and training-mode/ to avoid merge conflicts.
 */

import * as compMode from '../comp_mode/src/main.js';
import * as trainingMode from '../training-mode/src/main.js';

const MODE_COMP = 'comp';
const MODE_TRAINING = 'training';

const statusEl = document.getElementById('status');
const errorArea = document.getElementById('error-area');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnExport = document.getElementById('btn-export');
const cameraPreview = document.getElementById('camera-preview');
const cameraPlaceholder = document.getElementById('camera-placeholder');
const modeCompBtn = document.getElementById('mode-comp');
const modeTrainingBtn = document.getElementById('mode-training');
const compSection = document.getElementById('comp-section');
const trainingSection = document.getElementById('training-section');
const compExtraControls = document.getElementById('comp-extra-controls');
const lastAnalysisEl = document.getElementById('last-analysis');
const debugContent = document.getElementById('debug-content');
const metadataDisplay = document.getElementById('metadata-display');
const metadataJson = document.getElementById('metadata-json');
const shotList = document.getElementById('shot-list');
const observationsList = document.getElementById('observations-list');
const trainingDebugPre = document.getElementById('training-debug-pre');
const simpleTestCheckbox = document.getElementById('simple-test');

let currentMode = MODE_COMP;
let previewOnlyStream = null;
let currentSessionId = null;
const MAX_SHOTS = 10;
const MAX_OBS = 8;

function setStatus(text) {
  statusEl.textContent = text;
}
function showError(msg) {
  errorArea.textContent = msg || '';
  errorArea.style.display = msg ? 'block' : 'none';
}
function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function getActiveRunner() {
  return currentMode === MODE_COMP ? compMode : trainingMode;
}

function showCamera(stream, isPreviewOnly = false) {
  if (!stream) return;
  if (previewOnlyStream) {
    previewOnlyStream.getTracks().forEach((t) => t.stop());
    previewOnlyStream = null;
  }
  cameraPlaceholder.style.display = 'none';
  cameraPreview.style.display = 'block';
  cameraPreview.srcObject = stream;
  cameraPreview.play().catch(() => {});
  if (isPreviewOnly) previewOnlyStream = stream;
}

function hideCamera() {
  if (previewOnlyStream) {
    previewOnlyStream.getTracks().forEach((t) => t.stop());
    previewOnlyStream = null;
  }
  cameraPreview.srcObject = null;
  cameraPreview.style.display = 'none';
  cameraPlaceholder.style.display = 'flex';
}

function setMode(mode) {
  currentMode = mode;
  modeCompBtn.classList.toggle('active', mode === MODE_COMP);
  modeTrainingBtn.classList.toggle('active', mode === MODE_TRAINING);
  modeCompBtn.setAttribute('aria-selected', mode === MODE_COMP);
  modeTrainingBtn.setAttribute('aria-selected', mode === MODE_TRAINING);
  compSection.classList.toggle('active', mode === MODE_COMP);
  trainingSection.classList.toggle('active', mode === MODE_TRAINING);
  compExtraControls.classList.toggle('active', mode === MODE_COMP);
}

async function stopActive() {
  const runner = getActiveRunner();
  await runner.stop({ onStatus: () => {} });
  hideCamera();
  setStatus('Stopped');
  btnStart.disabled = false;
  btnStop.disabled = true;
}

// ---------- Comp Mode UI (paddle-focused) ----------
function showLastAnalysis(data) {
  if (!lastAnalysisEl) return;
  const paddle = data?.paddle_visible === true;
  const strike = data?.strike_detected === true;
  let msg = 'Last result: ';
  if (paddle && strike) msg += '<strong>paddle visible, strike detected</strong>';
  else if (paddle) msg += 'paddle visible, <code>no strike</code>';
  else msg += '<code>no paddle / no strike</code>';
  lastAnalysisEl.innerHTML = msg;
  lastAnalysisEl.style.display = 'block';
}

function showDebugResult(info) {
  if (!debugContent) return;
  const rawPreview = info.raw.length > 400 ? info.raw.slice(0, 400) + '…' : info.raw;
  const okClass = info.ok ? 'ok' : 'fail';
  let html = `<p><strong>Results received:</strong> ${info.count}</p>`;
  html += `<p><strong>Last response</strong> — <span class="${okClass}">ok: ${info.ok}</span>`;
  if (info.error) html += ` <span class="fail">error: ${escapeHtml(info.error)}</span>`;
  html += '</p>';
  if (info.parseError) html += `<p class="fail">Parse error: ${escapeHtml(info.parseError)}</p>`;
  if (info.parsed != null) html += '<p>Parsed: <pre>' + escapeHtml(JSON.stringify(info.parsed, null, 2).slice(0, 800)) + (JSON.stringify(info.parsed).length > 800 ? '…' : '') + '</pre></p>';
  html += '<p>Raw result (last):</p><pre>' + escapeHtml(rawPreview || '(empty)') + '</pre>';
  debugContent.innerHTML = html;
}

function renderCompMetadata(shot) {
  if (!shot) {
    metadataDisplay.innerHTML = '<p class="none">No paddle strike detected yet. Point camera at the paddle and make a strike.</p>';
    metadataJson.style.display = 'none';
    return;
  }
  const hand = shot.handedness?.value ?? '—';
  const side = shot.paddle_side?.value ?? '—';
  const dist = shot.paddle_distance?.value ?? '—';
  const vert = shot.face_orientation?.vertical_angle?.value ?? '—';
  const lat = shot.face_orientation?.lateral_angle?.value ?? '—';
  const hDir = shot.motion?.horizontal_direction?.value ?? '—';
  const vComp = shot.motion?.vertical_component?.value ?? '—';
  const plane = shot.motion?.plane?.value ?? '—';
  const speed = shot.speed?.value ?? '—';
  const follow = shot.follow_through?.value ?? '—';
  const rot = shot.rotation?.value ?? '—';
  const height = shot.strike_height ?? '—';
  const timing = shot.swing_timing ?? '—';
  metadataDisplay.innerHTML = `
    <dl class="metadata-grid">
      <dt>Timestamp</dt><dd>${shot.shot_timestamp}</dd>
      <dt>Paddle visible</dt><dd>${shot.paddle_visible ? 'yes' : 'no'}</dd>
      <dt>Strike detected</dt><dd>${shot.strike_detected ? 'yes' : 'no'}</dd>
      <dt>Handedness</dt><dd>${hand}</dd>
      <dt>Paddle side (red/black)</dt><dd>${side}</dd>
      <dt>Paddle distance</dt><dd>${dist}</dd>
      <dt>Face vertical</dt><dd>${vert}</dd>
      <dt>Face lateral</dt><dd>${lat}</dd>
      <dt>Motion horizontal</dt><dd>${hDir}</dd>
      <dt>Motion vertical</dt><dd>${vComp}</dd>
      <dt>Motion plane</dt><dd>${plane}</dd>
      <dt>Speed</dt><dd>${speed}</dd>
      <dt>Follow-through</dt><dd>${follow}</dd>
      <dt>Rotation / wrist</dt><dd>${rot}</dd>
      <dt>Strike height</dt><dd>${height}</dd>
      <dt>Swing timing</dt><dd>${timing}</dd>
    </dl>
  `;
  metadataJson.textContent = JSON.stringify(shot, null, 2);
  metadataJson.style.display = 'block';
}

function renderShots() {
  const shots = compMode.shots || [];
  const recent = shots.slice(-MAX_SHOTS).reverse();
  shotList.innerHTML = recent.map((s) => {
    const side = s.paddle_side?.value ?? '—';
    const speed = s.speed?.value ?? '—';
    const follow = s.follow_through?.value ?? '—';
    const hand = s.handedness?.value ?? '—';
    return `<li><strong>${s.shot_timestamp}</strong> Side: ${side} · Speed: ${speed} · Follow: ${follow} · Hand: ${hand}</li>`;
  }).join('');
  renderCompMetadata(shots[shots.length - 1]);
}

async function apiSessionStart() {
  const res = await fetch('/api/session/start', { method: 'POST' });
  if (!res.ok) return null;
  const { sessionId } = await res.json();
  return sessionId;
}
async function apiSessionAppend(sessionId, shot) {
  if (!sessionId) return;
  try {
    await fetch('/api/session/append', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, shot }) });
  } catch (e) { console.warn('Session append failed:', e); }
}
async function apiSessionEnd(sessionId, shotsList) {
  if (!sessionId) return;
  try {
    await fetch('/api/session/end', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, shots: shotsList }) });
  } catch (e) { console.warn('Session end failed:', e); }
}

// ---------- Training Mode UI ----------
function renderObservation(obs) {
  const div = document.createElement('div');
  div.className = 'observation-block';
  const ball = obs.ball_placement || {};
  const spin = obs.spin_type || {};
  const shot = obs.shot_type || {};
  const loc = obs.player_locations || {};
  const pa = loc.player_a || {};
  const pb = loc.player_b || {};
  div.innerHTML = `
    <div class="ts">${obs.timestamp || '—'}</div>
    <div class="row">Ball: ${ball.zone ?? '—'} (${(ball.confidence ?? 0).toFixed(2)})</div>
    <div class="row">Spin: ${spin.value ?? '—'} (${(spin.confidence ?? 0).toFixed(2)})</div>
    <div class="row">Shot: ${shot.value ?? '—'} (${(shot.confidence ?? 0).toFixed(2)})</div>
    <div class="row">Player A: ${pa.distance_from_table ?? '—'} / ${pa.lateral_position ?? '—'}</div>
    <div class="row">Player B: ${pb.distance_from_table ?? '—'} / ${pb.lateral_position ?? '—'}</div>
  `;
  return div;
}

function refreshObservationsList() {
  const list = trainingMode.observations || [];
  const slice = list.slice(-MAX_OBS).reverse();
  observationsList.innerHTML = '';
  if (slice.length === 0) {
    observationsList.innerHTML = '<p class="none">No observations yet. Start the stream.</p>';
    return;
  }
  slice.forEach((obs) => observationsList.appendChild(renderObservation(obs)));
}

// ---------- Start / Stop ----------
async function onStart() {
  showError('');
  btnStart.disabled = true;
  setStatus('Starting…');
  const runner = getActiveRunner();
  const getPreview = runner.getPreviewStream || compMode.getPreviewStream;
  let previewStream = null;
  try {
    previewStream = await getPreview();
    showCamera(previewStream, true);
    setStatus('Connecting…');
    if (currentMode === MODE_COMP) {
      try {
        currentSessionId = await apiSessionStart();
      } catch (_) { currentSessionId = null; }
      lastAnalysisEl.style.display = 'none';
      debugContent.innerHTML = 'Connecting…';
    } else {
      trainingDebugPre.textContent = 'Connecting…';
    }
  } catch (e) {
    showError('Camera: ' + (e?.message ?? String(e)));
    setStatus('Camera error');
    btnStart.disabled = false;
    return;
  }

  const opts = {
    onStatus(s) {
      if (s === 'running') {
        btnStop.disabled = false;
        setStatus('Running — analyzing…');
      } else if (s === 'error') {
        btnStart.disabled = false;
        setStatus('Analysis failed (camera stays on)');
      } else if (s === 'stopped') { /* no-op */ }
    },
    onError(msg) { showError(msg); },
    onStream(stream) {
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
        previewStream = null;
      }
      showCamera(stream, false);
    },
  };

  if (currentMode === MODE_COMP) {
    opts.onRawResult = showLastAnalysis;
    opts.onDebugResult = showDebugResult;
    opts.useSimpleTest = !!simpleTestCheckbox?.checked;
    try {
      await compMode.start(opts);
    } catch (e) {
      showError(e?.message ?? String(e));
      setStatus('Analysis failed (camera stays on)');
      btnStart.disabled = false;
    }
    return;
  }

  opts.onDebugResult = (info) => {
    trainingDebugPre.textContent = `Count: ${info.count} | OK: ${info.ok}\nRaw: ${(info.raw || '').slice(0, 400)}…\nParsed: ${JSON.stringify(info.parsed, null, 2)}`;
  };
  try {
    await trainingMode.start(opts);
  } catch (e) {
    showError(e?.message ?? String(e));
    setStatus('Analysis failed (camera stays on)');
    btnStart.disabled = false;
  }
}

async function onStop() {
  btnStop.disabled = true;
  setStatus('Stopping…');
  showError('');
  if (currentMode === MODE_COMP && currentSessionId) {
    await apiSessionEnd(currentSessionId, [...(compMode.shots || [])]);
    currentSessionId = null;
  }
  lastAnalysisEl.style.display = 'none';
  debugContent.innerHTML = '<p class="none">Start the stream to see API response count and last raw result.</p>';
  hideCamera();
  const runner = getActiveRunner();
  await runner.stop({ onStatus(s) { if (s === 'stopped') { btnStart.disabled = false; setStatus('Stopped'); } } });
}

// ---------- Event wiring ----------
modeCompBtn.addEventListener('click', () => {
  if (currentMode === MODE_COMP) return;
  if (btnStop.disabled === false) {
    stopActive().then(() => setMode(MODE_COMP));
  } else {
    setMode(MODE_COMP);
  }
});

modeTrainingBtn.addEventListener('click', () => {
  if (currentMode === MODE_TRAINING) return;
  if (btnStop.disabled === false) {
    stopActive().then(() => setMode(MODE_TRAINING));
  } else {
    setMode(MODE_TRAINING);
  }
});

btnStart.addEventListener('click', onStart);
btnStop.addEventListener('click', onStop);

compMode.onShot(() => {
  renderShots();
  if (currentSessionId) apiSessionAppend(currentSessionId, compMode.shots[compMode.shots.length - 1]);
});
trainingMode.onObservation(() => refreshObservationsList());

btnExport.addEventListener('click', () => {
  const payload = { exportedAt: new Date().toISOString(), shots: compMode.shots || [] };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const now = new Date();
  const name = `shots_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.json`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
});
