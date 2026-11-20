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
  cursor: boolean;
  motion: boolean;
};
const defaultPrefs: Preferences = { theme: "dark", cursor: true, motion: true };
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
export function usePreferences() {
  useEffect(() => {
    try {
      localStorage.removeItem("charon.profile.v2");
    } catch {
      /* Read-only privacy modes. */
    }
  }, []);
  const [prefs, setPrefs] = useState<Preferences>(() => {
    const p = read("charon.ui.v2") as Partial<Preferences> | null;
    return {
      theme: p?.theme === "light" ? "light" : "dark",
      cursor: typeof p?.cursor === "boolean" ? p.cursor : defaultPrefs.cursor,
      motion: typeof p?.motion === "boolean" ? p.motion : defaultPrefs.motion,
    };
  });
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
      ?.setAttribute("content", prefs.theme === "dark" ? "#0d0e11" : "#eeedf1");
    store("charon.ui.v2", prefs);
  }, [prefs, reduced]);
  return { prefs, setPrefs, reduced, systemReduce };
}
