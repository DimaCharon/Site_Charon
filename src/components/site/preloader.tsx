"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { site } from "@/config/site";

/**
 * Прелоадер — вход в цифровое пространство.
 * Буквы имени поднимаются, линия прогресса заполняется,
 * затем шторка уходит вверх и открывает hero.
 */
export function Preloader({ onComplete }: { onComplete: () => void }) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (reduced) {
      const t = window.setTimeout(onComplete, 250);
      return () => window.clearTimeout(t);
    }
    document.documentElement.style.overflow = "hidden";
    const start = performance.now();
    const duration = 1500;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out: быстрый старт, мягкое замедление
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        window.setTimeout(onComplete, 420);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.style.overflow = "";
    };
  }, [onComplete, reduced]);

  React.useEffect(() => {
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  const letters = site.ownerName.split("");

  if (reduced) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background grain"
      exit={{ y: "-100%" }}
      transition={{ duration: 0.9, ease: [0.83, 0, 0.17, 1] }}
      aria-hidden="true"
    >
      <div className="relative overflow-hidden">
        <div className="flex">
          {letters.map((letter, i) => (
            <motion.span
              key={i}
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{
                delay: 0.15 + i * 0.07,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-display text-metal text-[clamp(2.6rem,9vw,6rem)] font-600 tracking-[0.08em]"
              style={{ fontWeight: 600 }}
            >
              {letter}
            </motion.span>
          ))}
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.6 }}
        className="mt-5 font-mono text-[11px] uppercase tracking-[0.32em] text-muted-foreground"
      >
        инициализация цифровой идентичности
      </motion.p>

      <div className="mt-8 h-px w-48 overflow-hidden bg-border md:w-64">
        <motion.div
          className="h-full bg-gradient-to-r from-silver to-lav"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="mt-3 font-mono text-[10px] tabular-nums text-muted-foreground/70">
        {String(progress).padStart(3, "0")}%
      </span>
    </motion.div>
  );
}
