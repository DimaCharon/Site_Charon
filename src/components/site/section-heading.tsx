"use client";

import * as React from "react";
import { Reveal, RevealWords } from "./reveal";

interface SectionHeadingProps {
  index: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  hint?: string;
}

/**
 * Единый заголовочный блок секций:
 * моноширинный индекс, тонкая линия, display-заголовок, лид.
 */
export function SectionHeading({ index, title, lead, align = "left", hint }: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={`mb-14 md:mb-20 ${centered ? "text-center" : ""}`}>
      <Reveal from={centered ? "none" : "left"}>
        <div
          className={`flex items-center gap-4 ${centered ? "justify-center" : ""}`}
        >
          <span className="font-mono text-[11px] font-medium tabular-nums tracking-[0.3em] text-lav">
            {index}
          </span>
          <span className="h-px w-12 bg-gradient-to-r from-lav/60 to-transparent" />
          {hint ? (
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 sm:block">
              {hint}
            </span>
          ) : null}
        </div>
      </Reveal>

      <h2 className="mt-6 font-display text-[clamp(1.7rem,4.2vw,3.1rem)] font-semibold leading-[1.08] tracking-tight text-balance">
        <RevealWords text={title} delay={0.08} />
      </h2>

      {lead ? (
        <Reveal delay={0.18} from={centered ? "none" : "up"}>
          <p
            className={`mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base ${
              centered ? "mx-auto" : ""
            }`}
          >
            {lead}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
