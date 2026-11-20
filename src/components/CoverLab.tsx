import { useId, useMemo, useRef, useState, type Ref } from "react";
import { ArrowUpRight, Check, Download, SlidersHorizontal } from "lucide-react";
import { copy as w } from "../config/site";
import { pageHref } from "../config/routes";
import { PageLead } from "./Showroom";
type Material = "graphite" | "silver" | "lilac";
type Form = "orbit" | "wave" | "fold";
const palettes = {
  graphite: {
    paper: "#1c2025",
    wash: "#393e49",
    ink: "#f1edf3",
    line: "#bab9cf",
    dim: "#c2c2ce",
  },
  silver: {
    paper: "#d4d6d3",
    wash: "#efefeb",
    ink: "#20252c",
    line: "#475363",
    dim: "#414850",
  },
  lilac: {
    paper: "#b5a7cf",
    wash: "#dcd3e8",
    ink: "#292636",
    line: "#484157",
    dim: "#473e54",
  },
};
const two = (n: number) => n.toFixed(1);
function patterns(form: Form, density: number) {
  const lines = [];
  for (let i = 0; i < density; i++) {
    const s = i / (density - 1);
    let d = "";
    const n = form === "fold" ? 10 : 76;
    for (let j = 0; j <= n; j++) {
      const t = j / n,
        a = t * Math.PI * 2,
        b = s * Math.PI * 2;
      let x, y;
      if (form === "orbit") {
        const r = 214 + 57 * Math.cos(b),
          u = r * Math.cos(a),
          v = r * 0.57 * Math.sin(a) + 83 * Math.sin(b);
        x = 1068 + u * 0.93 - v * 0.51;
        y = 379 + u * 0.39 + v * 0.94 + 27 * Math.sin(a * 2 + b * 0.5);
      } else if (form === "wave") {
        x = 717 + 675 * t;
        y =
          409 +
          210 * (s - 0.5) -
          135 * Math.exp(-15 * (t - 0.57) ** 2) * Math.cos((s + t) * 3.7) +
          24 * Math.sin(t * 13 + s * 5) -
          100 * t;
      } else {
        const r = 185 + 79 * Math.sin(a * 3 + b * 0.43),
          u = r * Math.cos(a + 0.68 * s),
          v = r * Math.sin(a + 0.68 * s);
        x = 1054 + u * 1.17 + 0.47 * v;
        y = 389 + 0.71 * v + 58 * Math.cos(b);
      }
      d += (j ? " L" : "M") + two(x) + " " + two(y);
    }
    if (form !== "wave") d += " Z";
    lines.push(d);
  }
  return lines;
}
export function CoverPoster({
  title,
  material = "lilac",
  form = "orbit",
  density = 38,
  svgRef,
}: {
  title: string;
  material?: Material;
  form?: Form;
  density?: number;
  svgRef?: Ref<SVGSVGElement>;
}) {
  const p = palettes[material],
    id = "cover" + useId().replace(/[^a-z0-9_-]/gi, ""),
    paths = useMemo(() => patterns(form, density), [form, density]);
  const label = title.trim() || w["lab.sample"];
  return (
    <svg
      ref={svgRef}
      className="lab-poster"
      role="img"
      aria-label={w["lab.preview"] + ": " + label}
      viewBox="0 0 1600 900"
      xmlns="http://www.w3.org/2000/svg"
      width="1600"
      height="900"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop stopColor={p.paper} />
          <stop offset="1" stopColor={p.wash} />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={"url(#" + id + ")"} />
      <g fill="none" stroke={p.line} opacity=".17" strokeWidth="1">
        {[68, 404, 800, 1196, 1532].map((x, i) => (
          <path key={i} d={`M${x} 64V836`} />
        ))}
        <path d="M68 104H1532 M68 698H1532 M68 808H1532" />
      </g>
      <g fill={p.dim} fontFamily="monospace" fontSize="22" letterSpacing="3">
        <text x="72" y="83">
          {w["lab.imprint"]}
        </text>
        <text x="1528" y="83" textAnchor="end">
          {["orbit", "wave", "fold"].indexOf(form) + 1} / 3
        </text>
      </g>
      <g fill="none" stroke={p.line} strokeWidth="1.85">
        {paths.map((d, i) => (
          <path key={i} opacity={0.65 + (0.35 * i) / paths.length} d={d} />
        ))}
      </g>
      <g fill={p.ink}>
        <path d="M74 207v-31h31v5H79v26z" />
        <circle cx="81" cy="227" r="4" />
        <text
          x="69"
          y="665"
          fontSize={Math.min(
            138,
            Math.floor(1650 / Math.max(1, [...label].length)),
          )}
          fontFamily="Arial, sans-serif"
          letterSpacing="-3"
        >
          {label}
        </text>
      </g>
      <g fill={p.dim} fontFamily="monospace" fontSize="20" letterSpacing="2">
        <text x="72" y="758">
          {w["lab.series"]}
        </text>
        <text x="1528" y="758" textAnchor="end">
          {w["lab." + material]} / {w["lab." + form]}
        </text>
      </g>
    </svg>
  );
}
export function LabInvitation() {
  return (
    <section
      className="shell lab-invitation"
      aria-labelledby="lab-invite-title"
    >
      <a
        className="lab-example-art"
        href={pageHref("lab")}
        aria-label={w["lab.start"]}
      >
        <CoverPoster title={w["lab.sample"]} density={24} />
      </a>
      <div>
        <div className="folio-code">
          <i />
          {w["store.examples"]}
        </div>
        <h2 id="lab-invite-title">{w["lab.teaser"]}</h2>
        <p>{w["lab.intro"]}</p>
        <a className="folio-inline" href={pageHref("lab")}>
          {w["lab.start"]}
          <ArrowUpRight size={16} />
        </a>
      </div>
    </section>
  );
}
export function CoverLab() {
  const [title, setTitle] = useState(w["lab.sample"]),
    [material, setMat] = useState<Material>("lilac"),
    [form, setForm] = useState<Form>("orbit"),
    [density, setDensity] = useState(38),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const ref = useRef<SVGSVGElement>(null);
  const exportPNG = async () => {
    if (!ref.current || busy) return;
    setBusy(true);
    setNotice("");
    let src = "";
    try {
      const el = ref.current.cloneNode(true) as SVGSVGElement;
      el.removeAttribute("class");
      const serial = new XMLSerializer().serializeToString(el);
      src = URL.createObjectURL(
        new Blob([serial], { type: "image/svg+xml;charset=utf-8" }),
      );
      const im = new Image();
      im.src = src;
      await im.decode();
      const c = document.createElement("canvas");
      c.width = 1600;
      c.height = 900;
      const ctx = c.getContext("2d");
      if (!ctx) throw Error();
      ctx.drawImage(im, 0, 0, 1600, 900);
      const b = await new Promise<Blob>((res, rej) =>
        c.toBlob((b) => (b ? res(b) : rej(Error())), "image/png"),
      );
      const url = URL.createObjectURL(b),
        a = document.createElement("a");
      a.href = url;
      a.download = "charon-cover.png";
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2500);
      setNotice(w["lab.success"]);
    } catch {
      setNotice(w["lab.error"]);
    } finally {
      if (src) URL.revokeObjectURL(src);
      setBusy(false);
    }
  };
  return (
    <section className="shell paper-view lab-view">
      <PageLead
        kicker={w["lab.eyebrow"]}
        title={w["lab.title"]}
        description={w["lab.intro"]}
      />
      <div className="lab-bench">
        <div className="lab-proof">
          <CoverPoster
            svgRef={ref}
            title={title}
            material={material}
            form={form}
            density={density}
          />
          <div className="lab-proof-caption">
            <span>{w["lab.preview"]}</span>
            <span className="folio-code">{w["lab.format"]}</span>
          </div>
        </div>
        <div className="lab-tools">
          <h2>
            <SlidersHorizontal size={16} />
            {w["lab.controls"]}
          </h2>
          <label>
            <span>{w["lab.titleInput"]}</span>
            <input
              maxLength={48}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setNotice("");
              }}
            />
          </label>
          <fieldset>
            <legend>{w["lab.material"]}</legend>
            <div className="lab-choices">
              {(Object.keys(palettes) as Material[]).map((k) => (
                <button
                  key={k}
                  aria-pressed={k === material}
                  onClick={() => {
                    setMat(k);
                    setNotice("");
                  }}
                >
                  <i style={{ background: palettes[k].paper }} />
                  {w["lab." + k]}
                  {k === material && <Check size={12} />}
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            <span>{w["lab.form"]}</span>
            <select
              value={form}
              onChange={(e) => {
                setForm(e.target.value as Form);
                setNotice("");
              }}
            >
              {(["orbit", "wave", "fold"] as const).map((k) => (
                <option key={k} value={k}>
                  {w["lab." + k]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>
              {w["lab.density"]} <output>{density}</output>
            </span>
            <input
              type="range"
              aria-label={w["lab.density"]}
              min={12}
              max={60}
              value={density}
              onChange={(e) => {
                setDensity(Number(e.target.value));
                setNotice("");
              }}
            />
          </label>
          <button
            className="button primary"
            disabled={busy}
            onClick={() => void exportPNG()}
          >
            <Download size={15} />
            {w[busy ? "lab.busy" : "lab.save"]}
          </button>
          <p className="lab-local">{w["lab.local"]}</p>
          <p className="lab-notice" role="status">
            {notice}
          </p>
        </div>
      </div>
    </section>
  );
}
