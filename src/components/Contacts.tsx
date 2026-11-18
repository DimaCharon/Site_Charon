import {
  ArrowUp,
  ArrowUpRight,
  Plus,
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
export function Contacts({
  profile,
  onEdit,
}: {
  profile: Profile;
  onEdit: () => void;
}) {
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
        <SectionLabel num="05">КОНТАКТЫ</SectionLabel>
        <div className="contact-heading reveal">
          <h2 id="contacts-title">
            Есть интересная <span className="accent">идея?</span>
          </h2>
          <p>
            Открыт к интересным проектам, экспериментам
            <br className="wide-br" /> и технологическим решениям.
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
                  <strong>{contactNames[k]}</strong>
                  <span>
                    {href
                      ? profile.contacts[k].replace(/^https?:\/\//, "")
                      : "Контакт не указан"}
                  </span>
                </div>
                {href ? <ArrowUpRight size={15} /> : <Plus size={15} />}
              </>
            );
            return href ? (
              <a
                className="contact-channel"
                key={k}
                href={href}
                target={k === "email" ? undefined : "_blank"}
                rel="noreferrer"
              >
                {inside}
              </a>
            ) : (
              <button
                className="contact-channel"
                key={k}
                onClick={onEdit}
                aria-label={"Настроить контакт: " + contactNames[k]}
              >
                {inside}
              </button>
            );
          })}
        </div>
        <div className="contact-note">
          Контакты можно заполнить в настройках профиля.
        </div>
      </div>
    </section>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="shell footer-inner">
        <a className="brand small-brand" href="#home">
          <Mark />
          <span>CHARON</span>
        </a>
        <span className="mono">PERSONAL DIGITAL IDENTITY</span>
        <a className="back-top" href="#home">
          Наверх
          <ArrowUp size={14} />
        </a>
      </div>
    </footer>
  );
}
