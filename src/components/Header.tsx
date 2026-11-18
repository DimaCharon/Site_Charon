import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, SlidersHorizontal, Menu } from "lucide-react";
import { navigation } from "../config/site";
import { Mark, Modal } from "./ui";
export function Header({ onSettings }: { onSettings: () => void }) {
  const [current, setCurrent] = useState("home"),
    [mobile, setMobile] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState({ width: 0, left: 0 });
  useEffect(() => {
    let raf = 0;
    const run = () => {
      raf = 0;
      let active = "home";
      for (const id of [
        "home",
        "about",
        "projects",
        "world",
        "interests",
        "contacts",
      ]) {
        const e = document.getElementById(id);
        if (
          e &&
          e.getBoundingClientRect().top < Math.min(innerHeight * 0.38, 280)
        )
          active = id;
      }
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4)
        active = "contacts";
      setCurrent(active === "world" ? "interests" : active);
    };
    const scroll = () => {
      if (!raf) raf = requestAnimationFrame(run);
    };
    run();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
    };
  }, []);
  useLayoutEffect(() => {
    const el = nav.current;
    const move = () => {
      const a = el?.querySelector<HTMLAnchorElement>(`[href="#${current}"]`);
      if (a) setIndicator({ width: a.offsetWidth, left: a.offsetLeft });
    };
    move();
    const ro = new ResizeObserver(move);
    if (el) ro.observe(el);
    document.fonts.ready.then(move);
    return () => ro.disconnect();
  }, [current]);
  return (
    <>
      <header className="header">
        <div className="shell header-inner">
          <a className="brand" href="#home" aria-label="Charon — на главную">
            <Mark />
            <span>CHARON</span>
          </a>
          <nav
            className="desktop-nav"
            ref={nav}
            aria-label="Основная навигация"
          >
            <i
              className="nav-indicator"
              style={{
                width: indicator.width,
                transform: `translateX(${indicator.left}px)`,
              }}
            />
            {navigation.map((link) => (
              <a
                href={"#" + link.id}
                key={link.id}
                className={current === link.id ? "active" : ""}
                aria-current={current === link.id ? "location" : undefined}
              >
                <b />
                {link.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="settings-trigger"
              aria-label="Настройки пространства"
              title="Настройки пространства"
              onClick={onSettings}
            >
              <SlidersHorizontal size={17} strokeWidth={1.45} />
            </button>
            <a className="contact-nav" href="#contacts">
              Связаться
              <ArrowUpRight size={15} />
            </a>
            <button
              className="mobile-menu icon-button"
              aria-label="Открыть меню"
              aria-expanded={mobile}
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>
      {mobile && (
        <Modal
          title="Навигация"
          eyebrow="CHARON / INDEX"
          onClose={() => setMobile(false)}
          className="menu-modal"
        >
          <nav aria-label="Мобильная навигация">
            {navigation.map((n, i) => (
              <a key={n.id} href={"#" + n.id} onClick={() => setMobile(false)}>
                <span className="mono">0{i + 1}</span>
                {n.label}
                <ArrowUpRight size={17} />
              </a>
            ))}
          </nav>
        </Modal>
      )}
    </>
  );
}
