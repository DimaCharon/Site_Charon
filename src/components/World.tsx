import { copy } from "../config/site";
import { usePagingGesture } from "../hooks/gestures";
import { useState, useRef } from "react";
import { ArrowLeft, ArrowRight, Orbit } from "lucide-react";
import { worlds } from "../config/site";
import { SectionLabel, Corners } from "./ui";
import { GenerativeArt } from "./Art";
export function World({ name }: { name: string }) {
  const [selected, setSelected] = useState(0);
  const surface = useRef<HTMLDivElement>(null);
  usePagingGesture(surface, (d) =>
    setSelected((i) => (i + d + worlds.length) % worlds.length),
  );
  const node = worlds[selected];
  return (
    <section
      className="world-section section"
      id="world"
      aria-labelledby="world-title"
    >
      <div className="shell world-layout" ref={surface}>
        <div className="world-copy reveal">
          <SectionLabel num={copy["world.number"]}>
            {copy["world.text01"]}
          </SectionLabel>
          <h2 id="world-title">
            {copy["world.title1"]}{" "}
            <span className="accent">{copy["world.title2"]}</span>
          </h2>
          <p className="section-intro">
            {copy["world.text02"]}
            <br />
            {copy["world.text03"]}
          </p>
          <div className="world-inspector" aria-live="polite">
            <div className="inspector-kicker mono">
              <Orbit size={13} />
              {copy["world.text04"]}
              {selected + 1} / {String(worlds.length).padStart(2, "0")}
            </div>
            <div className="inspector-content" key={node.kind}>
              <GenerativeArt kind={node.kind} />
              <div>
                <h3>{node.title}</h3>
                <p>{node.text}</p>
              </div>
            </div>
            <div className="inspector-progress">
              <div>
                {worlds.map((w, i) => (
                  <i key={w.kind} className={i === selected ? "active" : ""} />
                ))}
              </div>
              <button
                className="plain-icon"
                aria-label={copy["world.text05"]}
                onClick={() => setSelected((i) => (i + 6) % 7)}
              >
                <ArrowLeft size={15} />
              </button>
              <button
                className="plain-icon"
                aria-label={copy["world.text06"]}
                onClick={() => setSelected((i) => (i + 1) % 7)}
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
        <div className="atlas-stage reveal">
          <Corners />
          <div className="atlas-label mono">{copy["world.text07"]}</div>
          <svg
            className="orbital-lines"
            viewBox="0 0 600 450"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g fill="none" stroke="currentColor">
              <ellipse
                cx="300"
                cy="225"
                rx="213"
                ry="131"
                transform="rotate(-17 300 225)"
              />
              <ellipse
                cx="300"
                cy="225"
                rx="242"
                ry="99"
                transform="rotate(25 300 225)"
                strokeDasharray="3 6"
              />
              <ellipse
                cx="300"
                cy="225"
                rx="232"
                ry="171"
                transform="rotate(-32 300 225)"
                opacity=".5"
              />
              <ellipse
                cx="300"
                cy="225"
                rx="122"
                ry="78"
                transform="rotate(-17 300 225)"
                strokeDasharray="2 7"
              />
            </g>
            {Array.from({ length: 34 }, (_, i) => (
              <circle
                key={i}
                cx={16 + ((i * 127) % 569)}
                cy={12 + ((i * 73) % 424)}
                r={i % 4 === 0 ? 1.25 : 0.65}
                fill="currentColor"
              />
            ))}
          </svg>
          <div className="atlas-center">
            <img
              src={`${import.meta.env.BASE_URL}art/identity.webp`}
              width="900"
              height="680"
              alt={copy["world.text08"]}
              loading="lazy"
            />
            <span className="mono">{name}</span>
          </div>
          {worlds.map((w, i) => (
            <button
              key={w.kind}
              className={"orbit-node " + (i === selected ? "active" : "")}
              style={{
                left: w.x + "%",
                top: w.y + "%",
                animationDelay: `${-i * 0.8}s`,
              }}
              onClick={() => setSelected(i)}
              aria-label={copy["world.text09"] + " " + w.label}
              aria-pressed={i === selected}
            >
              <span className="satellite">
                <GenerativeArt kind={w.kind} />
              </span>
              <span className="node-label">{w.label}</span>
            </button>
          ))}
          <div className="atlas-footer mono">
            <span className="status-dot" />
            {copy["world.text10"]}
          </div>
        </div>
      </div>
    </section>
  );
}
