"use client";

import { useState } from "react";
import {
  competitionMatch,
  player1Strategy,
  player2Strategy,
} from "../data/mock";
import { AerialView3D } from "../components/AerialView3D";
import { CameraEmbed } from "../components/CameraEmbed";

type PlayerRole = "You" | "Opponent";

export default function TrainingPage() {
  const { score } = competitionMatch;
  const [player1Role, setPlayer1Role] = useState<PlayerRole>("You");
  const [player2Role, setPlayer2Role] = useState<PlayerRole>("Opponent");

  const roleOptions: PlayerRole[] = ["You", "Opponent"];

  return (
    <div className="mosaic-bg min-h-screen px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-zinc-800">Training Mode</h1>
        <p className="mt-2 text-zinc-600">
          Real-time strategy assistance — play smart.
        </p>

        {/* Score bar with role dropdowns */}
        <div className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-orange-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-medium text-zinc-500">Player 1 (left)</p>
              <select
                value={player1Role}
                onChange={(e) => setPlayer1Role(e.target.value as PlayerRole)}
                className="mt-1 rounded border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700"
              >
                {roleOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <span className="text-3xl font-bold text-orange-600">{score.player_a}</span>
          </div>
          <span className="text-lg font-medium text-zinc-400">—</span>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-orange-600">{score.player_b}</span>
            <div className="text-right">
              <p className="text-xs font-medium text-zinc-500">Player 2 (right)</p>
              <select
                value={player2Role}
                onChange={(e) => setPlayer2Role(e.target.value as PlayerRole)}
                className="mt-1 rounded border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700"
              >
                {roleOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Three-column: Player 1 feedback | Live match | Player 2 feedback */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr_280px]">
          <div className="rounded-xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-800">
              Player 1 (left) — {player1Role}
            </h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Weakness</p>
                <p className="mt-1 text-sm font-medium text-zinc-800">{player1Strategy.weakness}</p>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Serve suggestion</p>
                <p className="mt-1 text-sm font-medium text-zinc-800">{player1Strategy.serveSuggestion}</p>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Shot advice</p>
                <p className="mt-1 text-sm font-medium text-zinc-800">{player1Strategy.shotAdvice}</p>
              </div>
              <p className="text-xs text-zinc-500">{player1Strategy.positioning}</p>
            </div>
          </div>

          <div className="space-y-6">
            <CameraEmbed mode="training" />
            <div className="rounded-xl border border-orange-200 bg-white p-6 shadow-sm">
              <AerialView3D />
            </div>
          </div>

          <div className="rounded-xl border border-orange-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-zinc-800">
              Player 2 (right) — {player2Role}
            </h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Weakness</p>
                <p className="mt-1 text-sm font-medium text-zinc-800">{player2Strategy.weakness}</p>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Serve suggestion</p>
                <p className="mt-1 text-sm font-medium text-zinc-800">{player2Strategy.serveSuggestion}</p>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Shot advice</p>
                <p className="mt-1 text-sm font-medium text-zinc-800">{player2Strategy.shotAdvice}</p>
              </div>
              <p className="text-xs text-zinc-500">{player2Strategy.positioning}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
