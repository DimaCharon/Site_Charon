"use client";

import * as React from "react";
import { site, directions, type Direction } from "@/config/site";
import { SectionHeading } from "./section-heading";
import { Reveal, RevealWords } from "./reveal";

/* ── Анимированные глифы направлений ── */
function DirectionGlyph({ type }: { type: Direction["glyph"] }) {
  const stroke = "currentColor";
  switch (type) {
    case "neural":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="h-full w-full text-lav" aria-hidden="true">
          <g stroke={stroke} strokeWidth="1.4" opacity="0.55">
            <path d="M24 10 L11 24 L24 38 L37 24 Z" />
            <path d="M24 10 L24 24 M11 24 L24 24 M24 38 L24 24 M37 24 L24 24" opacity="0.4" />
          </g>
          {[
            [24, 10],
            [11, 24],
            [37, 24],
            [24, 38],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="3"
              className="fill-current transition-all duration-500 group-hover:r-[4.5]"
              style={{ transitionProperty: "r, opacity", transitionDelay: `${i * 60}ms` }}
            />
          ))}
          <circle cx="24" cy="24" r="4.5" className="fill-current anim-core" />
        </svg>
      );
    case "layers":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="h-full w-full text-lav" aria-hidden="true">
          <rect x="8" y="8" width="22" height="22" rx="3" strokeWidth="1.4" stroke={stroke} opacity="0.45" className="transition-all duration-500 group-hover:translate-x-1 group-hover:translate-y-1 group-hover:opacity-70" />
          <rect x="14" y="14" width="22" height="22" rx="3" strokeWidth="1.4" stroke={stroke} opacity="0.7" className="transition-all duration-500 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
          <rect x="20" y="20" width="22" height="22" rx="3" strokeWidth="1.4" stroke={stroke} className="fill-current/10 transition-all duration-500" />
        </svg>
      );
    case "orbit":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="h-full w-full text-lav" aria-hidden="true">
          <circle cx="24" cy="24" r="6" strokeWidth="1.4" stroke={stroke} className="fill-current/10" />
          <ellipse cx="24" cy="24" rx="18" ry="8" strokeWidth="1.2" stroke={stroke} opacity="0.45" transform="rotate(-18 24 24)" />
          <circle cx="40" cy="19" r="3" className="fill-current" />
          <circle cx="9" cy="30" r="2" className="fill-current opacity-60" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="h-full w-full text-lav" aria-hidden="true">
          <g strokeWidth="1" stroke={stroke} opacity="0.25">
            <path d="M8 12 H40 M8 22 H40 M8 32 H40" />
          </g>
          <path
            d="M8 34 L16 26 L22 30 L30 16 L36 21 L42 9"
            strokeWidth="2"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="80"
            strokeDashoffset="80"
            className="transition-all duration-[1200ms] ease-out group-hover:stroke-dashoffset-0"
          />
          <circle cx="42" cy="9" r="2.6" className="fill-current" />
        </svg>
      );
    case "flow":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="h-full w-full text-lav" aria-hidden="true">
          <path d="M6 16 H42" strokeWidth="1.6" stroke={stroke} strokeLinecap="round" strokeDasharray="6 8" className="anim-dash" />
          <path d="M6 24 H42" strokeWidth="1.6" stroke={stroke} strokeLinecap="round" strokeDasharray="6 8" className="anim-dash" style={{ animationDelay: "-0.5s" }} />
          <path d="M6 32 H42" strokeWidth="1.6" stroke={stroke} strokeLinecap="round" strokeDasharray="6 8" className="anim-dash" style={{ animationDelay: "-1s" }} />
          <circle cx="6" cy="16" r="2.4" className="fill-current" />
          <circle cx="42" cy="24" r="2.4" className="fill-current" />
          <circle cx="6" cy="32" r="2.4" className="fill-current" />
        </svg>
      );
    case "grid":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="h-full w-full text-lav" aria-hidden="true">
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={10 + col * 11}
                y={10 + row * 11}
                width="8"
                height="8"
                rx="1.5"
                strokeWidth="1.2"
                stroke={stroke}
                className="transition-all duration-500"
                style={{
                  transitionDelay: `${(row * 3 + col) * 45}ms`,
                }}
                opacity={0.5}
                data-cell={`${row}-${col}`}
              />
            ))
          )}
          <rect x="21" y="21" width="8" height="8" rx="1.5" className="fill-current anim-core" />
        </svg>
      );
  }
}

/* ── Identity-карточка ── */
function IdentityCard() {
  const rows = [
    { k: "NAME", v: site.ownerName },
    { k: "ROLE", v: "Creative Developer" },
    { k: "FOCUS", v: "AI · Products · Markets" },
    { k: "ECOSYSTEM", v: "Charon" },
    { k: "STATUS", v: "Building", live: true },
  ];

  return (
    <Reveal from="left" delay={0.15}>
      <div className="matte-panel edge-highlight grain relative mt-10 overflow-hidden rounded-2xl p-6">
        {/* Сканирующая линия */}
        <span
          aria-hidden="true"
          className="absolute left-0 h-px w-full bg-gradient-to-r from-transparent via-lav/60 to-transparent"
          style={{ animation: "scan-y 4.5s ease-in-out infinite" }}
        />
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {`// identity`}
          </span>
          <span className="flex gap-1.5" aria-hidden="true">
            <i className="h-1.5 w-1.5 rounded-full bg-border" />
            <i className="h-1.5 w-1.5 rounded-full bg-border" />
            <i className="h-1.5 w-1.5 rounded-full bg-lav/70" />
          </span>
        </div>
        <dl className="mt-5 space-y-0">
          {rows.map((row) => (
            <div
              key={row.k}
              className="flex items-baseline justify-between gap-4 border-b border-line/60 py-2.5 last:border-0"
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                {row.k}
              </dt>
              <dd className="font-mono text-[12px] font-medium text-foreground">
                {row.live ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute h-full w-full animate-ping rounded-full bg-lav opacity-70" />
                      <span className="relative h-1.5 w-1.5 rounded-full bg-lav" />
                    </span>
                    {row.v}
                  </span>
                ) : (
                  row.v
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Reveal>
  );
}

/* ── Карточка направления ── */
function DirectionCard({ d, i }: { d: Direction; i: number }) {
  const ref = React.useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <Reveal delay={0.06 * i} from="up" className={d.span}>
      <div
        ref={ref}
        onMouseMove={onMove}
        className="spotlight matte-panel group relative h-full overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-lav/35"
        data-cursor="zone"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="h-11 w-11 shrink-0 transition-transform duration-500 group-hover:scale-110">
            <DirectionGlyph type={d.glyph} />
          </div>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground/50">
            0{i + 1}
          </span>
        </div>
        <h3 className="mt-5 text-[15px] font-semibold leading-snug tracking-tight">{d.title}</h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground transition-all duration-500 lg:max-h-0 lg:-translate-y-1 lg:opacity-0 lg:group-hover:max-h-44 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
          {d.description}
        </p>
        {/* Линия-акцент при hover */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-lav to-blu transition-transform duration-700 group-hover:scale-x-100"
        />
      </div>
    </Reveal>
  );
}

export function About() {
  return (
    <section id="about" className="relative py-28 md:py-36" aria-label="Обо мне">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading index="01" title={site.about.title} hint="profile" />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Левая колонка — нарратив */}
          <div className="lg:col-span-5">
            <Reveal>
              <p className="text-lg font-medium leading-relaxed text-foreground/90 md:text-xl">
                {site.about.lead}
              </p>
            </Reveal>
            <div className="mt-8 space-y-5">
              {site.about.paragraphs.map((p, i) => (
                <Reveal key={i} delay={0.08 * i}>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">{p}</p>
                </Reveal>
              ))}
            </div>
            <IdentityCard />
          </div>

          {/* Правая колонка — направления */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {directions.map((d, i) => (
                <DirectionCard key={d.id} d={d} i={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Манифест */}
        <div className="mt-24 md:mt-32">
          <div className="relative mx-auto max-w-4xl text-center">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 font-display text-7xl text-lav/20"
            >
              «
            </span>
            <blockquote className="font-display text-[clamp(1.25rem,3vw,2.1rem)] font-medium leading-[1.35] tracking-tight text-balance">
              <RevealWords text={site.about.manifesto} />
            </blockquote>
            <Reveal delay={0.25}>
              <div className="mt-8 flex items-center justify-center gap-4">
                <span className="h-px w-10 bg-line" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  подход
                </span>
                <span className="h-px w-10 bg-line" />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
