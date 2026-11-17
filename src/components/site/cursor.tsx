"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

const STORAGE_KEY = "charon:cursor";

/**
 * Кастомный курсор: точка + инерционное кольцо.
 * Расширяется над интерактивными элементами, умеет показывать подпись
 * (data-cursor-label="…"). Отключается кнопкой в навигации,
 * не работает на тач-устройствах и при prefers-reduced-motion.
 */
export function CustomCursor() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [hovering, setHovering] = React.useState(false);
  const [label, setLabel] = React.useState<string | null>(null);
  const [fine, setFine] = React.useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 320, damping: 28, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 320, damping: 28, mass: 0.6 });

  // Определяем устройство ввода и сохранённую настройку
  React.useEffect(() => {
    const isFine = window.matchMedia("(pointer: fine)").matches;
    setFine(isFine);
    if (!isFine || reduced) return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initial = saved === null ? true : saved === "on";
    setEnabled(initial);
  }, [reduced]);

  // Синхронизируем класс на <html>
  React.useEffect(() => {
    document.documentElement.classList.toggle("has-cursor", enabled);
  }, [enabled]);

  // Единый источник истины: состояние и хранилище меняет только этот компонент
  React.useEffect(() => {
    const onToggle = () => {
      setEnabled((prev) => {
        const next = !prev;
        window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
        window.dispatchEvent(new CustomEvent("charon:cursor-changed", { detail: next }));
        return next;
      });
    };
    window.addEventListener("charon:cursor-toggle", onToggle);
    return () => {
      window.removeEventListener("charon:cursor-toggle", onToggle);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  React.useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      if (!visible) setVisible(true);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest(
        "a, button, [role='button'], input, textarea, [data-cursor]"
      ) as HTMLElement | null;
      setHovering(Boolean(interactive));
      const lbl = interactive?.dataset?.cursorLabel ?? null;
      setLabel(lbl);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [enabled, visible, x, y]);

  if (!enabled || !fine || reduced) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[95]">
      {/* Точка — мгновенная */}
      <motion.div
        style={{ x, y, opacity: visible ? 1 : 0 }}
        className="absolute left-0 top-0"
      >
        <div
          className={`-translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground transition-all duration-300 ${
            label ? "h-0 w-0" : hovering ? "h-1 w-1" : "h-1.5 w-1.5"
          }`}
        />
      </motion.div>

      {/* Кольцо — с пружиной */}
      <motion.div
        style={{ x: ringX, y: ringY, opacity: visible ? 1 : 0 }}
        className="absolute left-0 top-0"
      >
        {label ? (
          <motion.div
            initial={false}
            className="-translate-x-1/2 -translate-y-1/2 rounded-full bg-lav px-4 py-2"
          >
            <span className="whitespace-nowrap font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-background">
              {label}
            </span>
          </motion.div>
        ) : (
          <div
            className={`-translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground/50 transition-all duration-300 ease-out ${
              hovering ? "h-12 w-12 bg-lav/10 backdrop-blur-[2px]" : "h-8 w-8"
            }`}
          />
        )}
      </motion.div>
    </div>
  );
}
