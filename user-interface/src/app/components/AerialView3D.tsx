"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Shot3D } from "../data/mock";
import { shots3D } from "../data/mock";

const Scene = dynamic(
  () => import("./AerialView3DScene").then((mod) => mod.AerialView3DScene),
  { ssr: false }
);

interface AerialView3DProps {
  shots?: Shot3D[];
}

export function AerialView3D({ shots = shots3D }: AerialView3DProps) {
  const [selectedShot, setSelectedShot] = useState<Shot3D | null>(null);

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-medium text-zinc-600">
        3D aerial view — shot placement
      </h3>
      <div className="relative h-[400px] w-full overflow-hidden rounded-xl border border-orange-200 bg-zinc-900">
        <Scene shots={shots} onShotSelect={setSelectedShot} />
        {selectedShot && (
          <div
            className="absolute left-4 top-4 z-10 min-w-[180px] rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm shadow-lg"
            data-testid="shot-tooltip"
          >
            <p className="font-semibold text-zinc-800">
              {selectedShot.player === "you" ? "You" : "Opponent"}
            </p>
            <p className="text-zinc-600">Spin: {selectedShot.spin}</p>
            <p className="text-zinc-600">Shot: {selectedShot.shotType}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Coords: ({selectedShot.x.toFixed(2)}, {selectedShot.y.toFixed(2)})
            </p>
            <p
              className={`mt-1 text-xs font-medium ${
                selectedShot.won ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {selectedShot.won ? "Point won" : "Point lost"}
            </p>
            <button
              type="button"
              onClick={() => setSelectedShot(null)}
              className="mt-2 text-xs text-orange-600 hover:text-orange-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-zinc-500">
        Drag to rotate • Scroll to zoom • Click spheres for details
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-zinc-600">Won (sphere)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-xs text-zinc-600">Lost (sphere)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-emerald-700" />
          <span className="text-xs text-zinc-600">Opponent (cube)</span>
        </div>
      </div>
    </div>
  );
}
