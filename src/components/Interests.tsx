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
      <SectionLabel num="04">ИССЛЕДОВАТЕЛЬСКИЙ ИНДЕКС</SectionLabel>
      <div className="section-heading-row reveal">
        <h2 id="interests-title">
          Мои интересы<span className="accent">.</span>
        </h2>
        <span className="section-side-note mono">RESEARCH FIELDS / 07</span>
      </div>
      <div ref={rail} className="interest-wall drag-rail">
        {interests.map((item, i) => (
          <button
            key={item.kind}
            className={`interest-card interest-${item.kind} ${i < 3 ? "big" : "small"} reveal`}
            onClick={() => onOpen(i)}
          >
            <span className="interest-top">
              <span className="mono">FIELD / 0{i + 1}</span>
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
          </button>
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
      eyebrow={`FIELD NOTES / 0${index + 1}`}
      onClose={onClose}
      className="interest-modal"
      onStep={onStep}
      page={{ index, total: interests.length }}
    >
      <div className="study-art">
        <GenerativeArt kind={f.kind} />
      </div>
      <div className="sub-label mono">ИССЛЕДОВАТЕЛЬСКИЙ ВОПРОС</div>
      <h3>{f.question}</h3>
      <p className="dossier-text">{f.note}</p>
      <div className="note-sign mono">CHARON / PERSONAL RESEARCH</div>
    </Modal>
  );
}
