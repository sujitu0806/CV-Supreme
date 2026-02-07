/**
 * Logged rounds store — persists to localStorage for Past Rounds page.
 */

import type { Shot, Shot3D } from "./mock";

const TABLE_WIDTH_M = 1.525;
const TABLE_LENGTH_M = 2.74;

/** Convert Shot3D (meters) to Shot (0–100%) for AerialView */
export function shot3DToShot(s: Shot3D): Shot {
  return {
    id: s.id,
    x: (s.x / TABLE_WIDTH_M) * 100,
    y: (s.y / TABLE_LENGTH_M) * 100,
    won: s.won,
    shotType: s.shotType,
    spinType: s.spinType,
  };
}

const STORAGE_KEY = "cv-supreme-logged-rounds";
const HIDDEN_PLACEHOLDERS_KEY = "cv-supreme-hidden-placeholders";

export interface LoggedRound {
  id: string;
  mode: "training" | "competition";
  shots: Shot[];
  score: string;
  advice: string;
  loggedAt: string;
}

function loadRounds(): LoggedRound[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRounds(rounds: LoggedRound[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
  } catch {
    // ignore
  }
}

export function getLoggedRounds(): LoggedRound[] {
  return loadRounds();
}

const DEDUPE_WINDOW_MS = 15000; // 15s: if same score logged recently, skip (prevents comp + training double-log)

export function addLoggedRound(round: Omit<LoggedRound, "id" | "loggedAt">): LoggedRound | null {
  const rounds = loadRounds();
  const last = rounds[0];
  if (
    last &&
    last.score === round.score &&
    last.shots.length === round.shots.length &&
    Date.now() - new Date(last.loggedAt).getTime() < DEDUPE_WINDOW_MS
  ) {
    return null; // already logged (e.g. from other mode)
  }
  const newRound: LoggedRound = {
    ...round,
    id: `round_${Date.now()}`,
    loggedAt: new Date().toISOString(),
  };
  rounds.unshift(newRound);
  saveRounds(rounds);
  return newRound;
}

export function deleteLoggedRound(id: string): void {
  const rounds = loadRounds().filter((r) => r.id !== id);
  saveRounds(rounds);
}

function loadHiddenPlaceholders(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HIDDEN_PLACEHOLDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHiddenPlaceholders(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HIDDEN_PLACEHOLDERS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function getHiddenPlaceholderIds(): string[] {
  return loadHiddenPlaceholders();
}

export function hidePlaceholderRound(id: string): void {
  const ids = loadHiddenPlaceholders();
  if (!ids.includes(id)) {
    ids.push(id);
    saveHiddenPlaceholders(ids);
  }
}
