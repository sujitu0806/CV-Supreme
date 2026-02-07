"use client";

import { useState, useEffect, useRef } from "react";
import { AerialView } from "../components/AerialView";
import { defaultPastRounds } from "../data/mock";
import type { PastRoundDisplay } from "../data/mock";
import {
  getLoggedRounds,
  getHiddenPlaceholderIds,
  hidePlaceholderRound,
  deleteLoggedRound,
  type LoggedRound,
} from "../data/loggedRoundsStore";

function RoundCard({
  round,
  onDelete,
}: {
  round: PastRoundDisplay | LoggedRound;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [menuOpen]);
  const shots = "shots" in round ? round.shots : [];
  const score = "score" in round ? round.score : "–";
  const tipsSummary = "tipsSummary" in round ? (round as PastRoundDisplay).tipsSummary : [(round as LoggedRound).advice];

  return (
    <div className="relative rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
        className="absolute left-3 top-3 rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Options"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="18" r="1.5" />
        </svg>
      </button>
      {menuOpen && (
        <div className="absolute left-3 top-10 z-20 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onDelete();
              setMenuOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
      <div className="mt-6">
        <div className="mb-3 flex justify-center">
          <AerialView shots={shots} showZones={true} compact />
        </div>
        <p className="text-center text-lg font-semibold text-orange-600">{score}</p>
        <ul className="mt-2 space-y-1 text-xs text-zinc-600">
          {tipsSummary.map((t, i) => (
            <li key={i}>• {t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function PastRoundsPage() {
  const [trainingRounds, setTrainingRounds] = useState<(PastRoundDisplay | LoggedRound)[]>([]);
  const [competitionRounds, setCompetitionRounds] = useState<(PastRoundDisplay | LoggedRound)[]>([]);
  const [hiddenPlaceholders, setHiddenPlaceholders] = useState<string[]>([]);

  useEffect(() => {
    const hidden = getHiddenPlaceholderIds();
    setHiddenPlaceholders(hidden);
    const logged = getLoggedRounds();
    const placeholders = defaultPastRounds.filter((p) => !hidden.includes(p.id));
    const trainPlaceholders = placeholders.filter((r) => r.mode === "training");
    const compPlaceholders = placeholders.filter((r) => r.mode === "competition");
    const trainLogged = logged.filter((r) => r.mode === "training");
    const compLogged = logged.filter((r) => r.mode === "competition");
    setTrainingRounds([...trainPlaceholders, ...trainLogged]);
    setCompetitionRounds([...compPlaceholders, ...compLogged]);
  }, []);

  const handleDelete = (id: string, mode: "training" | "competition") => {
    const round = defaultPastRounds.find((r) => r.id === id);
    if (round?.isPlaceholder) {
      hidePlaceholderRound(id);
      setHiddenPlaceholders((prev) => [...prev, id]);
    } else {
      deleteLoggedRound(id);
    }
    if (mode === "training") {
      setTrainingRounds((prev) => prev.filter((r) => r.id !== id));
    } else {
      setCompetitionRounds((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="mosaic-bg min-h-screen px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-zinc-800">Past Rounds</h1>
        <p className="mt-2 text-zinc-600">
          Review your logged training and competition sessions.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Training section */}
          <section className="rounded-xl border border-orange-200 bg-white/80 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-800">Training</h2>
            <p className="mt-1 text-sm text-zinc-500">Logged training sessions</p>
            <div className="mt-6 space-y-4">
              {trainingRounds.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">No training rounds yet</p>
              ) : (
                trainingRounds.map((round) => (
                  <RoundCard
                    key={round.id}
                    round={round}
                    onDelete={() => handleDelete(round.id, "training")}
                  />
                ))
              )}
            </div>
          </section>

          {/* Competition section */}
          <section className="rounded-xl border border-orange-200 bg-white/80 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-800">Competition</h2>
            <p className="mt-1 text-sm text-zinc-500">Logged competition matches</p>
            <div className="mt-6 space-y-4">
              {competitionRounds.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">No competition rounds yet</p>
              ) : (
                competitionRounds.map((round) => (
                  <RoundCard
                    key={round.id}
                    round={round}
                    onDelete={() => handleDelete(round.id, "competition")}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
