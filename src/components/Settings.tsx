import type { Dispatch, SetStateAction } from "react";
import { Sun, Moon, Check } from "lucide-react";
import { Modal } from "./ui";
import type { Preferences } from "../config/profile";
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
  prefs,
  setPrefs,
  systemReduce,
  onClose,
}: {
  prefs: Preferences;
  setPrefs: Dispatch<SetStateAction<Preferences>>;
  systemReduce: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      title="Настройки пространства"
      onClose={onClose}
      eyebrow="PREFERENCES / INTERFACE"
    >
      {" "}
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
    </Modal>
  );
}
