import { useEffect, useRef, useState } from "react";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { Modal } from "../components/ui";
import type { Profile } from "../../shared/profile-schema.mjs";
import { unlock } from "./signing";
import { StudioEditor } from "./StudioEditor";
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
  const pinField = useRef<HTMLInputElement>(null),
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
    if (!locked) return;
    const id = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(id);
  }, [locked]);
  useEffect(() => {
    if (!key) return;
    let timer: ReturnType<typeof setTimeout>;
    const end = () => {
      setKey(null);
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
  if (key)
    return <StudioEditor session={key} profile={profile} onClose={onClose} />;
  return (
    <Modal
      onClose={onClose}
      title="Вход для владельца"
      eyebrow="OWNER ACCESS / LOCKED"
      className="owner-modal"
    >
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
      {error && (
        <p className="owner-error form-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
