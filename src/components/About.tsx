import { copy } from "../config/site";
import { usePagingGesture } from "../hooks/gestures";
import { useRef, useState } from "react";
import {
  ScanLine,
  LockKeyhole,
  ArrowDownRight,
  Fingerprint as FingerprintIcon,
} from "lucide-react";
import { directions } from "../config/site";
import { Glyph, SectionLabel } from "./ui";
import { Fingerprint } from "./Art";
export function About({ name }: { name: string }) {
  const [selected, setSelected] = useState(0);
  const fields = useRef<HTMLDivElement>(null);
  usePagingGesture(fields, (d) =>
    setSelected((i) => (i + d + directions.length) % directions.length),
  );
  const dir = directions[selected];
  return (
    <section
      className="section about-section shell"
      id="about"
      aria-labelledby="about-title"
    >
      <div className="about-grid">
        <div className="about-copy reveal">
          <SectionLabel num={copy["about.number"]}>
            {copy["about.text01"]}
          </SectionLabel>
          <h2 id="about-title">
            {copy["about.title"]}
            <span className="accent">{copy["about.endMark"]}</span>
          </h2>
          <p className="about-intro">
            {copy["about.lead1"]} <em>{copy["about.lead2"]}</em>{" "}
            {copy["about.lead3"]}
          </p>
          <p className="body-copy">{copy["about.description"]}</p>
        </div>
        <div className="identity-card reveal">
          <div className="id-mesh" />
          <Fingerprint />
          <div className="id-top">
            <span className="mono">
              <ScanLine size={15} />
              {copy["about.text02"]}
            </span>
            <LockKeyhole
              size={12}
              className="profile-seal"
              aria-label={copy["about.text03"]}
            />
          </div>
          <div className="id-name">{name}</div>
          <div className="id-role">{copy["about.role"]}</div>
          <div className="id-bottom">
            <span className="mono">
              <span className="id-square" />
              {copy["about.text04"]}
            </span>
            <div className="barcode" aria-hidden="true" />
          </div>
          <span className="id-corner" aria-hidden="true" />
        </div>
      </div>
      <div className="direction-console reveal" ref={fields}>
        <div className="direction-heading mono">
          <FingerprintIcon size={13} />
          {copy["about.text05"]}
          <span>{copy["about.text06"]}</span>
        </div>
        <div
          className="direction-tabs"
          role="tablist"
          aria-label={copy["about.text07"]}
        >
          {directions.map((d, i) => (
            <button
              key={d.icon}
              role="tab"
              aria-selected={selected === i}
              id={"field-tab-" + i}
              aria-controls="field-note"
              tabIndex={selected === i ? 0 : -1}
              className={selected === i ? "active" : ""}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse" && e.buttons === 0)
                  setSelected(i);
              }}
              onClick={() => setSelected(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  const next =
                    (i +
                      (e.key === "ArrowRight" ? 1 : -1) +
                      directions.length) %
                    directions.length;
                  setSelected(next);
                  document.getElementById("field-tab-" + next)?.focus();
                }
              }}
            >
              <Glyph kind={d.icon} size={15} />
              {d.title}
            </button>
          ))}
        </div>
        <div
          className="field-note"
          role="tabpanel"
          id="field-note"
          aria-labelledby={"field-tab-" + selected}
        >
          <ArrowDownRight size={17} />
          <p key={selected}>{dir.text}</p>
        </div>
      </div>
    </section>
  );
}
