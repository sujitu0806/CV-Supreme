"use client";

/**
 * Mosaic images m1–m10. Displayed only after buttons appear (phase === "logo").
 * Float around in safe zones: below header (56px), outside center (aerial view / logo).
 */
/* Positions in corners/edges: below header (pt-14), avoid center (aerial table + logo) */
const MOSAIC_IMAGES = [
  { id: 1, src: "/m1.jpeg", x: "8%", y: "14%", animate: "mosaic-float-1", duration: 5, delay: 0 },
  { id: 2, src: "/m2.jpeg", x: "78%", y: "14%", animate: "mosaic-float-2", duration: 6, delay: -1 },
  { id: 3, src: "/m3.jpeg", x: "6%", y: "72%", animate: "mosaic-float-3", duration: 7, delay: -2 },
  { id: 4, src: "/m4.jpeg", x: "82%", y: "78%", animate: "mosaic-float-4", duration: 5.5, delay: -0.5 },
  { id: 5, src: "/m5.jpg", x: "18%", y: "20%", animate: "mosaic-float-5", duration: 6.5, delay: -1.5 },
  { id: 6, src: "/m6.jpg", x: "86%", y: "28%", animate: "mosaic-float-1", duration: 6, delay: -3 },
  { id: 7, src: "/m7.jpg", x: "12%", y: "72%", animate: "mosaic-float-2", duration: 5, delay: -2.5 },
  { id: 8, src: "/m8.jpg", x: "72%", y: "22%", animate: "mosaic-float-3", duration: 7, delay: 0 },
  { id: 9, src: "/m9.webp", x: "22%", y: "85%", animate: "mosaic-float-4", duration: 5.5, delay: -1 },
  { id: 10, src: "/m10.jpg", x: "88%", y: "82%", animate: "mosaic-float-5", duration: 6, delay: -2 },
];

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
      {/* Base grid - below header, outside center */}
      <div
        className="absolute left-0 right-0 top-14 bottom-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(249, 115, 22, 0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249, 115, 22, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />
      {/* m1–m10 images: safe zone below header (pt-14), avoid center (aerial/logo) */}
      <div className="absolute inset-0 pt-14">
        {MOSAIC_IMAGES.map((tile, i) => (
          <div
            key={tile.id}
            className="absolute w-20 h-20 rounded-lg overflow-hidden border border-orange-200/50 shadow-md md:w-24 md:h-24"
            style={{
              left: tile.x,
              top: tile.y,
              animation: `${tile.animate} ${tile.duration}s ease-in-out infinite`,
              animationDelay: `${tile.delay}s`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tile.src}
              alt={`m${tile.id}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
