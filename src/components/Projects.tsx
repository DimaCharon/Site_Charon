import { useRailDrag } from "../hooks/gestures";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { projects, type Project } from "../config/site";
import { GenerativeArt } from "./Art";
import { SectionLabel, Modal } from "./ui";
export function tilt(e: PointerEvent<HTMLElement>) {
  if (
    e.pointerType !== "mouse" ||
    document.documentElement.dataset.motion === "reduced"
  )
    return;
  const b = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty(
    "--rx",
    `${(-(e.clientY - b.top - b.height / 2) / b.height) * 3}deg`,
  );
  e.currentTarget.style.setProperty(
    "--ry",
    `${((e.clientX - b.left - b.width / 2) / b.width) * 4}deg`,
  );
}
function Status({ project }: { project: Project }) {
  return (
    <span
      className={
        "project-status " +
        (project.status === "Активный проект"
          ? "live"
          : project.status === "Концепция"
            ? "concept"
            : "working")
      }
    >
      <i />
      {project.status}
    </span>
  );
}
function ProductArt({ project, index }: { project: Project; index: number }) {
  return (
    <div className={"product-art product-" + project.art}>
      <div className="art-grid" />
      <div className="art-topline mono">
        <span>CH / {String(index + 1).padStart(2, "0")}</span>
        <span>{project.category}</span>
      </div>
      <GenerativeArt kind={project.art} />
      <div className="project-hover-note">{project.details[0]}</div>
      <div className="art-bottomline mono">
        {project.art === "identity"
          ? "IDENTITY SERIES"
          : project.art === "trading"
            ? "DATA LANDSCAPE · ÉTUDE"
            : "EXPERIMENTAL STUDY"}
        <Plus size={11} />
      </div>
    </div>
  );
}
export function ProjectModal({
  index,
  onStep,
  onClose,
}: {
  index: number;
  onStep: (delta: number) => void;
  onClose: () => void;
}) {
  const p = projects[index];
  return (
    <Modal
      title={p.name}
      eyebrow={`PROJECT DOSSIER / 0${index + 1}`}
      onClose={onClose}
      className="project-modal"
      onStep={onStep}
      page={{ index, total: projects.length }}
    >
      <ProductArt project={p} index={index} />
      <div className="dossier-meta">
        <Status project={p} />
        <span className="mono">{p.category}</span>
      </div>
      <p className="dossier-text">{p.description}</p>
      <h3 className="sub-label mono">В ФОКУСЕ ПРОЕКТА</h3>
      <ul className="detail-list">
        {p.details.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div className="tag-row">
        {p.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </Modal>
  );
}
export function Projects({ onOpen }: { onOpen: (index: number) => void }) {
  const rail = useRef<HTMLDivElement>(null),
    [range, setRange] = useState({ first: 0, last: 1, end: false });
  useRailDrag(rail);
  useEffect(() => {
    const el = rail.current!;
    let raf = 0;
    const update = () => {
      raf = 0;
      const items = Array.from(el.children) as HTMLElement[],
        left = el.getBoundingClientRect().left,
        right = left + el.clientWidth;
      const seen = items
        .map((s, i) => {
          const r = s.getBoundingClientRect();
          return r.left < right - 60 && r.right > left + 60 ? i : -1;
        })
        .filter((i) => i !== -1);
      setRange({
        first: seen[0] ?? 0,
        last: seen.at(-1) ?? 0,
        end: el.scrollLeft >= el.scrollWidth - el.clientWidth - 3,
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    el.addEventListener("scroll", schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    update();
    return () => {
      el.removeEventListener("scroll", schedule);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  const go = (delta: number) => {
    const el = rail.current!;
    const item = el.children[
      Math.max(0, Math.min(projects.length - 1, range.first + delta))
    ] as HTMLElement;
    el.scrollTo({
      left: item.offsetLeft - (el.firstElementChild as HTMLElement).offsetLeft,
      behavior:
        document.documentElement.dataset.motion === "reduced"
          ? "instant"
          : "smooth",
    });
  };
  return (
    <section
      className="section projects-section"
      id="projects"
      aria-labelledby="projects-title"
    >
      <div className="shell">
        <SectionLabel num="02">ПРОЕКТНЫЙ АРХИВ</SectionLabel>
        <div className="section-heading-row reveal">
          <div>
            <h2 id="projects-title">
              То, что я создаю<span className="accent">.</span>
            </h2>
            <p className="section-intro">
              Самостоятельные продукты, рабочие прототипы и идеи на проверке.
            </p>
          </div>
          <div className="rail-nav">
            <span className="mono">
              0{range.first + 1}
              <b> / 0{projects.length}</b>
            </span>
            <button
              className="icon-button"
              aria-label="Предыдущий проект"
              disabled={range.first === 0}
              onClick={() => go(-1)}
            >
              <ArrowLeft size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Следующий проект"
              disabled={range.end}
              onClick={() => go(1)}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div
          className="project-rail reveal drag-rail"
          ref={rail}
          role="region"
          aria-label="Горизонтальная галерея проектов"
          tabIndex={0}
          onKeyDown={(e) => {
            if (
              e.target === e.currentTarget &&
              ["ArrowRight", "ArrowLeft"].includes(e.key)
            ) {
              e.preventDefault();
              go(e.key === "ArrowRight" ? 1 : -1);
            }
          }}
        >
          {projects.map((p, i) => (
            <article
              className="project-card"
              key={p.name}
              onPointerMove={tilt}
              onPointerLeave={(e) => {
                e.currentTarget.style.setProperty("--rx", "0deg");
                e.currentTarget.style.setProperty("--ry", "0deg");
              }}
            >
              <ProductArt project={p} index={i} />
              <div className="project-info">
                <Status project={p} />
                <h3>{p.name}</h3>
                <p>{p.short}</p>
                <button
                  className="project-link"
                  onClick={() => onOpen(i)}
                  aria-label={"Подробнее о проекте " + p.name}
                >
                  Подробнее о проекте
                  <ArrowUpRight size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="rail-bottom">
          <span className="rail-gesture">← Листайте в сторону →</span>
          <div className="rail-track">
            <i
              style={{
                left: `${(range.first / projects.length) * 100}%`,
                width: `${((range.last - range.first + 1) / projects.length) * 100}%`,
              }}
            />
          </div>
          <span className="mono">
            SELECTED WORK / {String(projects.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  );
}
