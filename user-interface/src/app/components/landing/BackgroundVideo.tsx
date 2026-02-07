"use client";

/**
 * Background video. Switches src when ball hits right edge.
 * Props: isVisible, opacity, src, videoKey (forces restart when both use same file)
 */
export function BackgroundVideo({
  isVisible,
  opacity,
  src,
  videoKey,
}: {
  isVisible: boolean;
  opacity: number;
  src: string;
  videoKey: string;
}) {
  return (
    <div
      className="absolute inset-0 z-0 h-full w-full transition-opacity duration-1000 ease-out"
      style={{ opacity: isVisible ? opacity : 0 }}
    >
      <video
        key={videoKey}
        src={src}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="absolute bottom-[15%] left-1/2 h-[2px] w-[40%] -translate-x-1/2 rounded-full bg-zinc-400/50" />
    </div>
  );
}
