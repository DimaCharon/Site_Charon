import { useSyncExternalStore } from "react";
import { fixedPages } from "../../shared/routes.mjs";
let serverRoute = "";
// For build-time server rendering only. No browser override for published data or URLs.
export function setPrerenderRoute(path: string) {
  if (typeof document === "undefined") serverRoute = path;
}
export function readRoute(): string {
  if (typeof document === "undefined") return serverRoute;
  if (__CHARON_OFFLINE__) {
    return location.hash.startsWith("#/")
      ? location.hash.slice(2).split(/[?@]/)[0].replace(/\/+$/, "")
      : "";
  }
  const baked = document.documentElement.dataset.route;
  if (baked !== undefined) return baked;
  const parts = location.pathname
      .replace(/\/index\.html$/, "/")
      .split("/")
      .filter(Boolean),
    i = parts.findIndex((k) => fixedPages.includes(k));
  return i < 0 ? "" : parts.slice(i).join("/");
}
function listen(cb: () => void) {
  if (!__CHARON_OFFLINE__) return () => {};
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
export const useRoute = () =>
  useSyncExternalStore(listen, readRoute, readRoute);
export function rootPrefix() {
  const p = readRoute();
  return p ? "../".repeat(p.split("/").length) : "./";
}
export function pageHref(path = "", anchor = "") {
  if (__CHARON_OFFLINE__)
    return path
      ? "#/" + path + (anchor ? "@" + anchor : "")
      : "#" + (anchor || "home");
  if (anchor && readRoute() === path) return "#" + anchor;
  return rootPrefix() + (path ? path + "/" : "") + (anchor ? "#" + anchor : "");
}
export function assetUrl(path: string) {
  return __CHARON_ASSETS__[path] || rootPrefix() + path;
}

export function briefHref(reference?: string) {
  return (
    pageHref("contacts") +
    (reference ? "?ref=" + encodeURIComponent(reference) : "")
  );
}
export function readBriefReference() {
  if (typeof location === "undefined") return "";
  const q = __CHARON_OFFLINE__
    ? location.hash.split("?")[1]?.split("@")[0] || ""
    : location.search;
  return new URLSearchParams(q).get("ref") || "";
}
