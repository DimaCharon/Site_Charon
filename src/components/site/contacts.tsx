"use client";

import * as React from "react";
import { toast } from "sonner";
import { Send, Mail, Github, Globe, Copy, ArrowUpRight, Info } from "lucide-react";
import { site, contacts, type ContactLink } from "@/config/site";
import { Magnetic } from "./magnetic";
import { Reveal, RevealWords } from "./reveal";

const iconMap: Record<ContactLink["icon"], typeof Send> = {
  send: Send,
  mail: Mail,
  github: Github,
  globe: Globe,
};

function ContactCard({ contact, i }: { contact: ContactLink; i: number }) {
  const Icon = iconMap[contact.icon];

  const copy = async () => {
    const value = contact.value;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Фолбэк для контекстов без Clipboard API
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success(`Скопировано: ${value}`, {
        description: "Это плейсхолдер — задайте реальный контакт в src/config/site.ts",
      });
    } catch {
      toast.error("Не удалось скопировать", {
        description: `Скопируйте вручную: ${value}`,
      });
    }
  };

  return (
    <Reveal delay={0.06 * i} from="up">
      <div className="matte-panel group relative overflow-hidden rounded-2xl p-5 transition-all duration-500 hover:-translate-y-1 hover:border-lav/30">
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-secondary/60 transition-colors duration-500 group-hover:border-lav/40">
            <Icon className="h-4.5 w-4.5 text-lav" strokeWidth={1.7} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
              {contact.label}
            </p>
            {/* Плейсхолдер значения — редактируется в конфиге */}
            <p
              className="mt-1 truncate border-b border-dashed border-muted-foreground/30 pb-0.5 text-sm font-medium text-foreground/85"
              title={contact.value}
            >
              {contact.value}
            </p>
          </div>
          <button
            onClick={copy}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-muted-foreground transition-all duration-300 hover:border-lav/50 hover:text-foreground"
            aria-label={`Скопировать ${contact.label}`}
            data-cursor-label="Копировать"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-3 pl-[60px] text-[12px] text-muted-foreground/80">{contact.hint}</p>
      </div>
    </Reveal>
  );
}

export function Contacts() {
  const primary = contacts[0];

  const mainCta = () => {
    if (primary.href) {
      window.open(primary.href, "_blank", "noopener,noreferrer");
    } else {
      toast("Ссылка пока не задана", {
        description: "Замените плейсхолдеры в src/config/site.ts — и кнопка оживёт",
      });
    }
  };

  return (
    <section
      id="contacts"
      className="relative overflow-hidden border-t border-line py-28 md:py-36"
      aria-label="Контакты"
    >
      {/* Мягкий свет в центре */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-16 h-[420px] w-[720px] max-w-full -translate-x-1/2 rounded-full opacity-[0.09] blur-3xl"
        style={{ background: "radial-gradient(ellipse, var(--lav) 0%, transparent 65%)" }}
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
        <Reveal from="none">
          <div className="mx-auto flex w-max items-center gap-4">
            <span className="font-mono text-[11px] font-medium tracking-[0.3em] text-lav">05</span>
            <span className="h-px w-12 bg-gradient-to-r from-lav/60 to-transparent" />
          </div>
        </Reveal>

        <h2 className="mt-6 font-display text-[clamp(1.9rem,4.6vw,3.4rem)] font-semibold leading-[1.08] tracking-tight text-balance">
          <RevealWords text={site.contact.title.replace("?", "")} />
          <span className="text-lav">?</span>
        </h2>

        <Reveal delay={0.15}>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
            {site.contact.subtitle}
          </p>
        </Reveal>

        <Reveal delay={0.22}>
          <div className="mt-10">
            <Magnetic strength={0.3}>
              <button
                onClick={mainCta}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-primary px-9 py-4 text-[15px] font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
                data-cursor-label="Написать"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Send className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                <span className="relative">Написать мне</span>
                <ArrowUpRight className="relative h-4 w-4 opacity-70" />
              </button>
            </Magnetic>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
          {contacts.map((c, i) => (
            <ContactCard key={c.id} contact={c} i={i} />
          ))}
        </div>

        <Reveal delay={0.3}>
          <p className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            <Info className="h-3 w-3" />
            {site.contact.note}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
