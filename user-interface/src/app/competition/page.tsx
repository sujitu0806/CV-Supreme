import {
  trainingSession,
  trainingFeedback,
  suggestedDrills,
} from "../data/mock";
import { AerialView3D } from "../components/AerialView3D";
import { CameraEmbed } from "../components/CameraEmbed";

export default function CompetitionPage() {
  return (
    <div className="mosaic-bg min-h-screen px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-zinc-800">Competition Mode</h1>
        <p className="mt-2 text-zinc-600">
          Real-time feedback as you practice — you&apos;ve got this!
        </p>

        {/* 1. Live video embed + aerial view */}
        <div className="mt-8 space-y-6">
          <CameraEmbed mode="comp" />
          <div className="rounded-xl border border-orange-200 bg-white p-6 shadow-sm">
            <AerialView3D />
          </div>
        </div>

        {/* 2. Feedback panel */}
        <div className="mt-8 rounded-xl border border-orange-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-800">Live feedback</h2>
          <p className="mt-1 text-sm text-zinc-500">Your last shot — keep it up!</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-100 bg-orange-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Ball placement</p>
              <p className="mt-1 font-medium text-zinc-800">{trainingFeedback.ballPlacement}</p>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-orange-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Spin detected</p>
              <p className="mt-1 font-medium text-zinc-800">{trainingFeedback.spinDetected}</p>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-orange-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Shot type</p>
              <p className="mt-1 font-medium text-zinc-800">{trainingFeedback.shotType}</p>
            </div>
            <div className="rounded-lg border border-zinc-100 bg-orange-50/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-orange-600">Player positioning</p>
              <p className="mt-1 font-medium text-zinc-800">{trainingFeedback.playerPositioning}</p>
            </div>
          </div>
        </div>

        {/* 3. Suggested drills */}
        <div className="mt-8 rounded-xl border border-orange-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-800">Suggested drills</h2>
          <p className="mt-1 text-sm text-zinc-500">Based on your session — a little focus goes a long way.</p>
          <ul className="mt-6 space-y-3">
            {suggestedDrills.map((drill, i) => (
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
