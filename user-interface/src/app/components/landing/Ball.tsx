"use client";

/**
 * Ball will move across the screen and trigger phase transitions.
 */
export function Ball({ x }: { x: number }) {
  return (
    <div
      className="pointer-events-none absolute left-0 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-orange-200 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.1)]"
      style={{ left: `${x}%` }}
    />
  );
}
