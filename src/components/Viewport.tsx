import { useEffect, useRef, useState } from "react";
import {
  Box,
  Scan,
  Maximize2,
  Rotate3D,
  Pause,
  Play,
  RotateCcw,
  Download,
  Crosshair,
} from "lucide-react";
import type { StudioAPI, StudioOptions } from "../scene/studio";
import { Corners, Modal } from "./ui";

export function Viewport({
  reduced,
  expanded = false,
  active = true,
  onExpand,
}: {
  reduced: boolean;
  expanded?: boolean;
  active?: boolean;
  onExpand?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    api = useRef<StudioAPI | null>(null);
  const [activated, setActivated] = useState(
    () =>
      expanded ||
      (!matchMedia("(pointer: coarse), (max-width: 720px)").matches &&
        !(navigator as Navigator & { connection?: { saveData?: boolean } })
          .connection?.saveData),
  );
  const [wire, setWire] = useState(false),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "poster">("loading"),
    [mascot, setMascot] = useState(false);
  const options = useRef<StudioOptions>({ wire, paused, reduced, active });
  useEffect(() => {
    options.current = { wire, paused, reduced, active };
    api.current?.set(options.current);
  }, [wire, paused, reduced, active]);
  useEffect(() => {
    if (!activated) return;
    const el = host.current!;
    let gone = false,
      started = false;
    const mount = async () => {
      if (gone || started) return;
      started = true;
      try {
        const { createStudio } = await import("../scene/studio");
        if (gone) return;
        const instance = await createStudio(el, options.current, (v) => {
          if (!gone) setMascot(v);
        });
        if (gone) {
          instance.dispose();
          return;
        }
        api.current = instance;
        setStatus("ready");
      } catch {
        if (!gone) setStatus("poster");
      }
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          requestAnimationFrame(() => {
            if (gone) return;
            if ("requestIdleCallback" in window)
              window.requestIdleCallback(
                () => {
                  void mount();
                },
                { timeout: 1100 },
              );
            else void mount();
          });
        }
      },
      { rootMargin: "80px" },
    );
    io.observe(el);
    return () => {
      gone = true;
      io.disconnect();
      api.current?.dispose();
      api.current = null;
    };
  }, [activated]);
  const download = () => {
    const link = document.createElement("a");
    link.href =
      api.current?.snapshot() || `${import.meta.env.BASE_URL}art/identity.webp`;
    link.download = api.current
      ? "charon-artifact.png"
      : "charon-artifact.webp";
    link.click();
  };
  return (
    <div
      className={
        "viewport " + (expanded ? "expanded " : "") + (wire ? "wire " : "")
      }
      data-state={activated ? status : "idle"}
    >
      <div className="viewport-haze" aria-hidden="true" />
      <div className="orbit-floor" aria-hidden="true">
        <i />
        <i />
        <b />
      </div>
      <Corners />
      <div className="viewport-top mono">
        <span className="object-label">
          <span className="target-dot" />
          OBJECT — 001
        </span>
        <span className="render-status">
          <i />
          {!activated
            ? "STUDIO VIEW"
            : status === "poster"
              ? "STUDIO STILL"
              : status === "ready"
                ? "LIVE RENDER"
                : "PREVIEW"}
        </span>
      </div>
      <div className="object-caption mono" aria-hidden="true">
        {mascot ? "MASCOT" : "ALLOY"}
        <span> / 01</span>
        <i />
      </div>
      <img
        className={"artifact-poster " + (status === "ready" ? "hidden" : "")}
        src={`${import.meta.env.BASE_URL}art/identity.webp`}
        width="900"
        height="680"
        alt="Скульптурный серебристый знак Charon"
        fetchPriority="high"
      />
      <div
        className="scene-host"
        ref={host}
        tabIndex={!activated || status === "ready" ? 0 : -1}
        role={activated ? "group" : "button"}
        onClick={() => {
          if (!activated) setActivated(true);
        }}
        aria-label={
          activated
            ? "Интерактивный объект Charon. Перетаскивайте или вращайте стрелками клавиатуры. Пробел — пауза."
            : "Активировать интерактивный объект Charon"
        }
        onKeyDown={(e) => {
          const k = e.key;
          if (!activated && (k === "Enter" || k === " ")) {
            e.preventDefault();
            setActivated(true);
            return;
          }
          if (
            ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(k)
          ) {
            e.preventDefault();
            if (k === " ") setPaused((p) => !p);
            else
              api.current?.turn(
                k === "ArrowLeft" ? -0.18 : k === "ArrowRight" ? 0.18 : 0,
                k === "ArrowUp" ? -0.13 : k === "ArrowDown" ? 0.13 : 0,
              );
          }
        }}
      />
      <div className="viewport-bottom">
        {!activated ? (
          <button className="activate-3d" onClick={() => setActivated(true)}>
            <Box size={13} />
            Включить 3D
          </button>
        ) : (
          <div className="rotate-hint">
            <Rotate3D size={16} strokeWidth={1.4} />
            {status === "poster"
              ? "Студийный рендер"
              : status === "loading"
                ? "Подготовка сцены…"
                : "Вращайте объект"}
          </div>
        )}
        <div className="viewport-tools">
          {status === "ready" && (
            <>
              <button
                className={"scene-button " + (wire ? "selected" : "")}
                onClick={() => setWire((v) => !v)}
                aria-label={wire ? "Показать материал" : "Показать каркас"}
                title={wire ? "Материал" : "Каркас"}
                aria-pressed={wire}
              >
                {wire ? <Scan size={14} /> : <Box size={14} />}
              </button>
              <button
                className="scene-button motion-control"
                aria-label={
                  paused ? "Включить движение" : "Приостановить движение"
                }
                aria-pressed={paused}
                onClick={() => setPaused((v) => !v)}
                title={paused ? "Включить движение" : "Пауза"}
              >
                {paused ? <Play size={13} /> : <Pause size={13} />}
              </button>
            </>
          )}
          {expanded ? (
            <>
              {status === "ready" && (
                <button
                  className="scene-button"
                  title="Исходный ракурс"
                  aria-label="Исходный ракурс"
                  onClick={() => api.current?.reset()}
                >
                  <RotateCcw size={14} />
                </button>
              )}
              <button
                className="scene-button"
                title="Сохранить изображение"
                aria-label="Сохранить изображение"
                onClick={download}
              >
                <Download size={14} />
              </button>
            </>
          ) : (
            <button
              className="scene-button"
              aria-label="Развернуть 3D-сцену"
              onClick={onExpand}
              title="Развернуть сцену"
            >
              <Maximize2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export function StudioModal({
  onClose,
  reduced,
}: {
  onClose: () => void;
  reduced: boolean;
}) {
  return (
    <Modal
      onClose={onClose}
      className="studio-modal"
      title="Объект Charon"
      eyebrow="OBJECT VIEWER / 001"
    >
      <Viewport expanded reduced={reduced} />
      <div className="studio-foot">
        <Crosshair size={16} />
        <p>
          {__HAS_MASCOT__
            ? "Оригинальная GLB-модель в студийном освещении."
            : "Фирменный знак из серии Identity Objects. Место для оригинальной GLB-модели маскота готово."}
        </p>
        <span className="mono">CH—01</span>
      </div>
    </Modal>
  );
}
