import { pageHref } from "../config/routes";
import { copy } from "../config/site";
import { useRef } from "react";
import { useRailDrag } from "../hooks/gestures";
import { ArrowUpRight } from "lucide-react";
import { interests } from "../config/site";
import { SectionLabel, Glyph, Modal } from "./ui";
import { GenerativeArt } from "./Art";
export function Interests({ onOpen }: { onOpen: (i: number) => void }) {
  const rail = useRef<HTMLDivElement>(null);
  useRailDrag(rail);
  return (
    <section
      id="interests"
      className="section shell interests-section"
      aria-labelledby="interests-title"
    >
      <SectionLabel num={copy["interests.number"]}>
        {copy["interests.text01"]}
      </SectionLabel>
      <div className="section-heading-row reveal">
        <h2 id="interests-title">
          {copy["interests.title"]}
          <span className="accent">{copy["interests.endMark"]}</span>
        </h2>
        <span className="section-side-note mono">
          {copy["interests.text02"]}
        </span>
      </div>
      <div ref={rail} className="interest-wall drag-rail">
        {interests.map((item, i) => (
          <a
            href={pageHref("journal/" + item.kind)}
            key={item.kind}
            className={`interest-card interest-${item.kind} ${i < 3 ? "big" : "small"} reveal`}
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                onOpen(i);
              }
            }}
          >
            <span className="interest-top">
              <span className="mono">
                {copy["interests.text03"]}
                {i + 1}
              </span>
              <ArrowUpRight size={15} />
            </span>
            {i < 3 ? (
              <GenerativeArt kind={item.kind} />
            ) : (
              <span className="interest-glyph">
                <Glyph kind={item.kind} size={28} />
              </span>
            )}
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
export function InterestModal({
  index,
  onStep,
  onClose,
}: {
  index: number;
  onStep: (delta: number) => void;
  onClose: () => void;
}) {
  const f = interests[index];
  return (
    <Modal
      title={f.title}
      eyebrow={`${copy["interests.dossier"]} / ${String(index + 1).padStart(2, "0")}`}
      onClose={onClose}
      className="interest-modal"
      onStep={onStep}
      page={{ index, total: interests.length }}
    >
      <div className="study-art">
        <GenerativeArt kind={f.kind} />
      </div>
      <div className="sub-label mono">{copy["interests.text04"]}</div>
      <h3>{f.question}</h3>
      <p className="dossier-text">{f.note}</p>
      <a className="folio-inline" href={pageHref("journal/" + f.kind)}>
        {copy["library.read"]}
        <ArrowUpRight size={15} />
      </a>
      <div className="note-sign mono">{copy["interests.text05"]}</div>
    </Modal>
  );
}
