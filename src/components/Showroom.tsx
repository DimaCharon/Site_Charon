import { useState, useRef, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Layers3,
  FlaskConical,
  Send,
  SquareArrowOutUpRight,
} from "lucide-react";
import {
  copy as w,
  projects,
  interests,
  statusLabel,
  type Project,
} from "../config/site";
import { pageHref } from "../config/routes";
import {
  publishedProfile,
  safeContact,
  type ContactKey,
} from "../config/profile";
import { ProductArt, Status } from "./Projects";
import { GenerativeArt } from "./Art";
import { usePagingGesture } from "../hooks/gestures";
const pad = (i: number) => String(i).padStart(2, "0");
export function PageLead({
  kicker,
  title,
  description,
  back = "",
  backLabel = w["store.home"],
}: {
  kicker: string;
  title: string;
  description?: string;
  back?: string;
  backLabel?: string;
}) {
  return (
    <div className="page-lead">
      <a className="folio-back" href={pageHref(back)}>
        <ArrowLeft size={14} />
        {backLabel}
      </a>
      <div className="folio-code">
        <i />
        {kicker}
      </div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
export function Catalog() {
  const [status, setStatus] = useState("all"),
    [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase("ru");
  const result = projects
    .map((p, i) => ({ p, i }))
    .filter(
      ({ p }) =>
        (status === "all" || p.status === status) &&
        (!needle ||
          [
            p.name,
            p.short,
            p.category,
            p.offer.audience,
            p.offer.result,
            ...p.tags,
          ].some((v) => v.toLocaleLowerCase("ru").includes(needle))),
    );
  return (
    <section className="shell paper-view">
      <PageLead
        kicker={w["store.catalogKicker"]}
        title={w["store.catalog"]}
        description={w["store.catalogIntro"]}
      />
      <div className="catalog-tools">
        <div
          className="shelf-filters"
          role="group"
          aria-label={w["store.filters"]}
        >
          <SlidersHorizontal size={15} />
          {(["all", "Активный проект", "Разработка", "Концепция"] as const).map(
            (s) => (
              <button
                key={s}
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
              >
                {s === "all" ? w["store.all"] : statusLabel(s)}
              </button>
            ),
          )}
        </div>
        <label className="shelf-search">
          <Search size={15} />
          <input
            aria-label={w["store.search"]}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={w["store.placeholder"]}
          />
        </label>
      </div>
      <div className="shelf-count folio-code" role="status">
        {w["store.results"]}
        <b>/</b>
        {pad(result.length)}
      </div>
      <div className="shelf-list">
        {result.map(({ p, i }) => (
          <a
            className="shelf-row"
            key={p.id}
            href={pageHref("products/" + p.id)}
          >
            <span className="shelf-index mono">{pad(i + 1)}</span>
            <ProductArt project={p} index={i} />
            <div className="shelf-body">
              <div className="folio-code">{p.category}</div>
              <h2>{p.name}</h2>
              <p>{p.short}</p>
            </div>
            <div className="shelf-end">
              <Status project={p} />
              {p.offer.sale !== "showcase" && p.offer.price && (
                <span>{p.offer.price}</span>
              )}
            </div>
            <ArrowUpRight className="shelf-arrow" size={20} />
          </a>
        ))}
      </div>
      {!result.length && (
        <div className="empty-projects">
          <p>{projects.length ? w["store.notFound"] : w["projects.empty"]}</p>
          {(status !== "all" || query) && (
            <button
              className="folio-inline"
              onClick={() => {
                setStatus("all");
                setQuery("");
              }}
            >
              {w["store.reset"]}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}
function AccessLink({
  url,
  children,
  primary = false,
  external = false,
}: {
  url: string;
  children: ReactNode;
  primary?: boolean;
  external?: boolean;
}) {
  return (
    <a
      href={url}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={"button " + (primary ? "primary" : "secondary")}
    >
      {children}
      <ArrowUpRight size={15} />
    </a>
  );
}
export function ProductAccess({ p }: { p: Project }) {
  const o = p.offer,
    channel = (["telegram", "email", "social", "github"] as ContactKey[])
      .map((key) => ({
        key,
        href: safeContact(key, publishedProfile.contacts[key]),
      }))
      .find((v) => v.href),
    demo =
      o.demo === "lab" ? pageHref("lab") : o.demo === "link" ? o.demoUrl : "";
  return (
    <aside className="access-slip" id="access">
      <div className="slip-ticks" aria-hidden="true" />
      <div className="folio-code">
        <ShoppingBag size={13} />
        {w["store.access"]}
      </div>
      {o.sale !== "showcase" && o.price ? (
        <>
          <span className="slip-label">{w["store.price"]}</span>
          <strong className="slip-price">{o.price}</strong>
        </>
      ) : (
        <h2>{o.sale === "inquiry" ? w["store.ask"] : p.name}</h2>
      )}
      <p>
        {o.sale === "checkout"
          ? w["store.external"]
          : o.sale === "inquiry"
            ? w["store.inquiry"]
            : w["store.closed"]}
      </p>
      {o.sale !== "showcase" && o.terms && (
        <p className="slip-terms">{o.terms}</p>
      )}
      <div className="slip-actions">
        {o.sale === "checkout" && (
          <AccessLink url={o.buyUrl} primary external>
            {w["store.buy"]}
          </AccessLink>
        )}
        {o.sale === "inquiry" && channel?.href && (
          <AccessLink
            url={
              channel.key === "email"
                ? channel.href + "?subject=" + encodeURIComponent(p.name)
                : channel.href
            }
            primary
            external={channel.key !== "email"}
          >
            <Send size={14} />
            {w["store.ask"]}
          </AccessLink>
        )}
        {demo && (
          <AccessLink
            url={demo}
            primary={o.sale === "showcase"}
            external={o.demo === "link"}
          >
            {w["store.demo"]}
          </AccessLink>
        )}
        {!demo && o.sale === "showcase" && (
          <a className="folio-inline" href={pageHref("products")}>
            {w["store.toProducts"]}
            <ArrowRight size={14} />
          </a>
        )}
      </div>
      {o.sale === "checkout" && (
        <small className="checkout-host">
          <SquareArrowOutUpRight size={12} />
          {new URL(o.buyUrl).hostname}
        </small>
      )}
    </aside>
  );
}
export function ProductPage({ p }: { p: Project }) {
  const index = projects.findIndex((x) => x.id === p.id);
  const surface = useRef<HTMLDivElement>(null);
  const neighbor = (d: number) =>
    projects[(index + d + projects.length) % projects.length];
  const step = (d: number) =>
    location.assign(pageHref("products/" + neighbor(d).id));
  usePagingGesture(surface, projects.length > 1 ? step : undefined);
  return (
    <article className="shell paper-view product-sheet">
      <div className="sheet-opening">
        <PageLead
          back="products"
          backLabel={w["store.toProducts"]}
          kicker={
            w["store.index"] + " / " + pad(index + 1) + " — " + p.category
          }
          title={p.name}
          description={p.short}
        />
        <div className="sheet-object" ref={surface}>
          <ProductArt project={p} index={index} />
        </div>
      </div>
      <div className="sheet-grid">
        <div className="sheet-brief">
          <div className="sheet-meta">
            <span className="sr-only">{w["store.stage"]}: </span>
            <Status project={p} />
            {p.tags.map((tag, i) => (
              <span key={i}>{tag}</span>
            ))}
          </div>
          {[
            [w["store.audience"], p.offer.audience],
            [w["store.result"], p.offer.result],
            [w["store.approach"], p.description],
          ]
            .filter((v) => v[1])
            .map(([title, text], i) => (
              <section className="brief-row" key={i}>
                <h2>{title}</h2>
                <p>{text}</p>
              </section>
            ))}
          {p.details.length > 0 && (
            <section className="brief-row">
              <h2>{w["projects.text05"]}</h2>
              <ul>
                {p.details.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}
          {p.offer.docsUrl && (
            <a
              href={p.offer.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="folio-inline"
            >
              <BookOpen size={14} />
              {w["store.docs"]}
              <ArrowUpRight size={14} />
            </a>
          )}
        </div>
        <ProductAccess p={p} />
      </div>
      {projects.length > 1 && (
        <nav className="sheet-neighbors" aria-label={w["store.catalog"]}>
          <a href={pageHref("products/" + neighbor(-1).id)}>
            <small>
              <ArrowLeft size={13} />
              {w["store.prev"]}
            </small>
            <strong>{neighbor(-1).name}</strong>
          </a>
          <a href={pageHref("products/" + neighbor(1).id)}>
            <small>
              {w["store.next"]}
              <ArrowRight size={13} />
            </small>
            <strong>{neighbor(1).name}</strong>
          </a>
        </nav>
      )}
    </article>
  );
}
export function Manual({ updates = false }: { updates?: boolean }) {
  return (
    <section className="shell paper-view manual-view">
      <PageLead
        kicker={w[updates ? "library.updatesKicker" : "library.guideKicker"]}
        title={w[updates ? "library.updates" : "library.guide"]}
        description={w[updates ? "library.updatesIntro" : "library.guideIntro"]}
      />
      <div className="manual-rows">
        {[1, 2, 3].map((i) => (
          <section key={i}>
            <span className="folio-code">
              {updates ? w["library.version" + i] : pad(i)}
            </span>
            <div>
              <h2>{w["library." + (updates ? "change" : "guide") + i]}</h2>
              <p>
                {w["library." + (updates ? "change" : "guide") + i + "Text"]}
              </p>
              {!updates && i === 2 && (
                <a className="folio-inline" href={pageHref("lab")}>
                  <FlaskConical size={15} />
                  {w["lab.start"]}
                  <ArrowUpRight size={13} />
                </a>
              )}
              {!updates && i === 3 && (
                <a className="folio-inline" href={pageHref("products")}>
                  {w["store.catalog"]}
                  <ArrowRight size={13} />
                </a>
              )}
            </div>
          </section>
        ))}
      </div>
      {updates && (
        <a
          className="folio-inline"
          href="https://github.com/DimaCharon/Site_Charon"
          rel="noopener noreferrer"
          target="_blank"
        >
          <Layers3 size={14} />
          {w["library.source"]}
          <ArrowUpRight size={13} />
        </a>
      )}
    </section>
  );
}
export function NotePage({ index }: { index: number }) {
  const n = interests[index];
  return (
    <article className="shell paper-view note-view">
      <PageLead
        back="journal"
        backLabel={w["library.allNotes"]}
        kicker={w["library.notesKicker"] + " / " + pad(index + 1)}
        title={n.title}
        description={n.text}
      />
      <div className="note-page-grid">
        <div className="study-art">
          <GenerativeArt kind={n.kind} />
        </div>
        <div>
          <div className="folio-code">{w["interests.text04"]}</div>
          <h2>{n.question}</h2>
          <p>{n.note}</p>
          <div className="note-imprint">
            {publishedProfile.name}
            <span />
            {w["interests.text05"]}
          </div>
        </div>
      </div>
      <a className="folio-inline" href={pageHref("journal")}>
        {w["library.allNotes"]}
        <ArrowRight size={14} />
      </a>
    </article>
  );
}
