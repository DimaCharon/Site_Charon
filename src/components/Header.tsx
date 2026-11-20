import { pageHref, readRoute } from "../config/routes";
import { publishedProfile } from "../config/profile";
import { copy } from "../config/site";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, SlidersHorizontal, Menu } from "lucide-react";
import { navigation } from "../config/site";
import { Mark, Modal } from "./ui";
export function Header({ onSettings }: { onSettings: () => void }) {
  const path = readRoute(),
    pinned = path.startsWith("journal")
      ? "interests"
      : path.startsWith("products") || path === "lab"
        ? "projects"
        : path
          ? "other"
          : "";
  const canContact = Object.values(publishedProfile.contacts).some(Boolean);
  const quick = canContact
    ? { link: pageHref("", "contacts"), label: copy["nav.contact"] }
    : path === "lab"
      ? { link: pageHref("products"), label: copy["store.catalogLink"] }
      : { link: pageHref("lab"), label: copy["lab.start"] };
  const navHref = (id: string) =>
    id === "interests"
      ? pageHref("journal")
      : id === "projects" && path
        ? pageHref("products")
        : pageHref("", id);
  const [current, setCurrent] = useState(pinned || "home"),
    [mobile, setMobile] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState({ width: 0, left: 0 });
  useEffect(() => {
    if (pinned) return;
    let raf = 0;
    const run = () => {
      raf = 0;
      let active = "home";
      for (const id of [
        "home",
        "projects",
        "about",
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
  }, [pinned]);
  useLayoutEffect(() => {
    const el = nav.current;
    const move = () => {
      const a = el?.querySelector<HTMLAnchorElement>(`[data-nav="${current}"]`);
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
          <a
            className="brand"
            href={pageHref("", "home")}
            aria-label={copy["nav.text01"]}
          >
            <Mark />
            <span>{copy["nav.brand"]}</span>
            <small className="masthead-stamp mono">
              {copy["store.wordmark"]}
            </small>
          </a>
          <nav
            className="desktop-nav"
            ref={nav}
            aria-label={copy["nav.text02"]}
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
                data-nav={link.id}
                href={navHref(link.id)}
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
              aria-label={copy["settings.title"]}
              title={copy["settings.title"]}
              onClick={onSettings}
            >
              <SlidersHorizontal size={17} strokeWidth={1.45} />
            </button>
            <a className="contact-nav" href={quick.link}>
              {quick.label}
              <ArrowUpRight size={15} />
            </a>
            <button
              className="mobile-menu icon-button"
              aria-label={copy["nav.text03"]}
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
          title={copy["nav.text04"]}
          eyebrow={copy["nav.text05"]}
          onClose={() => setMobile(false)}
          className="menu-modal"
        >
          <nav aria-label={copy["nav.text06"]}>
            {navigation.map((n, i) => (
              <a
                key={n.id}
                href={navHref(n.id)}
                onClick={() => setMobile(false)}
              >
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
