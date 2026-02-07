"use client";

import Link from "next/link";

/**
 * Mosaic → Logo transition: ball spins about vertical axis, logo pasted on revealed side.
 */
const OFFSET_RIGHT = 65;
const OFFSET_DOWN = 80;
const TEXT_OFFSET_X = -60;
const TEXT_OFFSET_Y = 30;
const BUTTON_OFFSET_X = -60;
const BUTTON_OFFSET_Y = 0;

export function BallToLogoTransition({
  isActive,
  lastBallX,
  ballCenterOffset,
}: {
  isActive: boolean;
  lastBallX: number;
  ballCenterOffset: number;
}) {
  if (!isActive) return null;

  const centerX = `calc(${lastBallX}% + ${ballCenterOffset + OFFSET_RIGHT}px)`;
  const centerY = `calc(50% + ${OFFSET_DOWN}px)`;
  const textTop = `calc(50% + ${OFFSET_DOWN + 60 + TEXT_OFFSET_Y}px)`;
  const textLeft = `calc(${lastBallX}% + ${ballCenterOffset + OFFSET_RIGHT + TEXT_OFFSET_X}px)`;
  const buttonTop = `calc(50% + ${OFFSET_DOWN + 60 + TEXT_OFFSET_Y + 48 + BUTTON_OFFSET_Y}px)`;
  const buttonLeft = `calc(${lastBallX}% + ${ballCenterOffset + OFFSET_RIGHT + BUTTON_OFFSET_X}px)`;

  return (
    <div className="absolute inset-0 z-[25] overflow-y-auto [perspective:1200px]">
      {/* Ball */}
      <div
        className="pointer-events-none absolute h-[156px] w-[156px] -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]"
        style={{ left: centerX, top: centerY }}
      >
        <div
          className="ball-logo absolute inset-0 animate-ball-morph overflow-hidden rounded-full [backface-visibility:visible]"
          style={{ transformOrigin: "center center" }}
        >
          <div
            className="absolute left-1/2 top-1/2 flex items-center justify-center animate-logo-on-ball [backface-visibility:hidden] [transform-style:preserve-3d]"
            style={{ transform: "translate(-50%, -50%) translateZ(72px) scale(0.92)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png.png"
              alt="CV Supreme"
              width={130}
              height={130}
              className="object-contain drop-shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Tagline with offset */}
      <div
        className="absolute flex w-full max-w-sm -translate-x-1/2 flex-col items-center"
        style={{ left: textLeft, top: textTop }}
      >
        <p className="shrink-0 text-center text-lg font-bold tracking-tight text-orange-600 md:text-xl animate-logo-content">
          See the game. Change the game.
        </p>
      </div>

      {/* Buttons with offset */}
      <div
        className="absolute flex -translate-x-1/2 flex-wrap justify-center gap-4 animate-logo-content"
        style={{ left: buttonLeft, top: buttonTop }}
      >
        <Link
          href="/training"
          className="pointer-events-auto rounded-full border border-zinc-300 bg-zinc-100 px-8 py-3 font-medium text-zinc-700 transition-colors hover:border-orange-400 hover:bg-orange-100 hover:text-orange-700"
        >
          Training Mode
        </Link>
        <Link
          href="/competition"
          className="pointer-events-auto rounded-full border border-zinc-300 bg-zinc-100 px-8 py-3 font-medium text-zinc-700 transition-colors hover:border-orange-400 hover:bg-orange-100 hover:text-orange-700"
        >
          Competition Mode
        </Link>
      </div>
    </div>
  );
}
