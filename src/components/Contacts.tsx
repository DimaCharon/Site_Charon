import { pageHref, readRoute } from "../config/routes";
import { copy } from "../config/site";
import { useEffect, useRef } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Send,
  Mail,
  Github,
  Globe2,
} from "lucide-react";
import { Mark } from "./ui";
import {
  contactNames,
  safeContact,
  type Profile,
  type ContactKey,
} from "../config/profile";
const icons = { telegram: Send, email: Mail, github: Github, social: Globe2 };
export function PublishedChannels({ profile }: { profile: Profile }) {
  const items = (Object.keys(contactNames) as ContactKey[])
    .map((key) => ({ key, href: safeContact(key, profile.contacts[key]) }))
    .filter((c): c is { key: ContactKey; href: string } => c.href !== null);
  return items.length ? (
    <aside className="direct-desk">
      <span className="folio-code">{copy["contacts.text02"]}</span>
      <div className="contact-channels">
        {items.map(({ key, href }) => {
          const Icon = icons[key];
          return (
            <a
              className="contact-channel"
              href={href}
              key={key}
              target={key === "email" ? undefined : "_blank"}
              rel="noopener noreferrer"
            >
              <Icon size={16} />
              <div>
                <strong>{copy["contacts." + key]}</strong>
                <span>{profile.contacts[key].replace(/^https?:\/\//, "")}</span>
              </div>
              <ArrowUpRight size={14} />
            </a>
          );
        })}
      </div>
    </aside>
  ) : null;
}
export function Footer({ onOwner }: { onOwner: () => void }) {
  const taps = useRef<number[]>([]);
  useEffect(() => {
    const clear = () => {
      taps.current = [];
    };
    document.addEventListener("visibilitychange", clear);
    return () => document.removeEventListener("visibilitychange", clear);
  }, []);
  const tap = () => {
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 3200), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      onOwner();
    }
  };
  return (
    <footer className="folio-footer">
      <div className="shell footer-directory">
        <div>
          <span className="folio-code">{copy["store.resources"]}</span>
          <h2>{copy["store.shelf"]}</h2>
        </div>
        <nav aria-label={copy["store.shelf"]}>
          {[
            ["products", "store.catalog"],
            ["about", "nav.about"],
            ["references", "refs.title"],
            ["contacts", "nav.contacts"],
            ["lab", "lab.title"],
            ["journal", "library.notes"],
            ["guide", "library.guide"],
            ["updates", "library.updates"],
          ].map(([path, key]) => (
            <a key={path} href={pageHref(path)}>
              {copy[key]}
              <ArrowUpRight size={13} />
            </a>
          ))}
        </nav>
      </div>
      <div className="shell footer-inner">
        <a className="brand small-brand" href={pageHref("", "home")}>
          <Mark />
          <span>{copy["footer.brand"]}</span>
        </a>
        <button
          type="button"
          className="mono owner-trigger"
          onClick={tap}
          aria-label={copy["footer.signature"]}
        >
          {copy["footer.signature"]}
        </button>
        <a
          className="back-top"
          href={pageHref(readRoute(), "page-top")}
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({
              top: 0,
              behavior:
                document.documentElement.dataset.motion === "reduced"
                  ? "instant"
                  : "smooth",
            });
          }}
        >
          {copy["footer.top"]}
          <ArrowUp size={14} />
        </a>
      </div>
    </footer>
  );
}
