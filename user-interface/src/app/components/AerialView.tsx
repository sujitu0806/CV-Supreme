"use client";

import { useState } from "react";
import { aerialShots } from "../data/mock";
import type { Shot } from "../data/mock";

/** Aerial ping pong table dimensions (aspect ~1.8:1) */
const TABLE_WIDTH = 360;
const TABLE_HEIGHT = 200;
const DOT_SIZE = 10;

interface AerialViewProps {
  shots?: Shot[];
}

export function AerialView({ shots = aerialShots }: AerialViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredShot = shots.find((s) => s.id === hoveredId);

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-medium text-zinc-600">Aerial view — shot placement</h3>
      <div className="flex justify-center">
        <div
          className="relative rounded-xl border border-orange-200 bg-white p-8 shadow-sm"
          style={{ width: TABLE_WIDTH + 64, height: TABLE_HEIGHT + 64 }}
        >
          {/** SVG: top-down ping pong table */}
          <svg
            viewBox={`0 0 ${TABLE_WIDTH} ${TABLE_HEIGHT}`}
            className="absolute left-8 top-8"
            width={TABLE_WIDTH}
            height={TABLE_HEIGHT}
          >
            <rect
              x={0}
              y={0}
              width={TABLE_WIDTH}
              height={TABLE_HEIGHT}
              fill="#fef3c7"
              stroke="#fb923c"
              strokeWidth={3}
              rx={4}
            />
            <line
              x1={TABLE_WIDTH / 2}
              y1={0}
              x2={TABLE_WIDTH / 2}
              y2={TABLE_HEIGHT}
              stroke="#78716c"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            <text
              x={TABLE_WIDTH / 2}
              y={TABLE_HEIGHT / 2 - 4}
              textAnchor="middle"
              className="fill-zinc-500 text-[10px]"
            >
              net
            </text>
            <text x={20} y={20} className="fill-zinc-500 text-[10px]">Near</text>
            <text x={TABLE_WIDTH - 40} y={20} className="fill-zinc-500 text-[10px]">Far</text>
          </svg>

          <div
            className="absolute left-8 top-8"
            style={{ width: TABLE_WIDTH, height: TABLE_HEIGHT }}
          >
            {shots.map((shot) => (
              <div
                key={shot.id}
                className="absolute cursor-pointer transition-transform hover:scale-125"
                style={{
                  left: `${shot.x}%`,
                  top: `${shot.y}%`,
                  transform: "translate(-50%, -50%)",
                  width: DOT_SIZE,
                  height: DOT_SIZE,
                }}
                onMouseEnter={() => setHoveredId(shot.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div
                  className={`h-full w-full rounded-full ring-2 ring-white/80 ${
                    shot.won ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
              </div>
            ))}
          </div>

          {hoveredShot && (
            <div
              className="pointer-events-none absolute z-10 min-w-[140px] -translate-x-1/2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-lg"
              style={{
                left: 32 + (hoveredShot.x / 100) * TABLE_WIDTH,
                top: Math.max(
                  32 + (hoveredShot.y / 100) * TABLE_HEIGHT - 56,
                  32
                ),
              }}
            >
              <p className="font-medium text-zinc-800">
                {hoveredShot.shotType.charAt(0).toUpperCase() + hoveredShot.shotType.slice(1)}
              </p>
              <p className="text-zinc-600">Spin: {hoveredShot.spinType}</p>
              {hoveredShot.serveType && (
                <p className="text-zinc-600">Serve: {hoveredShot.serveType}</p>
              )}
              <p className={`mt-1 text-xs font-medium ${hoveredShot.won ? "text-emerald-600" : "text-red-600"}`}>
                {hoveredShot.won ? "Point won" : "Point lost"}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white/80" />
          <span className="text-xs text-zinc-600">Point won</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-white/80" />
          <span className="text-xs text-zinc-600">Point lost</span>
        </div>
      </div>
    </div>
  );
}
