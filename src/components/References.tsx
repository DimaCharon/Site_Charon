import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PageLead } from "./Showroom";
import { ProductArt } from "./Projects";
import { copy as w, projects } from "../config/site";
import { referenceIndex } from "../config/references";
import { briefHref } from "../config/routes";
export function References() {
  const items = referenceIndex();
  return (
    <section className="shell paper-view reference-room">
      <PageLead
        kicker={w["refs.eyebrow"]}
        title={w["refs.title"]}
        description={w["refs.intro"]}
      />
      <div className="room-index folio-code">
        <i />
        {w["refs.index"]} <b>/</b> {String(items.length).padStart(2, "0")}
      </div>
      <div className="ref-wall">
        {items.map((r, i) => {
          const project = projects.find((p) => p.id === r.projectId);
          return (
            <article
              key={r.id}
              className={"ref-sheet" + (i === 0 ? " lead-ref" : "")}
            >
              <a
                className={"ref-visual ref-" + r.id}
                href={r.href}
                aria-label={w["refs.live"] + " — " + r.title}
              >
                {r.image ? (
                  <img
                    src={r.image}
                    alt={r.alt}
                    width="800"
                    height="500"
                    loading={i ? "lazy" : "eager"}
                    style={{
                      objectFit: r.fit || "contain",
                      objectPosition: r.position,
                    }}
                  />
                ) : project ? (
                  <ProductArt
                    project={project}
                    index={projects.indexOf(project)}
                  />
                ) : null}
                <span className="ref-code mono" aria-hidden="true">
                  R / {String(i + 1).padStart(2, "0")}
                </span>
              </a>
              <div className="ref-description">
                <div className="folio-code">{r.category}</div>
                <h2>{r.title}</h2>
                <p>{r.description}</p>
                <small className="ref-credit">{r.credit}</small>
                <div className="ref-actions">
                  <a className="folio-inline" href={r.href}>
                    {w["refs.live"]}
                    <ArrowUpRight size={14} />
                  </a>
                  <a
                    className="like-link"
                    data-reference={r.id}
                    href={briefHref(r.id)}
                  >
                    {w["refs.similar"]}
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
