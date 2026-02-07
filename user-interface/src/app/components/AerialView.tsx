"use client";

import { useState } from "react";
import { aerialShots } from "../data/mock";
import type { Shot } from "../data/mock";

/** Aerial ping pong table dimensions (aspect ~1.8:1) */
const TABLE_WIDTH = 360;
const TABLE_HEIGHT = 200;
const DOT_SIZE = 10;

/** Zone colors: 1 lightest, 2 medium, 3 darkest — subtler pinks */
const ZONE_COLORS = ["#fef7f9", "#fcecf2", "#fadde8"];

interface AerialViewProps {
  shots?: Shot[];
  showZones?: boolean;
  compact?: boolean;
}

export function AerialView({ shots = aerialShots, showZones = true, compact = false }: AerialViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredShot = shots.find((s) => s.id === hoveredId);

  const halfW = TABLE_WIDTH / 2;
  const thirdH = TABLE_HEIGHT / 3; // 3 zones per side
  const pad = compact ? 8 : 32; // px padding for SVG/overlay positioning

  return (
    <div className={compact ? "" : "mt-6"}>
      {!compact && <h3 className="mb-3 text-sm font-medium text-zinc-600">Aerial view — shot placement</h3>}
      <div className="flex justify-center">
        <div
          className={`relative rounded-xl border border-orange-200 bg-white shadow-sm ${compact ? "p-2" : "p-8"}`}
          style={{ width: TABLE_WIDTH + pad * 2, height: TABLE_HEIGHT + pad * 2 }}
        >
          {/** SVG: top-down ping pong table */}
          <svg
            viewBox={`0 0 ${TABLE_WIDTH} ${TABLE_HEIGHT}`}
            className={`absolute ${compact ? "left-2 top-2" : "left-8 top-8"}`}
            width={TABLE_WIDTH}
            height={TABLE_HEIGHT}
          >
            {showZones && (
              <>
                {/* Left side: 3 zones 1,2,3 top to bottom */}
                <rect x={0} y={0} width={halfW} height={thirdH} fill={ZONE_COLORS[0]} />
                <text x={halfW / 2 - 4} y={thirdH / 2 + 4} className="fill-zinc-500 text-[10px] font-medium">1</text>
                <rect x={0} y={thirdH} width={halfW} height={thirdH} fill={ZONE_COLORS[1]} />
                <text x={halfW / 2 - 4} y={thirdH + thirdH / 2 + 4} className="fill-zinc-500 text-[10px] font-medium">2</text>
                <rect x={0} y={thirdH * 2} width={halfW} height={thirdH} fill={ZONE_COLORS[2]} />
                <text x={halfW / 2 - 4} y={thirdH * 2 + thirdH / 2 + 4} className="fill-zinc-500 text-[10px] font-medium">3</text>
                {/* Right side: 3 zones 3,2,1 top to bottom */}
                <rect x={halfW} y={0} width={halfW} height={thirdH} fill={ZONE_COLORS[2]} />
                <text x={halfW + halfW / 2 - 4} y={thirdH / 2 + 4} className="fill-zinc-500 text-[10px] font-medium">3</text>
                <rect x={halfW} y={thirdH} width={halfW} height={thirdH} fill={ZONE_COLORS[1]} />
                <text x={halfW + halfW / 2 - 4} y={thirdH + thirdH / 2 + 4} className="fill-zinc-500 text-[10px] font-medium">2</text>
                <rect x={halfW} y={thirdH * 2} width={halfW} height={thirdH} fill={ZONE_COLORS[0]} />
                <text x={halfW + halfW / 2 - 4} y={thirdH * 2 + thirdH / 2 + 4} className="fill-zinc-500 text-[10px] font-medium">1</text>
              </>
            )}
            <rect
              x={0}
              y={0}
              width={TABLE_WIDTH}
              height={TABLE_HEIGHT}
              fill={showZones ? "transparent" : "#fef3c7"}
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
            className={`absolute ${compact ? "left-2 top-2" : "left-8 top-8"}`}
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
                left: pad + (hoveredShot.x / 100) * TABLE_WIDTH,
                top: Math.max(
                  pad + (hoveredShot.y / 100) * TABLE_HEIGHT - 56,
                  pad
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
      {!compact && (
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
      )}
    </div>
  );
}
