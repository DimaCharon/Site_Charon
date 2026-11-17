"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { site } from "@/config/site";
import { CharonMark } from "./navbar";
import { Magnetic } from "./magnetic";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row md:px-6">
        <div className="flex items-center gap-3">
          <CharonMark className="h-4 w-4" />
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            © {year} {site.ownerName} — {site.ownerNameSub}
          </p>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
          спроектировано и собрано внутри экосистемы {site.ownerName}
        </p>

        <Magnetic strength={0.3}>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group grid h-11 w-11 place-items-center rounded-full border border-line transition-colors duration-300 hover:border-lav/50 hover:bg-lav/10"
            aria-label="Наверх"
            data-cursor-label="Наверх"
          >
            <ArrowUp className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </button>
        </Magnetic>
      </div>
    </footer>
  );
}
