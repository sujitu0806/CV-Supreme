"use client";

import { useState, useEffect, useRef } from "react";
import { BackgroundVideo } from "./BackgroundVideo";
import { MosaicBackground } from "./MosaicBackground";
import { Ball } from "./Ball";
import { BallToLogoTransition } from "@/app/components/landing/BallToLogoTransition";

type Phase = "video" | "mosaic" | "logo";

/** Ball speed as % of viewport width per frame (~60fps) */
const BALL_SPEED = 0.6;

/**
 * Landing hero: ball animates L↔R, advances phase on center crossing.
 */
/** Small ball is h-8 w-8 (32px), center offset = 16px */
const BALL_CENTER_OFFSET = 16;

/** Video before/after ball hits right edge. For now both use temp vid. */
const VIDEO_BEFORE_RIGHT_EDGE = "/temp vid.mp4";
const VIDEO_AFTER_RIGHT_EDGE = "/temp vid.mp4";

export function LandingHero() {
  const [phase, setPhase] = useState<Phase>("video");
  const [ballPosition, setBallPosition] = useState(0);
  const [lastBallPosition, setLastBallPosition] = useState(50);
  const [hasHitRightEdge, setHasHitRightEdge] = useState(false);

  const positionRef = useRef(0);
  const directionRef = useRef(1);
  const prevPositionRef = useRef(0);
  const crossingCountRef = useRef(0);
  const phaseRef = useRef(phase);
  const rafRef = useRef<number | null>(null);

  phaseRef.current = phase;

  useEffect(() => {
    if (phase === "logo") return;

    const animate = () => {
      const pos = positionRef.current;
      const dir = directionRef.current;
      const newPos = pos + dir * BALL_SPEED;

      if (newPos >= 100) {
        directionRef.current = -1;
        positionRef.current = 100;
        setHasHitRightEdge(true);
      } else if (newPos <= 0) {
        directionRef.current = 1;
        positionRef.current = 0;
      } else {
        positionRef.current = newPos;
      }

      const currentPos = positionRef.current;

      /* Center crossing: advance phase video → mosaic → logo */
      const crossedCenter =
        (prevPositionRef.current < 50 && currentPos >= 50) ||
        (prevPositionRef.current > 50 && currentPos <= 50);

      if (crossedCenter) {
        crossingCountRef.current += 1;
        if (crossingCountRef.current === 1) setPhase("mosaic");
        else if (crossingCountRef.current === 2) {
          setLastBallPosition(currentPos);
          setPhase("logo");
        }
      }

      prevPositionRef.current = currentPos;
      setBallPosition(currentPos);

      if (phaseRef.current !== "logo") {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase]);

  return (
    <section
      className="relative -mt-14 h-screen w-full overflow-hidden bg-zinc-100"
      aria-label="Landing hero"
    >
      <BackgroundVideo
        isVisible={phase === "video" || phase === "mosaic" || phase === "logo"}
        opacity={hasHitRightEdge ? 0.6 : 0.9}
        src={hasHitRightEdge ? VIDEO_AFTER_RIGHT_EDGE : VIDEO_BEFORE_RIGHT_EDGE}
        videoKey={hasHitRightEdge ? "after" : "before"}
      />

      <MosaicBackground
        isVisible={phase === "mosaic" || phase === "logo"}
        opacity={phase === "mosaic" ? 1 : 0.6}
      />

      {phase !== "logo" && (
        <div className="absolute inset-0 z-20">
          <Ball x={ballPosition} />
        </div>
      )}

      <BallToLogoTransition
        isActive={phase === "logo"}
        lastBallX={lastBallPosition}
        ballCenterOffset={BALL_CENTER_OFFSET}
      />
    </section>
  );
}
