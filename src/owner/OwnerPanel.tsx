import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Modal } from "../components/ui";
import {
  contactNames,
  normalizeProfile,
  type ContactKey,
  type Profile,
} from "../../shared/profile-schema.mjs";
import { OWNER_WORKFLOW, preparePacket, unlock } from "./signing";

// A convenience cooldown, not the security boundary. No attempts hit a server.
let failures = 0,
  blockedUntil = 0;
const sessionDuration = 10 * 60_000;
export default function OwnerPanel({
  profile,
  onClose,
}: {
  profile: Profile;
  onClose: () => void;
}) {
  const [key, setKey] = useState<CryptoKey | null>(null),
    [pin, setPin] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [draft, setDraft] = useState<Profile>(() => ({
    ...profile,
    contacts: { ...profile.contacts },
  }));
  const [packet, setPacket] = useState<Awaited<
      ReturnType<typeof preparePacket>
    > | null>(null),
    [copied, setCopied] = useState(false);
  const pinField = useRef<HTMLInputElement>(null),
    packetField = useRef<HTMLTextAreaElement>(null),
    alive = useRef(true),
    [clock, setClock] = useState(Date.now);
  const locked = clock < blockedUntil;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!key) {
      const id = requestAnimationFrame(() =>
        pinField.current?.focus({ preventScroll: true }),
      );
      return () => cancelAnimationFrame(id);
    }
  }, [key]);
  useEffect(() => {
    if (!locked && !packet) return;
    const id = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(id);
  }, [locked, packet]);
  useEffect(() => {
    if (!key) return;
    let timer: ReturnType<typeof setTimeout>;
    const end = () => {
      setKey(null);
      setPacket(null);
      setDraft({ ...profile, contacts: { ...profile.contacts } });
      setError("Сеанс завершён. Введите код ещё раз.");
    };
    const bump = () => {
      clearTimeout(timer);
      timer = setTimeout(end, sessionDuration);
    };
    bump();
    document.addEventListener("pointerdown", bump);
    document.addEventListener("keydown", bump);
    window.addEventListener("pagehide", end);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerdown", bump);
      document.removeEventListener("keydown", bump);
      window.removeEventListener("pagehide", end);
    };
  }, [key, profile]);
  const enter = async () => {
    if (busy || Date.now() < blockedUntil) return;
    setBusy(true);
    setError("");
    try {
      const session = await unlock(pin);
      if (!alive.current) return;
      setPin("");
      if (!session) {
        failures++;
        if (failures >= 5) {
          blockedUntil = Date.now() + 60_000;
          failures = 0;
          setClock(Date.now());
        }
        setError("Неверный код доступа.");
        pinField.current?.focus();
        return;
      }
      failures = 0;
      setKey(session);
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "Не удалось открыть панель.");
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const prepare = async () => {
    if (!key || busy) return;
    setError("");
    setBusy(true);
    try {
      const value = normalizeProfile(draft);
      if (JSON.stringify(value) === JSON.stringify(profile))
        throw new Error("Пока нет изменений для публикации.");
      const next = await preparePacket(key, profile, value);
      if (alive.current) {
        setPacket(next);
        setCopied(false);
        setClock(Date.now());
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось подготовить публикацию.",
      );
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const copy = async () => {
    if (!packet) return;
    try {
      await navigator.clipboard.writeText(packet.text);
      setCopied(true);
    } catch {
      packetField.current?.focus();
      packetField.current?.select();
      setError("Пакет выделен. Скопируйте его вручную.");
    }
  };
  return (
    <Modal
      onClose={onClose}
      title={
        !key
          ? "Вход для владельца"
          : packet
            ? "Подтверждение публикации"
            : "Панель владельца"
      }
      eyebrow={
        !key
          ? "OWNER ACCESS / LOCKED"
          : packet
            ? "OWNER CONSOLE / REVIEW"
            : "OWNER CONSOLE / PROFILE"
      }
      className="owner-modal"
    >
      {!key ? (
        <form
          className="profile-form pin-form"
          onSubmit={(e) => {
            e.preventDefault();
            void enter();
          }}
        >
          <span className="owner-symbol">
            <LockKeyhole size={24} strokeWidth={1.25} />
          </span>
          <p className="form-intro">
            Введите код, чтобы открыть редактор. Для публикации потребуется ваш
            аккаунт владельца GitHub.
          </p>
          <label>
            Код доступа
            <input
              ref={pinField}
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={128}
              required
              value={pin}
              disabled={locked}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
            />
          </label>
          <button
            type="submit"
            className="button primary"
            disabled={busy || locked || !pin}
          >
            {busy
              ? "Проверка…"
              : locked
                ? `Подождите ${Math.max(1, Math.ceil((blockedUntil - clock) / 1000))} с`
                : "Войти"}
            <ArrowRight size={15} />
          </button>
        </form>
      ) : !packet ? (
        <form
          className="profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            void prepare();
          }}
        >
          <div className="owner-notice">
            <ShieldCheck size={17} />
            <span>
              Профиль посетителей доступен только для чтения. Здесь вы готовите
              новую публикацию.
            </span>
          </div>
          <label>
            Имя или псевдоним
            <input
              value={draft.name}
              required
              maxLength={32}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          {(Object.keys(contactNames) as ContactKey[]).map((k) => (
            <label key={k}>
              {contactNames[k]}
              <input
                type={k === "email" ? "email" : "url"}
                autoComplete="off"
                maxLength={k === "email" ? 254 : 384}
                value={draft.contacts[k]}
                placeholder={
                  {
                    telegram: "https://t.me/…",
                    email: "Ваш email",
                    github: "https://github.com/…",
                    social: "https://…",
                  }[k]
                }
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    contacts: { ...draft.contacts, [k]: e.target.value },
                  })
                }
              />
            </label>
          ))}
          <p className="form-intro">
            Оставьте поле пустым, чтобы убрать ссылку. Черновик не меняет
            публичный сайт.
          </p>
          <button type="submit" disabled={busy} className="button primary">
            Подготовить публикацию
            <ArrowRight size={15} />
          </button>
          <div className="owner-session">
            <KeyRound size={12} />
            Сеанс завершится после 10 минут бездействия.
          </div>
        </form>
      ) : (
        <div className="owner-review">
          <div className="owner-notice">
            <ShieldCheck size={18} />
            <span>Изменения подготовлены, но ещё не опубликованы.</span>
          </div>
          <ol>
            <li>Скопируйте подписанный пакет изменений.</li>
            <li>
              Откройте GitHub под аккаунтом <strong>DimaCharon</strong>, нажмите{" "}
              <strong>Run workflow</strong> и вставьте пакет в одноимённое поле.
            </li>
            <li>
              Подтвердите запуск для ветки <code>main</code>. После проверки
              GitHub обновит профиль и опубликует сайт.
            </li>
          </ol>
          <label htmlFor="owner-packet">Пакет изменений</label>
          <textarea
            id="owner-packet"
            aria-label="Пакет изменений"
            ref={packetField}
            readOnly
            spellCheck={false}
            value={packet.text}
            onFocus={(e) => e.target.select()}
          />
          <p className="owner-expiry mono">
            {clock >= packet.expires
              ? "СРОК ИСТЁК — ПОДГОТОВЬТЕ НОВЫЙ ПАКЕТ"
              : `ДЕЙСТВИТЕЛЕН ДО ${new Date(packet.expires).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`}
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              disabled={clock >= packet.expires}
              onClick={() => void copy()}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
              {copied ? "Скопировано" : "Скопировать"}
            </button>
            <a
              className="button primary"
              href={OWNER_WORKFLOW}
              target="_blank"
              rel="noopener noreferrer"
            >
              Открыть GitHub
              <ArrowUpRight size={15} />
            </a>
          </div>
          <button
            type="button"
            className="owner-back"
            onClick={() => {
              setPacket(null);
              setError("");
            }}
          >
            <ArrowLeft size={13} />К черновику
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="form-error owner-error">
          {error}
        </p>
      )}
    </Modal>
  );
}
