import { useState, type Dispatch, type SetStateAction } from "react";
import {
  Sun,
  Moon,
  Check,
  Download,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { Modal } from "./ui";
import {
  contactNames,
  safeContact,
  type Profile,
  type Preferences,
  type ContactKey,
} from "../config/profile";

type Props = {
  profile: Profile;
  save: (p: Profile) => void;
  reset: () => void;
  prefs: Preferences;
  setPrefs: Dispatch<SetStateAction<Preferences>>;
  systemReduce: boolean;
  initialTab: "ui" | "profile";
  onClose: () => void;
};
function Switch({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={"switch " + (value ? "on" : "")}
      role="switch"
      aria-label={label}
      aria-checked={value}
      disabled={disabled}
      onClick={onChange}
    >
      <i />
    </button>
  );
}
export function Settings({
  profile,
  save,
  reset,
  prefs,
  setPrefs,
  systemReduce,
  initialTab,
  onClose,
}: Props) {
  const [tab, setTab] = useState(initialTab),
    [draft, setDraft] = useState<Profile>({
      ...profile,
      contacts: { ...profile.contacts },
    }),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  const valid = () => {
    if (!draft.name.trim()) {
      setError("Укажите имя или псевдоним.");
      return false;
    }
    for (const k of Object.keys(contactNames) as ContactKey[]) {
      if (draft.contacts[k] && !safeContact(k, draft.contacts[k])) {
        setError(
          k === "email"
            ? "Проверьте адрес электронной почты."
            : `Проверьте ссылку ${contactNames[k]}: нужен полный HTTPS-адрес${k === "telegram" ? " на t.me" : k === "github" ? " на github.com" : ""}.`,
        );
        return false;
      }
    }
    setError("");
    return true;
  };
  const exportProfile = () => {
    if (!valid()) return;
    const b = new Blob([JSON.stringify(draft, null, 2) + "\n"], {
        type: "application/json",
      }),
      url = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = url;
    a.download = "identity.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };
  return (
    <Modal
      title="Настройки пространства"
      onClose={onClose}
      eyebrow="PREFERENCES / LOCAL"
    >
      <div className="settings-tabs" aria-label="Раздел настроек">
        <button
          className={tab === "ui" ? "active" : ""}
          aria-pressed={tab === "ui"}
          onClick={() => setTab("ui")}
        >
          Интерфейс
        </button>
        <button
          className={tab === "profile" ? "active" : ""}
          aria-pressed={tab === "profile"}
          onClick={() => setTab("profile")}
        >
          Профиль и контакты
        </button>
      </div>
      {tab === "ui" ? (
        <div className="settings-body">
          <div className="setting-head">
            <h3>Оформление</h3>
            <p>Выберите материал пространства.</p>
          </div>
          <div className="theme-choices">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                className={prefs.theme === t ? "chosen" : ""}
                onClick={() => setPrefs((p) => ({ ...p, theme: t }))}
                aria-pressed={prefs.theme === t}
              >
                {t === "dark" ? <Moon size={17} /> : <Sun size={17} />}{" "}
                {t === "dark" ? "Графит" : "Серебро"}
                {prefs.theme === t && <Check size={15} />}
              </button>
            ))}
          </div>
          <div className="setting-row">
            <div>
              <h3>Движение</h3>
              <p>
                {systemReduce
                  ? "Отключено системной настройкой reduced motion."
                  : "Мягкие переходы и движение 3D-объекта."}
              </p>
            </div>
            <Switch
              label="Анимации интерфейса"
              value={prefs.motion && !systemReduce}
              disabled={systemReduce}
              onChange={() => setPrefs((p) => ({ ...p, motion: !p.motion }))}
            />
          </div>
          <div className="setting-row">
            <div>
              <h3>Интерактивный курсор</h3>
              <p>Тонкий контур у активных элементов на десктопе.</p>
            </div>
            <Switch
              label="Интерактивный курсор"
              value={prefs.cursor}
              onChange={() => setPrefs((p) => ({ ...p, cursor: !p.cursor }))}
            />
          </div>
          <p className="local-note">
            <span className="status-dot" />
            Настройки сохраняются в этом браузере.
          </p>
        </div>
      ) : (
        <form
          className="profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid()) {
              save(draft);
              setSaved(true);
            }
          }}
        >
          <p className="form-intro">
            Локальный предпросмотр профиля. Для публикации скачайте JSON и
            замените <code>public/identity.json</code> в проекте.
          </p>
          <label>
            Имя или псевдоним
            <input
              value={draft.name}
              maxLength={32}
              required
              onChange={(e) => {
                setDraft({ ...draft, name: e.target.value });
                setSaved(false);
              }}
            />
          </label>
          {(Object.keys(contactNames) as ContactKey[]).map((k) => (
            <label key={k}>
              {contactNames[k]}
              <input
                value={draft.contacts[k]}
                type={k === "email" ? "email" : "url"}
                placeholder={
                  {
                    telegram: "https://t.me/…",
                    email: "Ваш email",
                    github: "https://github.com/…",
                    social: "https://…",
                  }[k]
                }
                onChange={(e) => {
                  setDraft({
                    ...draft,
                    contacts: { ...draft.contacts, [k]: e.target.value },
                  });
                  setSaved(false);
                }}
              />
            </label>
          ))}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="button primary" type="submit">
              {saved ? (
                <>
                  <Check size={15} />
                  Сохранено
                </>
              ) : (
                <>
                  Сохранить
                  <ArrowRight size={15} />
                </>
              )}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={exportProfile}
            >
              <Download size={15} />
              JSON
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label="Вернуть опубликованный профиль"
              title="Вернуть опубликованный профиль"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <span className="sr-only" role="status">
            {saved ? "Профиль сохранён в этом браузере." : ""}
          </span>
        </form>
      )}
    </Modal>
  );
}
