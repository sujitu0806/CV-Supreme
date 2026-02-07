"use client";

/**
 * Mosaic phase placeholder.
 * Colorful tiles background with coordinate/data viz feel.
 */
const TILES = [
  { id: 1, x: "10%", y: "15%", color: "amber" },
  { id: 2, x: "75%", y: "8%", color: "teal" },
  { id: 3, x: "5%", y: "55%", color: "emerald" },
  { id: 4, x: "65%", y: "80%", color: "amber" },
  { id: 5, x: "35%", y: "5%", color: "teal" },
  { id: 6, x: "90%", y: "45%", color: "emerald" },
  { id: 7, x: "25%", y: "70%", color: "amber" },
  { id: 8, x: "50%", y: "35%", color: "teal" },
  { id: 9, x: "80%", y: "60%", color: "emerald" },
];

const colorClasses: Record<string, string> = {
  amber: "border-orange-400/40 bg-orange-100/80",
  teal: "border-teal-400/40 bg-teal-100/80",
  emerald: "border-emerald-400/40 bg-emerald-100/80",
};

export function MosaicBackground({
  isVisible,
  opacity,
}: {
  isVisible: boolean;
  opacity: number;
}) {
  return (
    <div
      className="absolute inset-0 z-0 transition-opacity duration-1000 ease-out"
      style={{ opacity: isVisible ? opacity : 0 }}
    >
      {/* Base grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(249, 115, 22, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249, 115, 22, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Tiles */}
      <div className="absolute inset-0">
        {TILES.map((tile, i) => (
          <div
            key={tile.id}
            className={`absolute rounded-lg border px-3 py-2 font-mono text-xs backdrop-blur-sm transition-all duration-500 ${colorClasses[tile.color]}`}
            style={{
              left: tile.x,
              top: tile.y,
              transitionDelay: `${i * 80}ms`,
            }}
          >
            <span className="text-orange-600/90">{tile.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
