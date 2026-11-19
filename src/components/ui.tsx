import { usePagingGesture } from "../hooks/gestures";
import { useEffect, useId, useRef, type ReactNode } from "react";
import {
  X,
  ArrowLeft,
  ArrowRight,
  MoveHorizontal,
  Cpu,
  Braces,
  Activity,
  Layers3,
  PenTool,
  Workflow,
  Aperture,
  FlaskConical,
} from "lucide-react";
import type { Field } from "../config/site";

export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="m27.1 2.7 9.8 9.8-7.2 7.1-7.2-7.2h-7.1l-5.1 5.1v5.2l5.1 5.1h7.1l7.2-7.2 7.2 7.1-9.8 9.8H11.3L1.1 27.3V12.9L11.3 2.7z"
      />
      <path d="m29.1 4.8 5.7 5.8-1.5 1.5-5.8-5.8z" fill="var(--bg,#101114)" />
    </svg>
  );
}
const symbols = {
  ai: Cpu,
  code: Braces,
  trading: Activity,
  product: Layers3,
  design: PenTool,
  automation: Workflow,
  technology: Aperture,
  experiments: FlaskConical,
};
export function Glyph({
  kind,
  size = 20,
  className = "",
}: {
  kind: Field;
  size?: number;
  className?: string;
}) {
  const Icon = symbols[kind];
  return (
    <Icon
      size={size}
      strokeWidth={1.45}
      className={className}
      aria-hidden="true"
    />
  );
}
export function SectionLabel({
  num,
  children,
}: {
  num: string;
  children: ReactNode;
}) {
  return (
    <div className="section-label mono">
      <span className="section-number">{num}</span>
      <span className="label-rule" />
      {children}
    </div>
  );
}
export function Corners() {
  return (
    <div className="corners" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  className = "",
  eyebrow,
  onStep,
  page,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
  eyebrow?: string;
  onStep?: (delta: number) => void;
  page?: { index: number; total: number };
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  usePagingGesture(ref, onStep);
  useEffect(() => {
    if (page && ref.current) ref.current.scrollTop = 0;
  }, [page?.index]);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={"modal " + className}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-top">
        <span className="mono">{eyebrow || "CHARON / IDENTITY SYSTEM"}</span>
        <button
          autoFocus
          className="icon-button"
          aria-label="Закрыть окно"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </div>
      <h2 id={id} className="modal-title">
        {title}
      </h2>
      {children}
      {page && onStep && (
        <div className="slide-footer">
          <span>
            <MoveHorizontal size={14} />
            Листайте в сторону
          </span>
          <div>
            <button
              aria-label="Предыдущий слайд"
              className="plain-icon"
              onClick={() => onStep(-1)}
            >
              <ArrowLeft size={14} />
            </button>
            <span className="mono" role="status">
              {String(page.index + 1).padStart(2, "0")} /{" "}
              {String(page.total).padStart(2, "0")}
            </span>
            <button
              aria-label="Следующий слайд"
              className="plain-icon"
              onClick={() => onStep(1)}
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
export function Magnetic({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={"button magnetic " + className}
      onPointerMove={(e) => {
        if (
          e.pointerType !== "mouse" ||
          document.documentElement.dataset.motion === "reduced"
        )
          return;
        const b = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty(
          "--mx",
          `${(e.clientX - b.left - b.width / 2) * 0.045}px`,
        );
        e.currentTarget.style.setProperty(
          "--my",
          `${(e.clientY - b.top - b.height / 2) * 0.09}px`,
        );
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--mx", "0px");
        e.currentTarget.style.setProperty("--my", "0px");
      }}
    >
      {children}
    </a>
  );
}
