import { copy } from "../config/site";
import { useEffect, useRef } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  Minus,
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
          <p>
            {copy["contacts.intro1"]}
            <br className="wide-br" /> {copy["contacts.intro2"]}
          </p>
        </div>
        <div className="contact-channels">
          {(Object.keys(contactNames) as ContactKey[]).map((k) => {
            const Icon = icons[k],
              href = safeContact(k, profile.contacts[k]);
            const inside = (
              <>
                <Icon size={20} strokeWidth={1.4} />
                <div>
                  <strong>{copy["contacts." + k]}</strong>
                  <span>
                    {href
                      ? profile.contacts[k].replace(/^https?:\/\//, "")
                      : copy["contacts.unset"]}
                  </span>
                </div>
                {href ? (
                  <ArrowUpRight size={15} />
                ) : (
                  <Minus size={12} aria-hidden="true" />
                )}
              </>
            );
            return href ? (
              <a
                className="contact-channel"
                key={k}
                href={href}
                target={k === "email" ? undefined : "_blank"}
                rel="noopener noreferrer"
              >
                {inside}
              </a>
            ) : (
              <div className="contact-channel unavailable" key={k}>
                {inside}
              </div>
            );
          })}
        </div>
        <div className="contact-note">
          {Object.values(profile.contacts).some(Boolean)
            ? copy["contacts.text02"]
            : copy["contacts.text03"]}
        </div>
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
    <footer>
      <div className="shell footer-inner">
        <a className="brand small-brand" href="#home">
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
        <a className="back-top" href="#home">
          {copy["footer.top"]}
          <ArrowUp size={14} />
        </a>
      </div>
    </footer>
  );
}
