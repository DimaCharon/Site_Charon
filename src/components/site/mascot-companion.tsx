"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

/**
 * Мини-маскот Charon — присутствует в углу экрана,
 * мягко меняет состояние при переходе между секциями.
 * Сворачивается по клику и не перекрывает контент.
 */

const states: Record<string, { text: string; mood: "hi" | "scan" | "show" | "idea" }> = {
  home: { text: "Привет — я Charon", mood: "hi" },
  about: { text: "Читаю профиль…", mood: "scan" },
  projects: { text: "Показываю проекты", mood: "show" },
  world: { text: "Это моя система", mood: "scan" },
  interests: { text: "Тут мои увлечения", mood: "idea" },
  contacts: { text: "Идеи — сюда", mood: "hi" },
};

/** Лицо маскота: графитовая голова, визор, глаза, звезда */
function MascotFace({ size = 34 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Голова */}
      <rect x="3" y="5" width="34" height="32" rx="11" className="fill-[#33363d] stroke-silver/50" strokeWidth="1" />
      {/* Визор */}
      <rect x="8" y="12" width="24" height="13" rx="6.5" className="fill-[#0b0c10]" />
      {/* Глаза */}
      <g className="anim-blink" style={{ transformOrigin: "center" }}>
        <rect x="13.5" y="16.5" width="3.4" height="4.6" rx="1.7" className="fill-lav" />
        <rect x="23.1" y="16.5" width="3.4" height="4.6" rx="1.7" className="fill-lav" />
      </g>
      {/* Звезда-ядро */}
      <path
        d="M20 27.5 L21 30 L23.5 31 L21 32 L20 34.5 L19 32 L16.5 31 L19 30 Z"
        className="fill-lav anim-core"
      />
      {/* Антенна */}
      <path d="M20 5 V2.5" className="stroke-silver/60" strokeWidth="1" strokeLinecap="round" />
      <circle cx="20" cy="2" r="1.3" className="fill-blu" />
    </svg>
  );
}

export function MascotCompanion({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const [section, setSection] = React.useState("home");
  const [manual, setManual] = React.useState<"expanded" | "collapsed" | null>(null);
  const [atBottom, setAtBottom] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  // На узких экранах маскот стартует свёрнутым — не перекрывает контент
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // У подвала сайта маскот сворачивается сам — не перекрывает футер
  React.useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setAtBottom(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const collapsed = manual !== null ? manual === "collapsed" : atBottom || isMobile;

  const toggle = React.useCallback(() => {
    setManual(collapsed ? "expanded" : "collapsed");
  }, [collapsed]);

  React.useEffect(() => {
    const ids = Object.keys(states);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setSection(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const state = states[section] ?? states.home;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-5 right-5 z-[70] md:bottom-7 md:right-7"
        >
          {collapsed ? (
            <button
              onClick={toggle}
              className="glass-panel group grid h-12 w-12 place-items-center rounded-full transition-transform duration-300 hover:scale-105"
              aria-label="Развернуть маскота"
              data-cursor-label="Charon"
            >
              <MascotFace size={30} />
            </button>
          ) : (
            <div className="glass-panel edge-highlight flex items-center gap-3 rounded-2xl py-2.5 pl-3 pr-2.5">
              <button
                onClick={toggle}
                className="relative shrink-0 transition-transform duration-300 hover:scale-105 active:scale-95"
                aria-label="Свернуть маскота"
              >
                <MascotFace />
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-lav" />
              </button>

              <div className="min-w-[132px] overflow-hidden">
                <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-muted-foreground/70">
                  charon · online
                </p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={state.text}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-[12px] font-medium text-foreground/90"
                  >
                    {state.text}
                  </motion.p>
                </AnimatePresence>
              </div>

              <button
                onClick={toggle}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground/60 transition-colors hover:text-foreground"
                aria-label="Свернуть"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
