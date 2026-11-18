import { useEffect, useRef } from "react";
export function Effects({
  cursor,
  reduced,
}: {
  cursor: boolean;
  reduced: boolean;
}) {
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("revealed"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
      },
      { threshold: 0.055, rootMargin: "0px 0px 24px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reduced]);
  useEffect(() => {
    const el = ring.current!;
    if (
      !cursor ||
      reduced ||
      !matchMedia("(hover:hover) and (pointer:fine)").matches
    ) {
      el.style.opacity = "0";
      return;
    }
    let tx = 0,
      ty = 0,
      x = 0,
      y = 0,
      raf = 0;
    const tick = () => {
      x += (tx - x) * 0.38;
      y += (ty - y) * 0.38;
      el.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.4)
        raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      const target = e.target as HTMLElement;
      const probe =
        !!target.closest("a,button,.scene-host") &&
        !target.closest("dialog") &&
        e.pointerType === "mouse";
      if (!probe) {
        el.style.opacity = "0";
        x = tx;
        y = ty;
        return;
      }
      el.style.opacity = "1";
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => {
      el.style.opacity = "0";
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    document.addEventListener("pointerdown", leave);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("pointerdown", leave);
      el.style.opacity = "0";
    };
  }, [cursor, reduced]);
  return <div className="cursor-ring" aria-hidden="true" ref={ring} />;
}
