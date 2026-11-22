import { ProductSiteLink } from "./ProductSiteLink";
import { pageHref } from "../config/routes";
import { copy } from "../config/site";
import { useRailDrag } from "../hooks/gestures";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { projects, coverUrl, statusLabel, type Project } from "../config/site";
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
export function Status({
  project,
  words = copy,
}: {
  project: Project;
  words?: Record<string, string>;
}) {
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
      {statusLabel(project.status, words)}
    </span>
  );
}
export function ProductArt({
  project,
  index,
  previewSrc,
  words = copy,
}: {
  project: Project;
  index: number;
  previewSrc?: string;
  words?: Record<string, string>;
}) {
  return (
    <div
      className={
        "product-art product-" +
        project.art +
        " material-" +
        project.theme +
        (project.cover ? " with-cover" : "")
      }
    >
      <div className="art-grid" />
      <div className="art-topline mono">
        <span>
          {words["projects.text01"]} {String(index + 1).padStart(2, "0")}
        </span>
        <span>{project.category}</span>
      </div>
      {project.cover ? (
        <img
          className="project-cover"
          src={previewSrc || coverUrl(project.cover)}
          alt={project.cover.alt || project.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          width={1200}
          height={680}
          style={{
            objectFit: project.cover.fit,
            objectPosition: `${project.cover.x}% ${project.cover.y}%`,
          }}
        />
      ) : (
        <GenerativeArt kind={project.art} />
      )}
      <div className="project-hover-note">{project.details[0]}</div>
      <div className="art-bottomline mono">
        {project.caption ||
          (project.cover
            ? words["projects.photoCaption"]
            : project.art === "identity"
              ? words["projects.text02"]
              : project.art === "trading"
                ? words["projects.text03"]
                : words["projects.text04"])}
        <Plus size={11} />
      </div>
    </div>
  );
}
export function ProjectCard({
  p,
  i,
  words = copy,
  previewSrc,
  onOpen,
  pageLink = false,
}: {
  pageLink?: boolean;
  p: Project;
  i: number;
  words?: Record<string, string>;
  previewSrc?: string;
  onOpen: () => void;
}) {
  return (
    <article
      className="project-card"
      onPointerMove={tilt}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--rx", "0deg");
        e.currentTarget.style.setProperty("--ry", "0deg");
      }}
    >
      <ProductArt project={p} index={i} words={words} previewSrc={previewSrc} />
      <div className="project-info">
        <div className="card-statusline">
          <Status project={p} words={words} />
          {p.offer.sale !== "showcase" && p.offer.price ? (
            <strong>{p.offer.price}</strong>
          ) : p.offer.sale === "inquiry" ? (
            <span>{words["store.inquiryTag"]}</span>
          ) : p.offer.demo !== "none" ? (
            <span>
              <i />
              {words["store.demoTag"]}
            </span>
          ) : null}
        </div>
        <h3>
          {pageLink ? (
            <a href={pageHref("products/" + p.id)}>{p.name}</a>
          ) : (
            p.name
          )}
        </h3>
        <p>{p.short}</p>
        <ProductSiteLink p={p} words={words} prominent />
        <div className="card-links">
          {pageLink && (
            <a className="page-link" href={pageHref("products/" + p.id)}>
              {words["store.page"]}
              <ArrowUpRight size={15} />
            </a>
          )}
          <button
            className="project-link"
            onClick={onOpen}
            aria-label={words["projects.more"] + " " + p.name}
          >
            {words["projects.more"]}
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}
export function ProjectDossier({
  p,
  index,
  words = copy,
  previewSrc,
}: {
  p: Project;
  index: number;
  words?: Record<string, string>;
  previewSrc?: string;
}) {
  return (
    <>
      {" "}
      <ProductArt
        project={p}
        index={index}
        words={words}
        previewSrc={previewSrc}
      />
      <div className="dossier-meta">
        <Status project={p} words={words} />
        <span className="mono">{p.category}</span>
      </div>
      <p className="dossier-text">{p.description}</p>
      <ProductSiteLink p={p} words={words} prominent />
      <h3 className="sub-label mono" hidden={!p.details.length}>
        {words["projects.text05"]}
      </h3>
      <ul className="detail-list">
        {p.details.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      <div className="tag-row">
        {p.tags.map((tag, i) => (
          <span key={i}>{tag}</span>
        ))}
      </div>
    </>
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
      eyebrow={`${copy["projects.dossier"]} / ${String(index + 1).padStart(2, "0")}`}
      onClose={onClose}
      className="project-modal"
      onStep={projects.length > 1 ? onStep : undefined}
      page={{ index, total: projects.length }}
    >
      <ProjectDossier p={p} index={index} />
      <a className="page-link dossier-page" href={pageHref("products/" + p.id)}>
        {copy["store.page"]}
        <ArrowUpRight size={15} />
      </a>
    </Modal>
  );
}
export function Projects({ onOpen }: { onOpen: (index: number) => void }) {
  const rail = useRef<HTMLDivElement>(null),
    [range, setRange] = useState({ first: 0, last: 1, end: false });
  useRailDrag(rail);
  useEffect(() => {
    const el = rail.current;
    if (!el || !projects.length) return;
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
    const el = rail.current;
    if (!el || !projects.length) return;
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
        <SectionLabel num={copy["projects.number"]}>
          {copy["projects.text06"]}
        </SectionLabel>
        <div className="section-heading-row reveal">
          <div>
            <h2 id="projects-title">
              {copy["projects.title"]}
              <span className="accent">{copy["projects.endMark"]}</span>
            </h2>
            <p className="section-intro">{copy["projects.intro"]}</p>
          </div>
          {projects.length > 0 && (
            <div className="rail-nav">
              <a className="catalog-hop" href={pageHref("products")}>
                {copy["store.catalogLink"]}
                <ArrowUpRight size={14} />
              </a>
              <span className="mono">
                {String(range.first + 1).padStart(2, "0")}
                <b> / {String(projects.length).padStart(2, "0")}</b>
              </span>
              <button
                className="icon-button"
                aria-label={copy["projects.text07"]}
                disabled={range.first === 0}
                onClick={() => go(-1)}
              >
                <ArrowLeft size={16} />
              </button>
              <button
                className="icon-button"
                aria-label={copy["projects.text08"]}
                disabled={range.end}
                onClick={() => go(1)}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
        {!projects.length && (
          <div className="empty-projects">{copy["projects.empty"]}</div>
        )}
        <div
          className="project-rail reveal drag-rail"
          ref={rail}
          role="region"
          aria-label={copy["projects.text09"]}
          tabIndex={projects.length ? 0 : -1}
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
            <ProjectCard
              key={p.id}
              pageLink
              p={p}
              i={i}
              onOpen={() => onOpen(i)}
            />
          ))}
        </div>
        <div className="rail-bottom" hidden={!projects.length}>
          <span className="rail-gesture">{copy["projects.text10"]}</span>
          <div className="rail-track">
            <i
              style={{
                left: `${(range.first / Math.max(1, projects.length)) * 100}%`,
                width: `${((range.last - range.first + 1) / Math.max(1, projects.length)) * 100}%`,
              }}
            />
          </div>
          <span className="mono">
            {copy["projects.text11"]} {String(projects.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  );
}
