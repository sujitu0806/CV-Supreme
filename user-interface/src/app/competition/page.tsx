"use client";

import { useState } from "react";
import {
  trainingSession,
  competitionFeedback,
  competitionDrills,
  compShots3D,
  competitionMatch,
} from "../data/mock";
import { AerialView3D } from "../components/AerialView3D";
import { CameraEmbed } from "../components/CameraEmbed";
import { addLoggedRound, shot3DToShot } from "../data/loggedRoundsStore";

export default function CompetitionPage() {
  const [logged, setLogged] = useState(false);
  const { score } = competitionMatch;

  const handleLogSession = () => {
    const result = addLoggedRound({
      mode: "competition",
      shots: compShots3D.map(shot3DToShot),
      score: `${score.player_a}–${score.player_b}`,
      advice: `${competitionFeedback.neededAction} ${competitionFeedback.recommendedTips}`,
    });
    if (result) setLogged(true);
  };

  return (
    <div className="mosaic-bg min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-zinc-800">Competition Mode</h1>
        <p className="mt-2 text-zinc-600">
          Real-time feedback as you practice — you&apos;ve got this!
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleLogSession}
            disabled={logged}
            className="rounded-lg border border-orange-300 bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-200 disabled:opacity-50"
          >
            {logged ? "Session logged" : "Log session"}
          </button>
        </div>

        {/* 1. Live video embed + aerial view */}
        <div className="mt-8 space-y-6">
          <CameraEmbed mode="comp" />
          <div className="rounded-xl border border-orange-200 bg-white p-6 shadow-sm">
            <AerialView3D shots={compShots3D} showZones={false} />
          </div>
        </div>

        {/* 2. Feedback panel — opponent strengths + action, weaknesses + tips */}
        <div className="mt-8 rounded-xl border border-orange-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-800">Live feedback</h2>
          <p className="mt-1 text-sm text-zinc-500">Opponent analysis — play to their weaknesses.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-100 bg-emerald-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Opponent strength</p>
              <p className="mt-1 font-medium text-zinc-800">{competitionFeedback.opponentStrength}</p>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-orange-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Needed action</p>
              <p className="mt-1 font-medium text-zinc-800">{competitionFeedback.neededAction}</p>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-amber-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Opponent weakness</p>
              <p className="mt-1 font-medium text-zinc-800">{competitionFeedback.opponentWeakness}</p>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-orange-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Recommended tips</p>
              <p className="mt-1 font-medium text-zinc-800">{competitionFeedback.recommendedTips}</p>
            </div>
          </div>
        </div>

        {/* 3. Suggested drills — based on opponent aggressive backhand & slow forehand */}
        <div className="mt-8 rounded-xl border border-orange-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-800">Suggested drills</h2>
          <p className="mt-1 text-sm text-zinc-500">Exploit opponent&apos;s slow forehand, avoid their aggressive backhand.</p>
          <ul className="mt-6 space-y-3">
            {competitionDrills.map((drill, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-zinc-100 bg-orange-50/30 p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-200 text-sm font-bold text-orange-700">
                  {i + 1}
                </span>
                <p className="text-zinc-700">{drill}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-medium text-orange-600">
            You&apos;re making progress. Stick with these and you&apos;ll see the difference.
          </p>
        </div>

        {/* Session summary */}
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-zinc-500">Session duration</p>
              <p className="text-xl font-semibold text-orange-600">{trainingSession.duration}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-500">Shots analyzed</p>
              <p className="text-xl font-semibold text-zinc-800">{trainingSession.shots.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
