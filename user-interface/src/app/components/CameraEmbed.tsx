"use client";

import { CVCamera } from "./CVCamera";

type EmbedMode = "comp" | "training";

interface CameraEmbedProps {
  mode?: EmbedMode;
  className?: string;
}

export function CameraEmbed({ mode = "comp", className = "" }: CameraEmbedProps) {
  return (
    <div className={className}>
      <CVCamera />
    </div>
  );
}
