"use client";

import dynamic from "next/dynamic";
import type { Shot3D } from "../../data/mock";
import { shots3D } from "../../data/mock";

const Scene = dynamic(
  () => import("./LandingAerialScene").then((mod) => mod.LandingAerialScene),
  { ssr: false }
);

interface LandingAerialViewProps {
  shots?: Shot3D[];
}

export function LandingAerialView({ shots = shots3D }: LandingAerialViewProps) {
  return (
    <div className="absolute inset-0 z-10 overflow-hidden rounded-none animate-aerial-fade-in">
      <Scene shots={shots} />
    </div>
  );
}
