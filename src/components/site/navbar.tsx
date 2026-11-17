"use client";

import * as React from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X, MousePointer2, MousePointerBan } from "lucide-react";
import { navLinks, site } from "@/config/site";
import { Magnetic } from "./magnetic";

/** Фирменный знак — звезда-ядро Charon */
export function CharonMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M16 2 L19 13 L30 16 L19 19 L16 30 L13 19 L2 16 L13 13 Z"
        className="fill-lav/90"
      />
      <circle cx="16" cy="16" r="3.2" className="fill-background" />
    </svg>
  );
}

function useScrollSpy(ids: readonly string[]) {
  const [active, setActive] = React.useState(ids[0]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [cursorOn, setCursorOn] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();
  const active = useScrollSpy(navLinks.map((l) => l.id));

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const stored = window.localStorage.getItem("charon:cursor");
    setCursorOn(stored === null ? true : stored === "on");
    const onChanged = (e: Event) => {
      setCursorOn((e as CustomEvent).detail === true);
    };
    window.addEventListener("charon:cursor-changed", onChanged);
    return () => window.removeEventListener("charon:cursor-changed", onChanged);
  }, [mounted]);

  React.useEffect(() => {
    if (menuOpen) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen]);

  const goTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    // Даём time на восстановление overflow после закрытия меню,
    // иначе scrollIntoView блокируется скрытым скроллом
    window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleCursor = () => {
    // Состояние меняет компонент курсора — шлём только событие
    window.dispatchEvent(new Event("charon:cursor-toggle"));
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-[80]"
      >
        <div
          className={`mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 transition-all duration-500 md:px-6 ${
            scrolled
              ? "mt-3 rounded-2xl border border-line bg-card/80 shadow-[0_12px_40px_-16px_rgb(0_0_0/0.45)] backdrop-blur-2xl backdrop-saturate-150"
              : "mt-0 border border-transparent bg-transparent"
          }`}
        >
          {/* Лого */}
          <button
            onClick={() => goTo("home")}
            className="group flex items-center gap-2.5"
            aria-label="В начало"
            data-cursor-label="Наверх"
          >
            <span className="relative grid h-9 w-9 place-items-center">
              <CharonMark className="h-5 w-5 transition-transform duration-500 group-hover:rotate-[72deg]" />
              <span className="absolute inset-0 rounded-full border border-line opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </span>
            <span className="font-mono text-[13px] font-medium uppercase tracking-[0.28em] text-foreground/90">
              {site.ownerName}
            </span>
          </button>

          {/* Десктоп-меню */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Основная навигация">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => goTo(link.id)}
                className={`relative rounded-full px-4 py-2 text-[13px] font-medium transition-colors duration-300 ${
                  active === link.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active === link.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full border border-line bg-secondary/70"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </button>
            ))}
          </nav>

          {/* Правые контролы */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleCursor}
              className="hidden h-9 w-9 place-items-center rounded-full border border-transparent text-muted-foreground transition-all duration-300 hover:border-line hover:text-foreground sm:grid"
              aria-label={cursorOn ? "Выключить кастомный курсор" : "Включить кастомный курсор"}
              title={cursorOn ? "Курсор: включён" : "Курсор: выключен"}
            >
              {cursorOn ? (
                <MousePointer2 className="h-4 w-4" />
              ) : (
                <MousePointerBan className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-full border border-transparent text-muted-foreground transition-all duration-300 hover:border-line hover:text-foreground"
              aria-label="Сменить тему"
              title="Тема"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mounted ? (theme ?? "dark") : "pending"}
                  initial={{ rotate: -60, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 60, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="grid"
                >
                  {mounted && theme === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>

            <Magnetic strength={0.25} className="hidden md:block">
              <button
                onClick={() => goTo("contacts")}
                className="rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                Связаться
              </button>
            </Magnetic>

            <button
              onClick={() => setMenuOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-foreground md:hidden"
              aria-label="Открыть меню"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Прогресс скролла */}
        <motion.div
          className="mx-auto h-px max-w-6xl origin-left bg-gradient-to-r from-lav via-blu to-lav/40"
          style={{ scaleX: progress }}
        />
      </motion.header>

      {/* Мобильное меню */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[90] flex flex-col bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex h-16 items-center justify-between px-4">
              <div className="flex items-center gap-2.5">
                <CharonMark className="h-5 w-5" />
                <span className="font-mono text-[13px] uppercase tracking-[0.28em]">
                  {site.ownerName}
                </span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-line"
                aria-label="Закрыть меню"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col justify-center gap-1 px-6" aria-label="Мобильная навигация">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, x: -32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => goTo(link.id)}
                  className="group flex items-baseline gap-4 border-b border-line py-5 text-left"
                >
                  <span className="font-mono text-[11px] tabular-nums text-lav">
                    0{i + 1}
                  </span>
                  <span className="font-display text-2xl font-medium text-foreground transition-transform duration-300 group-active:translate-x-2">
                    {link.label}
                  </span>
                </motion.button>
              ))}
            </nav>

            <p className="px-6 pb-10 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {site.ownerNameSub}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
