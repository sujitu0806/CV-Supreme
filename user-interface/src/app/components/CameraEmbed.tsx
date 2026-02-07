"use client";

type EmbedMode = "comp" | "training";

interface CameraEmbedProps {
  mode?: EmbedMode;
  className?: string;
}

const DEFAULT_CV_APP_URL = "http://localhost:5173";

export function CameraEmbed({ mode = "comp", className = "" }: CameraEmbedProps) {
  const baseUrl = process.env.NEXT_PUBLIC_CV_APP_URL ?? DEFAULT_CV_APP_URL;
  const embedUrl = `${baseUrl.replace(/\/$/, "")}/embed.html?embed=1&mode=${mode}`;

  return (
    <div className={`overflow-hidden rounded-xl border-2 border-orange-200 bg-zinc-100 ${className}`}>
      <iframe
        src={embedUrl}
        title="CV Camera — Ball tracking, pose overlay, paddle analysis"
        allow="camera"
        className="flex aspect-video w-full min-h-[320px] border-0"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
