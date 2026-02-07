"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/**
 * CV Supreme logo: C from sideways paddle blade, V above handle.
 * Appears after ball transforms (ball spins and morphs into logo).
 * Tagline and CTA buttons follow with staggered animation.
 */
export function CVLogo({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center"
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo: C (paddle curve) + V (above handle) */}
      <motion.div
        className="relative"
        initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
        animate={{
          scale: 1,
          opacity: 1,
          rotate: 0,
          transition: {
            type: "spring",
            stiffness: 120,
            damping: 18,
            duration: 1,
          },
        }}
      >
        <svg
          viewBox="0 0 100 70"
          className="h-24 w-36 text-amber-400 md:h-32 md:w-48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* C: Paddle blade curve (sideways, facing left) - forms the letter C */}
          <motion.path
            d="M 25 15 C 6 15 6 55 25 55"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          {/* Handle: vertical line */}
          <motion.line
            x1="25"
            y1="35"
            x2="25"
            y2="65"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          />
          {/* V: above handle - two strokes forming V */}
          <motion.path
            d="M 14 10 L 25 32 L 36 10"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          />
        </svg>
      </motion.div>

      {/* "Supreme" wordmark */}
      <motion.span
        className="mt-2 font-bold tracking-[0.2em] text-amber-400/90"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        SUPREME
      </motion.span>

      {/* Tagline */}
      <motion.p
        className="mt-6 text-center text-lg text-zinc-400 md:text-xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        See the game. Change the game.
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        className="mt-10 flex flex-wrap justify-center gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <Link
          href="/training"
          className="rounded-full border border-amber-500/50 bg-amber-500/20 px-8 py-3 font-medium text-amber-400 transition-all hover:bg-amber-500/30 hover:border-amber-500/70"
        >
          Training Mode
        </Link>
        <Link
          href="/competition"
          className="rounded-full border border-zinc-600 bg-zinc-800/60 px-8 py-3 font-medium text-zinc-200 transition-all hover:bg-zinc-700/60 hover:border-zinc-500"
        >
          Competition Mode
        </Link>
      </motion.div>
    </motion.div>
  );
}
