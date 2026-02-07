"use client";

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  animate,
} from "framer-motion";
import { useEffect, useRef, useCallback } from "react";

/**
 * Ping pong ball that moves horizontally back and forth.
 * Uses a motion value (x: 0-100, percentage of viewport width) to track position.
 *
 * TRANSITION LOGIC:
 * - Ball animates left→right (0→100), then right→left (100→0), repeated.
 * - useMotionValueEvent watches x; when it crosses 50 (center):
 *   - 1st crossing (left→right): onFirstCrossing() fires → mosaic bg appears
 *   - 2nd crossing (right→left): onSecondCrossing() fires → logo reveal
 * - When phase becomes "logo", animation stops and ball morphs into logo.
 */
const BALL_DURATION = 2.5; // seconds per half (left→right or right→left)

export function PingPongBall({
  phase,
  onFirstCrossing,
  onSecondCrossing,
}: {
  phase: "video" | "mosaic" | "logo";
  onFirstCrossing: () => void;
  onSecondCrossing: () => void;
}) {
  const x = useMotionValue(0);
  const prevX = useRef(0);
  const crossingCount = useRef(0);

  const checkCrossing = useCallback(
    (latest: number) => {
      const crossedCenter =
        (prevX.current < 50 && latest >= 50) || (prevX.current > 50 && latest <= 50);

      if (crossedCenter) {
        crossingCount.current += 1;
        if (crossingCount.current === 1) {
          onFirstCrossing();
        } else if (crossingCount.current === 2) {
          onSecondCrossing();
        }
      }
      prevX.current = latest;
    },
    [onFirstCrossing, onSecondCrossing]
  );

  useMotionValueEvent(x, "change", checkCrossing);

  // useTransform must be called unconditionally (Rules of Hooks)
  const leftPercent = useTransform(x, (v) => `${v}%`);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    if (phase === "logo") return;

    let canceled = false;
    const isLogo = () => phaseRef.current === "logo";

    const runCycle = async () => {
      while (!canceled && !isLogo()) {
        await animate(x, 100, {
          duration: BALL_DURATION,
          ease: "linear",
        });
        if (canceled || isLogo()) return;

        await animate(x, 0, {
          duration: BALL_DURATION,
          ease: "linear",
        });
      }
    };

    runCycle();
    return () => {
      canceled = true;
    };
  }, [phase, x]);

  if (phase === "logo") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <motion.div
        className="absolute left-0 top-1/2 h-8 w-8 -translate-y-1/2"
        style={{ left: leftPercent }}
      >
        <div className="h-8 w-8 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
      </motion.div>
    </div>
  );
}