import { useEffect, useState } from "react";
export const contactNames = {
  telegram: "Telegram",
  email: "Email",
  github: "GitHub",
  social: "Другие соцсети",
};
export type ContactKey = keyof typeof contactNames;
export type Profile = { name: string; contacts: Record<ContactKey, string> };
export type Preferences = {
  theme: "dark" | "light";
  cursor: boolean;
  motion: boolean;
};
export const defaultProfile: Profile = {
  name: "Charon",
  contacts: { telegram: "", email: "", github: "", social: "" },
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
export function safeContact(key: ContactKey, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (key === "email")
    return /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(v) ? `mailto:${v}` : null;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    if (key === "telegram" && !["t.me", "telegram.me"].includes(u.hostname))
      return null;
    if (key === "github" && u.hostname !== "github.com") return null;
    return u.href;
  } catch {
    return null;
  }
}
function clean(raw: unknown): Profile {
  const p = raw as Partial<Profile> | null;
  const contacts = { ...defaultProfile.contacts };
  for (const key of Object.keys(contacts) as ContactKey[]) {
    const v = p?.contacts?.[key];
    if (typeof v === "string" && safeContact(key, v)) contacts[key] = v.trim();
  }
  return {
    name:
      typeof p?.name === "string" && p.name.trim()
        ? p.name.trim().slice(0, 32)
        : "Charon",
    contacts,
  };
}
export function useProfile() {
  const [profile, setProfile] = useState<Profile>(() =>
    clean(read("charon.profile.v2")),
  );
  const [original, setOriginal] = useState(defaultProfile);
  useEffect(() => {
    const embedded = document.getElementById("charon-profile");
    if (embedded) {
      try {
        const p = clean(JSON.parse(embedded.textContent || "{}"));
        setOriginal(p);
        if (!read("charon.profile.v2")) setProfile(p);
        return;
      } catch {
        /* Invalid embedded data: use published configuration. */
      }
    }
    const ac = new AbortController();
    fetch(`${import.meta.env.BASE_URL}identity.json`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : defaultProfile))
      .then((v) => {
        const p = clean(v);
        setOriginal(p);
        if (!read("charon.profile.v2")) setProfile(p);
      })
      .catch(() => {});
    return () => ac.abort();
  }, []);
  return {
    profile,
    save: (p: Profile) => {
      const v = clean(p);
      setProfile(v);
      store("charon.profile.v2", v);
    },
    reset: () => {
      try {
        localStorage.removeItem("charon.profile.v2");
      } catch {
        /* session only */
      }
      setProfile(original);
    },
  };
}
export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(() => {
    const p = read("charon.ui.v2") as Partial<Preferences> | null;
    return {
      theme: p?.theme === "light" ? "light" : "dark",
      cursor: typeof p?.cursor === "boolean" ? p.cursor : defaultPrefs.cursor,
      motion: typeof p?.motion === "boolean" ? p.motion : defaultPrefs.motion,
    };
  });
  const [systemReduce, setSystemReduce] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
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
