// Mock data for CV Supreme hackathon MVP

/** Real-time feedback for Training Mode UI */
export const trainingFeedback = {
  ballPlacement: "Deep right corner — nice depth!",
  spinDetected: "Topspin",
  shotType: "Loop",
  playerPositioning: "Mid-distance from table (good for rallies)",
};

/** Suggested drills for Training Mode */
export const suggestedDrills = [
  "Practice your short serve placement — aim for the corners to open up angles.",
  "Work on transitioning from backspin to topspin; your loop is strong, keep mixing it in.",
  "Drill cross-court consistency: 10 loops in a row to the same spot builds muscle memory.",
];

export const trainingSession = {
  sessionId: "train_001",
  duration: "12:34",
  shots: [
    { zone: "deep right corner", spin: "topspin", shotType: "loop", confidence: 0.92 },
    { zone: "mid-table", spin: "backspin", shotType: "push", confidence: 0.88 },
    { zone: "near net", spin: "sidespin", shotType: "serve", confidence: 0.95 },
    { zone: "deep left corner", spin: "topspin", shotType: "drive", confidence: 0.87 },
    { zone: "center", spin: "flat", shotType: "block", confidence: 0.91 },
    { zone: "mid-table", spin: "backspin", shotType: "chop", confidence: 0.84 },
  ],
  playerLocations: {
    player_a: { distance: "mid-distance", lateral: "center" },
    player_b: { distance: "mid-distance", lateral: "right" },
  },
};

/** Per-player strategy for Competition Mode UI */
export const player1Strategy = {
  weakness: "Backhand inconsistency on wide balls",
  serveSuggestion: "Short backspin serve recommended",
  shotAdvice: "Attack opponent backhand",
  positioning: "Standing close to table — vulnerable to deep serves",
};

export const player2Strategy = {
  weakness: "Slow recovery from wide forehand",
  serveSuggestion: "Long topspin serve to corners",
  shotAdvice: "Target forehand then switch to backhand",
  positioning: "Mid-distance — mix short and long",
};

export const competitionMatch = {
  matchId: "comp_042",
  score: { player_a: 11, player_b: 9 },
  rallies: [
    { shotDetected: true, serveType: "short backspin", spin: "backspin", zone: "near net", rallyLength: 4 },
    { shotDetected: true, serveType: "not a serve", spin: "topspin", zone: "deep right corner", rallyLength: 7 },
    { shotDetected: true, serveType: "long topspin", spin: "topspin", zone: "deep left corner", rallyLength: 3 },
  ],
};

/** Individual shot landing for aerial statistics view */
export interface Shot {
  id: string;
  x: number; // 0–100 % across table width
  y: number; // 0–100 % along table length
  won: boolean;
  shotType: string;
  spinType: string;
  serveType?: string;
}

export const aerialShots: Shot[] = [
  { id: "1", x: 22, y: 35, won: true, shotType: "drive", spinType: "topspin", serveType: undefined },
  { id: "2", x: 78, y: 28, won: false, shotType: "loop", spinType: "topspin", serveType: undefined },
  { id: "3", x: 50, y: 12, won: true, shotType: "serve", spinType: "backspin", serveType: "short backspin" },
  { id: "4", x: 15, y: 72, won: true, shotType: "chop", spinType: "backspin", serveType: undefined },
  { id: "5", x: 85, y: 68, won: false, shotType: "smash", spinType: "flat", serveType: undefined },
  { id: "6", x: 48, y: 55, won: true, shotType: "block", spinType: "topspin", serveType: undefined },
  { id: "7", x: 72, y: 18, won: false, shotType: "push", spinType: "backspin", serveType: "long topspin" },
  { id: "8", x: 30, y: 82, won: true, shotType: "loop", spinType: "topspin", serveType: undefined },
  { id: "9", x: 65, y: 45, won: false, shotType: "drive", spinType: "sidespin", serveType: undefined },
  { id: "10", x: 40, y: 8, won: true, shotType: "serve", spinType: "sidespin", serveType: "short sidespin" },
  { id: "11", x: 55, y: 88, won: true, shotType: "drive", spinType: "topspin", serveType: undefined },
  { id: "12", x: 18, y: 42, won: false, shotType: "chop", spinType: "backspin", serveType: undefined },
  { id: "13", x: 88, y: 52, won: true, shotType: "loop", spinType: "topspin", serveType: undefined },
  { id: "14", x: 52, y: 22, won: false, shotType: "serve", spinType: "backspin", serveType: "long backspin" },
  { id: "15", x: 35, y: 65, won: true, shotType: "block", spinType: "flat", serveType: undefined },
];

/**
 * Coordinate system for shot placement:
 * - X axis: out of screen (toward camera)
 * - Y axis: along table width
 * - Z axis: vertical (gravity)
 */
export interface Shot3D {
  id: string;
  player: "you" | "opponent";
  /** X position in meters (table width 1.525m) */
  x: number;
  /** Y position in meters (table length 2.74m) */
  y: number;
  won: boolean;
  spinType: string;
  shotType: string;
  /** Stroke speed in m/s from wrist velocity */
  strokeSpeedMps?: number;
  /** Wrist flexion (degrees) */
  wristPitch?: number;
  /** Paddle tilt vs horizontal (degrees) */
  paddleAngle?: number;
}

export const shots3D: Shot3D[] = [
  { id: "1", player: "you", x: 0.3, y: 0.5, won: true, spinType: "topspin", shotType: "forehand", strokeSpeedMps: 2.4, wristPitch: 28, paddleAngle: 45 },
  { id: "2", player: "opponent", x: 1.2, y: 0.8, won: false, spinType: "backspin", shotType: "backhand", strokeSpeedMps: 1.8, wristPitch: 42, paddleAngle: 85 },
  { id: "3", player: "you", x: 1.0, y: 0.3, won: true, spinType: "topspin", shotType: "serve", strokeSpeedMps: 3.1, wristPitch: 22, paddleAngle: 22 },
  { id: "4", player: "opponent", x: 0.2, y: 1.5, won: true, spinType: "sidespin", shotType: "forehand", strokeSpeedMps: 2.0, wristPitch: 35, paddleAngle: 45 },
  { id: "5", player: "you", x: 1.3, y: 1.1, won: false, spinType: "flat", shotType: "smash", strokeSpeedMps: 4.2, wristPitch: 18, paddleAngle: 12 },
  { id: "6", player: "opponent", x: 0.75, y: 0.9, won: false, spinType: "backspin", shotType: "push", strokeSpeedMps: 1.2, wristPitch: 48, paddleAngle: 92 },
  { id: "7", player: "you", x: 0.5, y: 2.0, won: true, spinType: "topspin", shotType: "loop", strokeSpeedMps: 2.8, wristPitch: 25, paddleAngle: 38 },
  { id: "8", player: "opponent", x: 1.1, y: 1.8, won: false, spinType: "topspin", shotType: "drive", strokeSpeedMps: 2.5, wristPitch: 32, paddleAngle: 55 },
  { id: "9", player: "you", x: 0.15, y: 0.2, won: true, spinType: "backspin", shotType: "serve", strokeSpeedMps: 2.2, wristPitch: 38, paddleAngle: 78 },
  { id: "10", player: "opponent", x: 1.35, y: 2.4, won: true, spinType: "flat", shotType: "block", strokeSpeedMps: 1.5, wristPitch: 45, paddleAngle: 65 },
];

export const courtZones = [
  { id: "nw", label: "Near Net Left", row: 0, col: 0, count: 12 },
  { id: "nc", label: "Near Net Center", row: 0, col: 1, count: 8 },
  { id: "ne", label: "Near Net Right", row: 0, col: 2, count: 15 },
  { id: "mw", label: "Mid Left", row: 1, col: 0, count: 22 },
  { id: "mc", label: "Mid Center", row: 1, col: 1, count: 18 },
  { id: "me", label: "Mid Right", row: 1, col: 2, count: 20 },
  { id: "sw", label: "Deep Left", row: 2, col: 0, count: 14 },
  { id: "sc", label: "Deep Center", row: 2, col: 1, count: 9 },
  { id: "se", label: "Deep Right", row: 2, col: 2, count: 28 },
];
