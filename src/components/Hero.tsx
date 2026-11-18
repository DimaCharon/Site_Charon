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
              <span>PERSONAL DIGITAL IDENTITY</span>
            </div>
            <h1 id="hero-title">
              <span className="intro-item">Создаю то,</span>
              <span className="accent intro-item">чего ещё нет.</span>
            </h1>
            <p className="hero-description intro-item">
              Технологии, искусственный интеллект, цифровые продукты и
              эксперименты на пересечении идей и разработки.
            </p>
            <div className="hero-actions intro-item">
              <Magnetic href="#projects" className="primary">
                Мои проекты
                <ArrowUpRight size={17} />
              </Magnetic>
              <Magnetic href="#about" className="secondary">
                Обо мне
                <ArrowDown size={15} />
              </Magnetic>
            </div>
            <div className="hero-fields intro-item">
              <strong className="hero-author">{name}</strong>
              <b className="author-divider" />
              <span>
                <Sparkles size={12} />
                AI
              </span>
              <i />
              <span>
                <Braces size={13} />
                Development
              </span>
              <i />
              <span>
                <Layers2 size={12} />
                Design
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
              <span>FIG. 01</span>
              <i />
              CHARON IDENTITY OBJECT
            </div>
          </div>
        </div>
        <div className="hero-bottom">
          <div className="shell hero-bottom-inner">
            <span className="system-status">
              <i className="status-dot" />
              Система онлайн
            </span>
            <span className="system-label mono">
              <i />
              CHARON OS<span>/</span>PERSONAL SPACE
            </span>
            <a href="#about" className="scroll-link">
              Листайте вниз
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
