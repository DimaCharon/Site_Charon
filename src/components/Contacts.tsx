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
import { SectionLabel, Mark } from "./ui";
import {
  contactNames,
  safeContact,
  type Profile,
  type ContactKey,
} from "../config/profile";
const icons = { telegram: Send, email: Mail, github: Github, social: Globe2 };
export function Contacts({ profile }: { profile: Profile }) {
  const channels = (Object.keys(contactNames) as ContactKey[])
    .map((key) => ({ key, href: safeContact(key, profile.contacts[key]) }))
    .filter((c): c is { key: ContactKey; href: string } => c.href !== null);
  return (
    <section
      id="contacts"
      className="contacts-section section"
      aria-labelledby="contacts-title"
    >
      <div className="contact-watermark" aria-hidden="true">
        <Mark />
      </div>
      <div className="shell">
        <SectionLabel num={copy["contacts.number"]}>
          {copy["contacts.text01"]}
        </SectionLabel>
        <div className="contact-heading reveal">
          <h2 id="contacts-title">
            {copy["contacts.title1"]}{" "}
            <span className="accent">{copy["contacts.title2"]}</span>
          </h2>
          {!channels.length && (
            <div className="folio-code contact-state">
              {copy["contacts.unset"]}
            </div>
          )}
          <p>
            {channels.length ? (
              <>
                {copy["contacts.intro1"]}
                <br className="wide-br" /> {copy["contacts.intro2"]}
              </>
            ) : (
              copy["contacts.text03"]
            )}
          </p>
        </div>
        {channels.length ? (
          <>
            <div className="contact-channels">
              {channels.map(({ key, href }) => {
                const Icon = icons[key];
                return (
                  <a
                    key={key}
                    className="contact-channel"
                    href={href}
                    target={key === "email" ? undefined : "_blank"}
                    rel="noopener noreferrer"
                  >
                    <Icon size={20} strokeWidth={1.4} />
                    <div>
                      <strong>{copy["contacts." + key]}</strong>
                      <span>
                        {profile.contacts[key].replace(/^https?:\/\//, "")}
                      </span>
                    </div>
                    <ArrowUpRight size={15} />
                  </a>
                );
              })}
            </div>
            <div className="contact-note">{copy["contacts.text02"]}</div>
          </>
        ) : (
          <a className="folio-inline" href={pageHref("products")}>
            {copy["store.toProducts"]}
            <ArrowUpRight size={15} />
          </a>
        )}
      </div>
    </section>
  );
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
