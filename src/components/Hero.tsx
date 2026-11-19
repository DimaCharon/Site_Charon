import { copy } from "../config/site";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDown,
  Fingerprint,
  Braces,
  Sparkles,
  Layers2,
  ChevronDown,
} from "lucide-react";
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
      <section id="home" className="hero" aria-labelledby="hero-title">
        <div className="hero-grid" aria-hidden="true" />
        <div className="shell hero-inner">
          <div className="hero-copy">
            <div className="eyebrow intro-item">
              <Fingerprint size={14} />
              <span>{copy["hero.badge"]}</span>
            </div>
            <h1 id="hero-title">
              <span className="intro-item">{copy["hero.title1"]}</span>
              <span className="accent intro-item">{copy["hero.title2"]}</span>
            </h1>
            <p className="hero-description intro-item">
              {copy["hero.description"]}
            </p>
            <div className="hero-actions intro-item">
              <Magnetic href="#projects" className="primary">
                {copy["hero.primary"]}
                <ArrowUpRight size={17} />
              </Magnetic>
              <Magnetic href="#about" className="secondary">
                {copy["hero.secondary"]}
                <ArrowDown size={15} />
              </Magnetic>
            </div>
            <div className="hero-fields intro-item">
              <strong className="hero-author">{name}</strong>
              <b className="author-divider" />
              <span>
                <Sparkles size={12} />
                {copy["hero.text01"]}
              </span>
              <i />
              <span>
                <Braces size={13} />
                {copy["hero.text02"]}
              </span>
              <i />
              <span>
                <Layers2 size={12} />
                {copy["hero.text03"]}
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <Viewport
              reduced={reduced}
              active={!expanded && !overlay}
              onExpand={() => setExpanded(true)}
            />
            <div className="figure-caption mono">
              <span>{copy["hero.text04"]}</span>
              <i />
              {copy["hero.text05"]}
            </div>
          </div>
        </div>
        <div className="hero-bottom">
          <div className="shell hero-bottom-inner">
            <span className="system-status">
              <i className="status-dot" />
              {copy["hero.text06"]}
            </span>
            <span className="system-label mono">
              <i />
              {copy["hero.text07"]}
              <span>/</span>
              {copy["hero.text08"]}
            </span>
            <a href="#about" className="scroll-link">
              {copy["hero.text09"]}
              <ChevronDown size={13} />
            </a>
          </div>
        </div>
      </section>
      {expanded && (
        <StudioModal reduced={reduced} onClose={() => setExpanded(false)} />
      )}
    </>
  );
}
