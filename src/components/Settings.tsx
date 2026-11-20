import { copy } from "../config/site";
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
      title={copy["settings.title"]}
      onClose={onClose}
      eyebrow={copy["settings.text01"]}
    >
      {" "}
      <div className="settings-body">
        <div className="setting-head">
          <h3>{copy["settings.text02"]}</h3>
          <p>{copy["settings.text03"]}</p>
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
              {t === "dark" ? copy["settings.text04"] : copy["settings.text05"]}
              {prefs.theme === t && <Check size={15} />}
            </button>
          ))}
        </div>
        <div className="setting-row">
          <div>
            <h3>{copy["settings.text06"]}</h3>
            <p>
              {systemReduce ? copy["settings.text07"] : copy["settings.text08"]}
            </p>
          </div>
          <Switch
            label={copy["settings.text09"]}
            value={prefs.motion && !systemReduce}
            disabled={systemReduce}
            onChange={() => setPrefs((p) => ({ ...p, motion: !p.motion }))}
          />
        </div>
        <div className="setting-row">
          <div>
            <h3>{copy["settings.text10"]}</h3>
            <p>{copy["settings.text11"]}</p>
          </div>
          <Switch
            label={copy["settings.text10"]}
            value={prefs.cursor}
            onChange={() => setPrefs((p) => ({ ...p, cursor: !p.cursor }))}
          />
        </div>
        <div className="setting-row">
          <div>
            <h3>{copy["settings.snow"]}</h3>
            <p>
              {
                copy[
                  systemReduce || !prefs.motion
                    ? "settings.snowQuiet"
                    : "settings.snowHint"
                ]
              }
            </p>
          </div>
          <Switch
            label={copy["settings.snow"]}
            value={prefs.snow && prefs.motion && !systemReduce}
            disabled={systemReduce || !prefs.motion}
            onChange={() => setPrefs((p) => ({ ...p, snow: !p.snow }))}
          />
        </div>
        <p className="local-note">
          <span className="status-dot" />
          {copy["settings.text12"]}
        </p>
      </div>
    </Modal>
  );
}
