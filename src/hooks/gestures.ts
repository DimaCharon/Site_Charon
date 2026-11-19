import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

type Surface = RefObject<HTMLElement | null>;
const ignored = (e: PointerEvent) =>
  !e.isPrimary ||
  e.button !== 0 ||
  (e.target instanceof Element &&
    !!e.target.closest(
      'input,textarea,select,[contenteditable="true"],[data-no-swipe]',
    ));
const smooth = (): ScrollBehavior =>
  document.documentElement.dataset.motion === "reduced" ? "instant" : "smooth";

/** Cards keep native touch/trackpad momentum. A mouse drag follows the pointer
 * and settles on a card; a drag never accidentally opens a card beneath it. */
export function useRailDrag(ref: Surface) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let track: {
        id: number;
        x: number;
        y: number;
        left: number;
        active: boolean;
      } | null = null,
      suppress = 0;
    const down = (e: PointerEvent) => {
      suppress = 0;
      if (
        ignored(e) ||
        e.pointerType === "touch" ||
        el.scrollWidth <= el.clientWidth + 1
      )
        return;
      track = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        left: el.scrollLeft,
        active: false,
      };
    };
    const move = (e: PointerEvent) => {
      if (!track || track.id !== e.pointerId) return;
      const dx = e.clientX - track.x,
        dy = e.clientY - track.y;
      if (!track.active) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
          track = null;
          return;
        }
        if (Math.abs(dx) < 7) return;
        track.active = true;
        el.dataset.dragging = "true";
        el.setPointerCapture(e.pointerId);
      }
      el.scrollLeft = track.left - dx;
      e.preventDefault();
    };
    const end = (e: PointerEvent) => {
      if (!track || track.id !== e.pointerId) return;
      const t = track;
      track = null;
      delete el.dataset.dragging;
      if (el.hasPointerCapture(e.pointerId))
        el.releasePointerCapture(e.pointerId);
      if (!t.active) return;
      suppress = performance.now() + 350;
      const items = Array.from(el.children) as HTMLElement[];
      if (items.length < 2) return;
      const stride = items[1].offsetLeft - items[0].offsetLeft,
        dx = e.clientX - t.x;
      if (!stride) return;
      const steps =
        Math.abs(dx) > Math.min(60, stride * 0.18)
          ? -Math.sign(dx) * Math.max(1, Math.round(Math.abs(dx) / stride))
          : 0;
      const index = Math.max(
        0,
        Math.min(
          items.length - 1,
          Math.round(t.left / stride) +
            (e.type === "pointercancel" ? 0 : steps),
        ),
      );
      el.scrollTo({
        left: items[index].offsetLeft - items[0].offsetLeft,
        behavior: smooth(),
      });
    };
    const click = (e: MouseEvent) => {
      if (performance.now() < suppress && e.detail !== 0) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    const preventImageDrag = (e: DragEvent) => e.preventDefault();
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    el.addEventListener("click", click, true);
    el.addEventListener("dragstart", preventImageDrag);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      el.removeEventListener("click", click, true);
      el.removeEventListener("dragstart", preventImageDrag);
      delete el.dataset.dragging;
    };
  }, [ref]);
}

/** A discrete horizontal gesture for dossiers, field descriptions and orbits.
 * Vertical movements and pinch zoom stay with the browser. */
export function usePagingGesture(ref: Surface, step?: (delta: number) => void) {
  const latest = useRef(step);
  useLayoutEffect(() => {
    latest.current = step;
  }, [step]);
  const enabled = !!step;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    el.dataset.swipe = "true";
    let track: {
        id: number;
        x: number;
        y: number;
        at: number;
        active: boolean;
      } | null = null,
      suppress = 0,
      wheelSum = 0,
      wheelLast = 0,
      wheelDone = false;
    const down = (e: PointerEvent) => {
      suppress = 0;
      if (ignored(e)) return;
      track = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        at: performance.now(),
        active: false,
      };
    };
    const move = (e: PointerEvent) => {
      if (!track || track.id !== e.pointerId) return;
      const dx = e.clientX - track.x,
        dy = e.clientY - track.y;
      if (!track.active) {
        if (Math.abs(dy) > 9 && Math.abs(dy) >= Math.abs(dx)) {
          track = null;
          return;
        }
        if (Math.abs(dx) < 9 || Math.abs(dx) < 1.25 * Math.abs(dy)) return;
        track.active = true;
        el.setPointerCapture(e.pointerId);
        el.dataset.dragging = "true";
      }
      el.style.setProperty(
        "--swipe-offset",
        `${Math.max(-12, Math.min(12, dx * 0.08))}px`,
      );
    };
    const end = (e: PointerEvent) => {
      if (!track || track.id !== e.pointerId) return;
      const t = track;
      track = null;
      delete el.dataset.dragging;
      el.style.removeProperty("--swipe-offset");
      if (el.hasPointerCapture(e.pointerId))
        el.releasePointerCapture(e.pointerId);
      if (!t.active) return;
      suppress = performance.now() + 350;
      const dx = e.clientX - t.x,
        dt = performance.now() - t.at;
      if (
        e.type === "pointerup" &&
        (Math.abs(dx) > 44 || (Math.abs(dx) > 23 && dt < 300))
      )
        latest.current?.(dx < 0 ? 1 : -1);
    };
    const click = (e: MouseEvent) => {
      if (performance.now() < suppress && e.detail !== 0) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    const keys = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey ||
        !["ArrowLeft", "ArrowRight"].includes(e.key)
      )
        return;
      if (
        e.target instanceof Element &&
        e.target.closest(
          'input,textarea,select,[role="tab"],[contenteditable="true"]',
        )
      )
        return;
      e.preventDefault();
      latest.current?.(e.key === "ArrowRight" ? 1 : -1);
    };
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      const dx = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
      if (!dx || (!e.shiftKey && Math.abs(dx) <= Math.abs(e.deltaY) * 1.3))
        return;
      const now = performance.now();
      if (now - wheelLast > 180) {
        wheelDone = false;
        wheelSum = 0;
      }
      wheelLast = now;
      if (e.cancelable) e.preventDefault();
      if (wheelDone) return;
      wheelSum += dx * (e.deltaMode === 1 ? 16 : 1);
      if (Math.abs(wheelSum) > 44) {
        wheelDone = true;
        latest.current?.(wheelSum > 0 ? 1 : -1);
      }
    };
    const preventImageDrag = (e: DragEvent) => e.preventDefault();
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    el.addEventListener("click", click, true);
    el.addEventListener("keydown", keys);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("dragstart", preventImageDrag);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      el.removeEventListener("click", click, true);
      el.removeEventListener("keydown", keys);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("dragstart", preventImageDrag);
      delete el.dataset.swipe;
      delete el.dataset.dragging;
    };
  }, [ref, enabled]);
}
