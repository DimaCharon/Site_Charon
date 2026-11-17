"use client";

import * as React from "react";
import {
  Brain,
  Code2,
  LineChart,
  Package,
  PenTool,
  Zap,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";
import { site, interests, type Interest } from "@/config/site";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

const iconMap: Record<Interest["icon"], LucideIcon> = {
  brain: Brain,
  code: Code2,
  chart: LineChart,
  box: Package,
  pen: PenTool,
  zap: Zap,
  flask: FlaskConical,
};

/* Индивидуальная анимация иконки при hover */
const iconAnim: Record<Interest["icon"], string> = {
  brain: "transition-all duration-500 group-hover:scale-110 group-hover:text-lav [animation:core-pulse_1.6s_ease-in-out_infinite_group-hover]",
  code: "transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110",
  chart: "transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110",
  box: "transition-transform duration-700 group-hover:[transform:rotateY(180deg)] [transform-style:preserve-3d]",
  pen: "transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110",
  zap: "transition-all duration-300 group-hover:scale-125 group-hover:text-lav",
  flask: "transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-12",
};

const sizeClass: Record<Interest["size"], string> = {
  lg: "col-span-2 sm:col-span-2 lg:col-span-2 lg:row-span-2",
  md: "lg:col-span-2",
  sm: "",
};

function InterestCard({ interest, i }: { interest: Interest; i: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const Icon = iconMap[interest.icon];
  const isBig = interest.size === "lg";

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <Reveal delay={0.05 * i} from="up" className={sizeClass[interest.size]}>
      <div
        ref={ref}
        onMouseMove={onMove}
        className="spotlight matte-panel group relative flex h-full flex-col overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-lav/30"
        data-cursor="zone"
      >
        {/* Большая карточка — фоновая нейросеть */}
        {isBig && (
          <svg
            viewBox="0 0 300 220"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 h-[120%] w-[120%] opacity-[0.16] transition-opacity duration-700 group-hover:opacity-30"
          >
            <g className="stroke-lav" strokeWidth="0.8">
              <path d="M40 180 L110 120 L180 170 M110 120 L110 40 M180 170 L250 90 M110 40 L250 90 M40 180 L180 40 M180 40 L250 90" />
            </g>
            {[[40, 180], [110, 120], [180, 170], [110, 40], [250, 90], [180, 40]].map(([cx, cy], k) => (
              <circle key={k} cx={cx} cy={cy} r="4" className="fill-lav anim-core" style={{ animationDelay: `${k * 0.5}s` }} />
            ))}
          </svg>
        )}

        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-secondary/60">
              <Icon className={`h-5 w-5 text-foreground/80 ${iconAnim[interest.icon]}`} strokeWidth={1.6} />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground/50">
          {String(i + 1).padStart(2, "0")}
        </span>
          </div>

          <h3 className={`mt-auto font-display font-semibold tracking-tight ${isBig ? "pt-16 text-xl md:text-2xl" : "pt-8 text-base"}`}>
            {interest.title}
          </h3>
          <p className={`mt-2 leading-relaxed text-muted-foreground ${isBig ? "max-w-xs text-sm" : "text-[13px]"}`}>
            {interest.description}
          </p>
        </div>

        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-lav to-blu transition-transform duration-700 group-hover:scale-x-100"
        />
      </div>
    </Reveal>
  );
}

export function Interests() {
  return (
    <section id="interests" className="relative py-28 md:py-36" aria-label="Интересы">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading index="04" title={site.interests.title} lead={site.interests.lead} hint="focus areas" />

        <div className="grid auto-rows-[minmax(150px,auto)] grid-cols-2 gap-4 lg:grid-cols-4">
          {interests.map((interest, i) => (
            <InterestCard key={interest.id} interest={interest} i={i} />
          ))}

          {/* Финальная «призрачная» ячейка — честный слот будущего интереса */}
          <Reveal delay={0.4} className="hidden lg:block">
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-line/80 p-6 text-center">
              <span className="font-display text-2xl text-muted-foreground/40">+</span>
              <span className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/50">
                место для нового
                <br />
                увлечения
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
