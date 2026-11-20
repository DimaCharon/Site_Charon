import { useState } from "react";
import { ArrowDown, ArrowDownRight, Aperture } from "lucide-react";
import { copy, projects } from "../config/site";
import { Magnetic } from "./ui";
import { Viewport, StudioModal } from "./Viewport";
export function Hero({
  reduced,
  overlay,
  name,
}: {
  reduced: boolean;
  overlay: boolean;
  name: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <section
        id="home"
        className="hero atelier-hero"
        aria-labelledby="hero-title"
      >
        <div className="shell atelier-mast">
          <span className="folio-code">
            <i />
            {copy["store.edition"]}
          </span>
          <span className="folio-code mast-count">
            {copy["hero.text07"]}
            <b>/</b>
            {String(projects.length).padStart(2, "0")}
          </span>
        </div>
        <div className="shell hero-inner">
          <div className="hero-copy">
            <div className="author-line intro-item">
              <span className="author-symbol" aria-hidden="true">
                <Aperture size={19} strokeWidth={1.3} />
              </span>
              <span>
                {copy["store.by"]}{" "}
                <strong className="hero-author">{name}</strong>
              </span>
              <i />
              <span>{copy["hero.badge"]}</span>
            </div>
            <h1 id="hero-title">
              <span className="intro-item">{copy["hero.title1"]}</span>{" "}
              <span className="accent intro-item">{copy["hero.title2"]}</span>
            </h1>
            <p className="hero-description intro-item">
              {copy["hero.description"]}
            </p>
            <div className="hero-actions intro-item">
              <Magnetic className="primary" href="#projects">
                {copy["hero.primary"]}
                <ArrowDownRight size={17} />
              </Magnetic>
            </div>
            <div
              role="group"
              aria-label={copy["hero.text08"]}
              className="atelier-disciplines mono intro-item"
            >
              {[
                copy["hero.text01"],
                copy["hero.text02"],
                copy["hero.text03"],
              ].map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
          </div>
          <div className="hero-visual specimen">
            <div className="specimen-head">
              <span className="folio-code">{copy["store.specimen"]}</span>
              <span className="specimen-ticks" aria-hidden="true" />
            </div>
            <Viewport
              reduced={reduced}
              active={!expanded && !overlay}
              onExpand={() => setExpanded(true)}
            />
            <div className="specimen-foot">
              <span className="folio-code">
                {copy["hero.text04"]}
                <b>/</b>
                {copy["hero.text05"]}
              </span>
              <span>{copy["store.plate"]}</span>
            </div>
          </div>
        </div>
        <div className="shell atelier-baseline">
          <span>
            <i />
            {copy["hero.text06"]}
          </span>
          <span>{copy["hero.secondary"]}</span>
          <a href="#projects">
            {copy["hero.text09"]}
            <ArrowDown size={12} />
          </a>
        </div>
      </section>
      {expanded && (
        <StudioModal reduced={reduced} onClose={() => setExpanded(false)} />
      )}
    </>
  );
}
