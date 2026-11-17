"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Направление появления */
  from?: "up" | "down" | "left" | "right" | "scale" | "none";
  /** Обратная маска: элемент «проявляется» движением шторки */
  once?: boolean;
  as?: "div" | "section" | "span" | "li" | "figure";
}

const offsets: Record<NonNullable<RevealProps["from"]>, { x?: number; y?: number; scale?: number }> = {
  up: { y: 34 },
  down: { y: -34 },
  left: { x: -44 },
  right: { x: 44 },
  scale: { scale: 0.94, y: 12 },
  none: {},
};

/**
 * Scroll-reveal обёртка: плавное появление при входе в вьюпорт.
 * Уважает prefers-reduced-motion — контент просто виден.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  from = "up",
  once = true,
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const offset = offsets[from];
  const Comp = motion[as] as typeof motion.div;

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}

/** Пословное появление заголовков */
export function RevealWords({
  text,
  className,
  wordClassName,
  delay = 0,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  if (reduced) return <span className={className}>{text}</span>;

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.055, delayChildren: delay } },
  };
  const word: Variants = {
    hidden: { opacity: 0, y: "0.6em", filter: "blur(6px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px" }}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span className={`inline-block ${wordClassName ?? ""}`} variants={word}>
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
