"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ArrowDown, ArrowUpRight, Sparkles, Box, LineChart } from "lucide-react";
import { site } from "@/config/site";
import { Magnetic } from "./magnetic";
import { CharonAvatar } from "./charon-3d";

const markers = [
  { icon: Sparkles, label: site.hero.markers[0] },
  { icon: Box, label: site.hero.markers[1] },
  { icon: LineChart, label: site.hero.markers[2] },
];

export function Hero({ active }: { active: boolean }) {
  const ref = React.useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [inView, setInView] = React.useState(true);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "10% 0px 10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yWatermark = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const yContent = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const fadeContent = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const shown = active || reduced;

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: 34 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      id="home"
      ref={ref}
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
      aria-label="Главный экран"
    >
      {/* Мягкий источник света — верхний правый угол */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full opacity-[0.13] blur-3xl dark:opacity-[0.16]"
        style={{
          background:
            "radial-gradient(circle, var(--lav) 0%, transparent 62%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-52 bottom-0 h-[480px] w-[480px] rounded-full opacity-[0.08] blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--blu) 0%, transparent 62%)",
        }}
      />

      {/* Гигантское имя-водяной знак */}
      <motion.div
        aria-hidden="true"
        style={reduced ? undefined : { y: yWatermark }}
        className="pointer-events-none absolute inset-x-0 bottom-[-3vw] z-0 select-none text-center"
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.96 }}
          animate={shown ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.5, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-outline font-display text-[21vw] font-bold leading-[0.82] tracking-[0.04em]"
        >
          {site.ownerName}
        </motion.span>
      </motion.div>

      {/* Основная композиция */}
      <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-6 px-4 pb-20 pt-24 md:px-6 md:pt-28 lg:grid-cols-12 lg:gap-0 lg:pb-24">
        <motion.div
          variants={container}
          initial="hidden"
          animate={shown ? "show" : "hidden"}
          style={reduced ? undefined : { y: yContent, opacity: fadeContent }}
          className="lg:col-span-6"
        >
          {/* Статус-строка */}
          <motion.div variants={item} className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lav opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lav" />
            </span>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              {site.hero.eyebrow}
            </p>
          </motion.div>

          {/* Заголовок */}
          <h1 className="mt-7 font-display text-[clamp(2.1rem,5.4vw,4.15rem)] font-semibold leading-[1.06] tracking-tight">
            <motion.span variants={item} className="block">
              {site.hero.titleLine1}
            </motion.span>
            <motion.span variants={item} className="block text-lav">
              {site.hero.titleLine2}
              <span className="text-foreground">.</span>
            </motion.span>
          </h1>

          {/* Подзаголовок */}
          <motion.p
            variants={item}
            className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground md:text-base"
          >
            {site.hero.subtitle}
          </motion.p>

          {/* CTA */}
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-4">
            <Magnetic strength={0.3}>
              <button
                onClick={() =>
                  document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })
                }
                className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
                data-cursor-label="Вперёд"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">Смотреть проекты</span>
                <ArrowDown className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
              </button>
            </Magnetic>

            <Magnetic strength={0.3}>
              <button
                onClick={() =>
                  document.getElementById("contacts")?.scrollIntoView({ behavior: "smooth" })
                }
                className="group inline-flex items-center gap-2 rounded-full border border-line px-7 py-3.5 text-sm font-semibold text-foreground/90 transition-all duration-300 hover:border-lav/50 hover:bg-lav/5"
              >
                Связаться
                <ArrowUpRight className="h-4 w-4 text-lav transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </Magnetic>
          </motion.div>
        </motion.div>

        {/* 3D-маскот */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={shown ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.4, duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[38svh] min-h-[280px] w-full lg:col-span-6 lg:-ml-20 lg:h-[68vh] lg:min-h-[460px]"
        >
          <CharonAvatar className="h-full w-full" inView={inView} />
        </motion.div>
      </div>

      {/* Нижняя спецификация */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={shown ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.85, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto w-full max-w-6xl px-4 md:px-6"
      >
        <div className="flex items-center justify-between gap-6 border-t border-line py-5">
          <div className="hidden items-center gap-2.5 sm:flex">
            <ArrowDown className="h-3.5 w-3.5 animate-bounce text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              скролл
            </span>
          </div>
          <ul className="flex flex-wrap items-center gap-x-8 gap-y-2" aria-label="Направления">
            {markers.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <Icon className="h-3.5 w-3.5 text-lav" strokeWidth={1.75} />
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  {label}
                </span>
              </li>
            ))}
          </ul>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60 sm:block">
            {site.ownerNameSub}
          </span>
        </div>
      </motion.div>
    </section>
  );
}
