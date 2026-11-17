"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { site, projects, type Project, type ProjectStatus } from "@/config/site";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { CharonMark } from "./navbar";

/* ═══════════════ Визуалы проектов — генеративный SVG ═══════════════ */

function ProjectVisual({ variant, className }: { variant: Project["visual"]; className?: string }) {
  const common = "h-full w-full";
  switch (variant) {
    case "charon":
      return (
        <svg viewBox="0 0 400 300" className={common} fill="none" aria-hidden="true">
          <circle cx="200" cy="150" r="64" className="fill-lav/8 stroke-lav/40" strokeWidth="1" />
          <g className="anim-spin-slow" style={{ transformOrigin: "200px 150px" }}>
            <ellipse cx="200" cy="150" rx="108" ry="44" className="stroke-silver/35" strokeWidth="1" transform="rotate(-16 200 150)" />
            <circle cx="296" cy="123" r="3" className="fill-lav" />
          </g>
          <g className="anim-spin-rev" style={{ transformOrigin: "200px 150px" }}>
            <ellipse cx="200" cy="150" rx="128" ry="58" className="stroke-silver/25" strokeWidth="1" transform="rotate(22 200 150)" />
            <circle cx="88" cy="188" r="2.4" className="fill-blu" />
          </g>
          <path
            d="M200 96 L211 139 L254 150 L211 161 L200 204 L189 161 L146 150 L189 139 Z"
            className="fill-lav/80"
          />
          <circle cx="200" cy="150" r="5" className="fill-background" />
          {[[62, 62], [330, 74], [70, 236], [322, 232], [120, 40], [286, 260]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" className="fill-silver/50 anim-core" style={{ animationDelay: `${i * 0.45}s` }} />
          ))}
        </svg>
      );
    case "trading":
      return (
        <svg viewBox="0 0 400 300" className={common} fill="none" aria-hidden="true">
          <g className="stroke-border" strokeWidth="1">
            <path d="M20 40 H380 M20 100 H380 M20 160 H380 M20 220 H380" />
            <path d="M80 20 V280 M160 20 V280 M240 20 V280 M320 20 V280" opacity="0.5" />
          </g>
          {[
            [60, 190, 70], [95, 150, 175], [130, 210, 60], [165, 120, 200],
            [200, 160, 150], [235, 90, 230], [270, 140, 170], [305, 70, 210], [340, 110, 160],
          ].map(([x, top, bottom], i) => (
            <g key={i}>
              <rect x={x - 7} y={top as number} width="14" height={(bottom as number) - (top as number)} rx="2"
                className={i % 3 === 1 ? "fill-lav/70" : "fill-silver/40"} />
              <path d={`M${x} ${top} V${(top as number) - 14}`} className="stroke-silver/50" strokeWidth="1.5" />
              <path d={`M${x} ${bottom} V${(bottom as number) + 14}`} className="stroke-silver/50" strokeWidth="1.5" />
            </g>
          ))}
          <path
            d="M60 170 L95 130 L130 185 L165 100 L200 140 L235 70 L270 120 L305 60 L340 95"
            className="stroke-blu" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="560" opacity="0.9"
          />
          <circle cx="340" cy="95" r="3.5" className="fill-blu anim-core" />
        </svg>
      );
    case "agents":
      return (
        <svg viewBox="0 0 400 300" className={common} fill="none" aria-hidden="true">
          <g className="stroke-silver/30" strokeWidth="1">
            <path d="M200 70 L110 140 M200 70 L290 140 M110 140 L90 230 M110 140 L200 210 M290 140 L310 230 M290 140 L200 210 M200 210 L90 230 M200 210 L310 230 M110 140 L290 140" />
          </g>
          <path d="M200 70 L110 140 L200 210 L290 140 Z" className="stroke-lav/35" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="200" cy="70" r="14" className="fill-card stroke-lav" strokeWidth="1.5" />
          <circle cx="200" cy="70" r="5" className="fill-lav anim-core" />
          <circle cx="110" cy="140" r="11" className="fill-card stroke-silver/60" strokeWidth="1.5" />
          <circle cx="290" cy="140" r="11" className="fill-card stroke-silver/60" strokeWidth="1.5" />
          <circle cx="200" cy="210" r="12" className="fill-card stroke-blu/70" strokeWidth="1.5" />
          <circle cx="90" cy="230" r="8" className="fill-card stroke-silver/40" strokeWidth="1.5" />
          <circle cx="310" cy="230" r="8" className="fill-card stroke-silver/40" strokeWidth="1.5" />
          {[[60, 70], [340, 80], [50, 190], [350, 200]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" className="fill-lav/60 anim-core" style={{ animationDelay: `${i * 0.6}s` }} />
          ))}
        </svg>
      );
    case "experiments":
      return (
        <svg viewBox="0 0 400 300" className={common} fill="none" aria-hidden="true">
          <circle cx="200" cy="150" r="120" className="stroke-border" strokeWidth="1" strokeDasharray="3 7" />
          <circle cx="200" cy="150" r="80" className="stroke-border" strokeWidth="1" strokeDasharray="3 7" />
          <circle cx="200" cy="150" r="40" className="stroke-lav/30" strokeWidth="1" />
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            const r = 40 + (i % 3) * 40;
            return (
              <circle
                key={i}
                cx={200 + Math.cos(a) * r}
                cy={150 + Math.sin(a) * r}
                r={i % 4 === 0 ? 5 : 3}
                className={i % 4 === 0 ? "fill-lav/70" : "fill-silver/50"}
              />
            );
          })}
          <path d="M200 30 L208 142 L212 158 L220 270" className="stroke-lav/50" strokeWidth="1" strokeDasharray="2 5" />
          <circle cx="200" cy="150" r="6" className="fill-lav anim-core" />
        </svg>
      );
    case "automation":
      return (
        <svg viewBox="0 0 400 300" className={common} fill="none" aria-hidden="true">
          <rect x="40" y="126" width="72" height="48" rx="10" className="stroke-silver/50" strokeWidth="1.5" />
          <rect x="164" y="126" width="72" height="48" rx="24" className="stroke-lav/60" strokeWidth="1.5" />
          <rect x="288" y="126" width="72" height="48" rx="10" className="stroke-silver/50" strokeWidth="1.5" />
          <path d="M112 150 H164" className="stroke-lav/60" strokeWidth="1.5" strokeDasharray="5 6" />
          <path d="M236 150 H288" className="stroke-lav/60" strokeWidth="1.5" strokeDasharray="5 6" />
          <circle cx="112" cy="150" r="3" className="fill-lav anim-core" />
          <circle cx="236" cy="150" r="3" className="fill-lav anim-core" style={{ animationDelay: "-0.8s" }} />
          <path d="M200 126 V70 H330" className="stroke-silver/35" strokeWidth="1" strokeDasharray="3 6" />
          <circle cx="330" cy="70" r="5" className="stroke-blu/70" strokeWidth="1.5" />
          <path d="M200 174 V236 H70" className="stroke-silver/35" strokeWidth="1" strokeDasharray="3 6" />
          <circle cx="70" cy="236" r="5" className="stroke-blu/70" strokeWidth="1.5" />
          <g className="anim-spin-slow" style={{ transformOrigin: "200px 150px", animationDuration: "12s" }}>
            <circle cx="200" cy="150" r="14" className="stroke-lav/70" strokeWidth="1.5" strokeDasharray="10 44 44 10" />
          </g>
        </svg>
      );
    case "web":
      return (
        <svg viewBox="0 0 400 300" className={common} fill="none" aria-hidden="true">
          <rect x="60" y="40" width="280" height="220" rx="10" className="stroke-silver/50" strokeWidth="1.5" fill="transparent" />
          <path d="M60 72 H340" className="stroke-silver/40" strokeWidth="1" />
          <circle cx="78" cy="56" r="3.5" className="fill-silver/40" />
          <circle cx="92" cy="56" r="3.5" className="fill-silver/40" />
          <rect x="76" y="88" width="150" height="12" rx="3" className="fill-lav/50" />
          <rect x="76" y="112" width="100" height="8" rx="2" className="fill-silver/30" />
          <rect x="76" y="136" width="120" height="60" rx="6" className="stroke-lav/40" strokeWidth="1" />
          <rect x="212" y="136" width="104" height="60" rx="6" className="stroke-silver/40" strokeWidth="1" />
          <rect x="76" y="212" width="240" height="30" rx="6" className="fill-silver/15" />
          <rect x="88" y="221" width="70" height="12" rx="3" className="fill-lav/35" />
          <g className="anim-ticker">
            <path d="M140 190 l14 14 l26 -28" className="stroke-blu" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      );
    case "interface":
      return (
        <svg viewBox="0 0 400 300" className={common} fill="none" aria-hidden="true">
          <g className="anim-float">
            <rect x="110" y="90" width="180" height="120" rx="10" className="stroke-lav/55" strokeWidth="1.5" fill="transparent" transform="rotate(-6 200 150)" />
          </g>
          <rect x="130" y="70" width="160" height="110" rx="10" className="stroke-silver/50" strokeWidth="1.5" transform="rotate(4 200 150)" />
          <rect x="150" y="110" width="90" height="8" rx="2" className="fill-silver/40" transform="rotate(4 200 150)" />
          <rect x="150" y="128" width="120" height="8" rx="2" className="fill-lav/40" transform="rotate(4 200 150)" />
          <circle cx="316" cy="92" r="20" className="stroke-blu/50" strokeWidth="1" strokeDasharray="4 5" />
          <circle cx="316" cy="92" r="4" className="fill-blu anim-core" />
          <path d="M64 230 Q 120 190 180 225 T 300 215" className="stroke-silver/40" strokeWidth="1" strokeDasharray="3 6" />
        </svg>
      );
  }
}

/* ═══════════════ Статусы ═══════════════ */

const statusStyle: Record<ProjectStatus, { dot: string; text: string; border: string }> = {
  "Активный проект": { dot: "bg-lav", text: "text-lav", border: "border-lav/35" },
  "Разработка": { dot: "bg-blu", text: "text-blu", border: "border-blu/35" },
  "Концепция": { dot: "bg-silver", text: "text-silver", border: "border-silver/30 border-dashed" },
};

function StatusBadge({ status }: { status: ProjectStatus }) {
  const s = statusStyle[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] ${s.border} ${s.text}`}
    >
      <span className={`relative flex h-1.5 w-1.5`}>
        <span className={`absolute h-full w-full animate-ping rounded-full ${s.dot} opacity-60`} />
        <span className={`relative h-1.5 w-1.5 rounded-full ${s.dot}`} />
      </span>
      {status}
    </span>
  );
}

/* ═══════════════ Карточка с 3D-наклоном ═══════════════ */

function TiltCard({ project, onOpen, wide }: { project: Project; onOpen: (p: Project) => void; wide?: boolean }) {
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 140, damping: 16 });
  const sry = useSpring(ry, { stiffness: 140, damping: 16 });

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 6);
    rx.set(-py * 6);
    ref.current.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={reduced ? undefined : { rotateX: srx, rotateY: sry, transformPerspective: 1100 }}
      className="spotlight matte-panel edge-highlight group relative flex h-full flex-col overflow-hidden rounded-2xl transition-[border-color,box-shadow] duration-500 hover:border-lav/30 hover:shadow-[0_30px_80px_-30px_rgb(0_0_0/0.5)]"
      data-cursor="zone"
    >
      {/* Визуал */}
      <div className={`relative overflow-hidden border-b border-line ${wide ? "h-52 md:h-60" : "h-44"}`}>
        <div className="grain absolute inset-0 bg-secondary/40" />
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.06]">
          <ProjectVisual variant={project.visual} />
        </div>
        <div className="absolute left-4 top-4">
          <StatusBadge status={project.status} />
        </div>
        <span className="absolute right-4 top-4 font-mono text-[10px] tabular-nums text-muted-foreground/70">
          {project.year}
        </span>
      </div>

      {/* Контент */}
      <div className={`flex flex-1 flex-col p-6 ${wide ? "md:p-8" : ""}`}>
        <div className="flex items-center gap-3">
          {project.featured && <CharonMark className="h-4 w-4" />}
          <h3 className={`font-display font-semibold tracking-tight ${wide ? "text-2xl md:text-3xl" : "text-xl"}`}>
            {project.name}
          </h3>
        </div>
        <p className={`mt-3 font-medium leading-snug text-foreground/85 ${wide ? "text-base md:text-lg" : "text-sm"}`}>
          {project.tagline}
        </p>
        <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{project.description}</p>

        <div className="mt-auto flex items-center justify-between gap-4 pt-6">
          <div className="flex flex-wrap gap-1.5">
            {project.stack.slice(0, wide ? 4 : 3).map((s) => (
              <span
                key={s}
                className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
          <button
            onClick={() => onOpen(project)}
            className="group/btn inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 hover:border-lav/50 hover:bg-lav/10"
            data-cursor-label="Открыть"
          >
            Подробнее
            <ArrowUpRight className="h-3.5 w-3.5 text-lav transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════ Диалог «Подробнее» ═══════════════ */

function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(project)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="matte-panel max-h-[85vh] overflow-y-auto rounded-2xl border-line p-0 sm:max-w-lg">
        {project && (
          <>
            <div className="relative h-40 overflow-hidden border-b border-line">
              <div className="grain absolute inset-0 bg-secondary/40" />
              <ProjectVisual variant={project.visual} className="absolute inset-0" />
            </div>
            <div className="p-6 md:p-7">
              <DialogHeader className="text-left">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <DialogTitle className="font-display text-2xl font-semibold tracking-tight">
                    {project.name}
                  </DialogTitle>
                  <StatusBadge status={project.status} />
                </div>
                <DialogDescription className="mt-2 text-[15px] font-medium text-foreground/85">
                  {project.tagline}
                </DialogDescription>
              </DialogHeader>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{project.description}</p>

              <ul className="mt-5 space-y-2.5">
                {project.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-lav" />
                    {d}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {project.stack.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {project.status === "Концепция" && (
                <p className="mt-6 rounded-xl border border-dashed border-silver/30 bg-secondary/40 p-4 text-[12.5px] leading-relaxed text-muted-foreground">
                  Это концепция в исследовании — не законченный и не действующий продукт.
                  Никакая информация здесь не является торговой или инвестиционной рекомендацией.
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════ Горизонтальная (десктоп) версия ═══════════════ */

function HorizontalProjects({ onOpen }: { onOpen: (p: Project) => void }) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [range, setRange] = React.useState(0);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      setRange(Math.max(0, trackRef.current.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef });
  const x = useTransform(scrollYProgress, [0, 1], [0, -range]);
  const bgX = useTransform(scrollYProgress, [0, 1], ["4%", "-24%"]);
  const barScale = useTransform(scrollYProgress, [0, 1], [0.06, 1]);

  const featured = projects.find((p) => p.featured)!;
  const rest = projects.filter((p) => !p.featured);

  return (
    <section id="projects" ref={sectionRef} className="relative" style={{ height: range + window.innerHeight }} aria-label="Проекты">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        {/* Фоновое слово с параллаксом */}
        <motion.span
          aria-hidden="true"
          style={reduced ? undefined : { x: bgX }}
          className="text-outline pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 select-none font-display text-[26vw] font-bold leading-none opacity-60"
        >
          PROJECTS
        </motion.span>

        <motion.div ref={trackRef} style={reduced ? undefined : { x }} className="flex items-center gap-8 pl-[8vw] pr-[14vw] w-max">
          {/* Панель-интро */}
          <div className="w-[34vw] min-w-[430px] shrink-0">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] font-medium tracking-[0.3em] text-lav">02</span>
              <span className="h-px w-12 bg-gradient-to-r from-lav/60 to-transparent" />
            </div>
            <h2 className="mt-6 font-display text-[clamp(2rem,3.4vw,3rem)] font-semibold leading-[1.08] tracking-tight">
              {site.projects.title}
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
              {site.projects.lead}
            </p>
            <div className="mt-10 flex items-center gap-3 text-muted-foreground">
              <span className="font-mono text-[10px] uppercase tracking-[0.28em]">прокрутите</span>
              <span className="h-px w-16 overflow-hidden bg-line">
                <motion.span
                  className="block h-full w-1/3 bg-lav"
                  animate={reduced ? undefined : { x: ["-100%", "300%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          {/* Главный проект — Charon */}
          <div className="w-[min(78vw,1060px)] shrink-0">
            <TiltCard project={featured} onOpen={onOpen} wide />
          </div>

          {/* Остальные проекты */}
          {rest.map((p) => (
            <div key={p.id} className="w-[min(52vw,640px)] shrink-0">
              <TiltCard project={p} onOpen={onOpen} />
            </div>
          ))}

          {/* Финальная панель */}
          <div className="flex w-[30vw] min-w-[380px] shrink-0 flex-col items-start justify-center">
            <p className="font-display text-2xl font-semibold leading-snug tracking-tight">
              Дальше —<br />
              <span className="text-lav">мои интересы</span>
            </p>
            <button
              onClick={() => document.getElementById("interests")?.scrollIntoView({ behavior: "smooth" })}
              className="group mt-8 inline-flex items-center gap-3 rounded-full border border-line px-6 py-3 text-sm font-semibold transition-all duration-300 hover:border-lav/50 hover:bg-lav/10"
            >
              Продолжить
              <ArrowRight className="h-4 w-4 text-lav transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>

        {/* Индикатор прогресса */}
        <div className="absolute inset-x-[8vw] bottom-10 flex items-center gap-4">
          <span className="font-mono text-[10px] tabular-nums tracking-[0.2em] text-muted-foreground">
            {String(projects.length).padStart(2, "0")} ПРОЕКТОВ
          </span>
          <div className="h-px flex-1 bg-line">
            <motion.div className="h-full origin-left bg-gradient-to-r from-lav to-blu" style={{ scaleX: barScale }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ Вертикальная (мобильная) версия ═══════════════ */

function StackedProjects({ onOpen }: { onOpen: (p: Project) => void }) {
  const featured = projects.find((p) => p.featured)!;
  const rest = projects.filter((p) => !p.featured);

  return (
    <section id="projects" className="relative py-28 md:py-36" aria-label="Проекты">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading index="02" title={site.projects.title} lead={site.projects.lead} hint="ecosystem" />
        <Reveal>
          <TiltCard project={featured} onOpen={onOpen} wide />
        </Reveal>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {rest.map((p, i) => (
            <Reveal key={p.id} delay={0.05 * i}>
              <TiltCard project={p} onOpen={onOpen} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ Публичный компонент ═══════════════ */

export function Projects() {
  const [isDesktop, setIsDesktop] = React.useState(false);
  const [selected, setSelected] = React.useState<Project | null>(null);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <>
      {isDesktop ? (
        <HorizontalProjects onOpen={setSelected} />
      ) : (
        <StackedProjects onOpen={setSelected} />
      )}
      <ProjectDialog project={selected} onClose={() => setSelected(null)} />
    </>
  );
}
