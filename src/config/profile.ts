import { useEffect, useState } from "react";
import { normalizeProfile } from "../../shared/profile-schema.mjs";
export {
  contactNames,
  safeContact,
  type Profile,
  type ContactKey,
} from "../../shared/profile-schema.mjs";
// The public rendering has no setters, write endpoint, query override or local profile override.
export const publishedProfile = normalizeProfile(__CHARON_PROFILE__);
Object.freeze(publishedProfile.contacts);
Object.freeze(publishedProfile);
export type Preferences = {
  theme: "dark" | "light";
  snow: boolean;
  cursor: boolean;
  motion: boolean;
};
const defaultPrefs: Preferences = {
  theme: "dark",
  cursor: true,
  motion: true,
  snow: false,
};
function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}
function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private browsing still supports this session. */
  }
}
const UI_KEY = "charon.ui.v2";
function readPrefs(): Preferences {
  const p = read(UI_KEY) as Partial<Preferences> | null;
  return {
    theme: p?.theme === "light" ? "light" : "dark",
    snow: p?.snow === true,
    cursor: typeof p?.cursor === "boolean" ? p.cursor : defaultPrefs.cursor,
    motion: typeof p?.motion === "boolean" ? p.motion : defaultPrefs.motion,
  };
}
export function usePreferences() {
  useEffect(() => {
    try {
      localStorage.removeItem("charon.profile.v2");
    } catch {
      /* Read-only privacy modes. */
    }
  }, []);
  const [prefs, setPrefs] = useState<Preferences>(readPrefs);
  useEffect(() => {
    const restore = () => {
      const next = readPrefs();
      setPrefs((old) =>
        old.theme === next.theme &&
        old.snow === next.snow &&
        old.cursor === next.cursor &&
        old.motion === next.motion
          ? old
          : next,
      );
    };
    const onReturn = (e: PageTransitionEvent) => {
      if (e.persisted) restore();
    };
    const onStore = (e: StorageEvent) => {
      if (e.key === UI_KEY || e.key === null) restore();
    };
    window.addEventListener("pageshow", onReturn);
    window.addEventListener("storage", onStore);
    return () => {
      window.removeEventListener("pageshow", onReturn);
      window.removeEventListener("storage", onStore);
    };
  }, []);
  const [systemReduce, setSystemReduce] = useState(
    () =>
      typeof window !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setSystemReduce(q.matches);
    q.addEventListener("change", change);
    return () => q.removeEventListener("change", change);
  }, []);
  const reduced = systemReduce || !prefs.motion;
  useEffect(() => {
    const d = document.documentElement;
    d.dataset.theme = prefs.theme;
    d.dataset.motion = reduced ? "reduced" : "full";
    d.style.colorScheme = prefs.theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", prefs.theme === "dark" ? "#000000" : "#ffffff");
    store(UI_KEY, prefs);
  }, [prefs, reduced]);
  return { prefs, setPrefs, reduced, systemReduce };
}
