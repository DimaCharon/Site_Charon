import { useEffect, useState, type CSSProperties } from "react";
import { assetUrl } from "../config/routes";
// A deterministic field with distant, middle and foreground grains. Every prefix
// covers the viewport, so shrinking to a tablet or phone doesn't leave an empty side.
const layers = [
  { size: 1.8, alpha: 0.42, fall: 23 },
  { size: 2.7, alpha: 0.6, fall: 18 },
  { size: 3.8, alpha: 0.78, fall: 14 },
] as const;
function makeField(): CSSProperties[] {
  let seed = 7319;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const depths = [0, 1, 0, 2, 1];
  return Array.from({ length: 84 }, (_, i) => {
    const layer = layers[depths[i % depths.length]],
      fall = layer.fall + random() * 6,
      start = (0.37 + i * 0.56984 + random() * 0.035) % 1,
      direction = random() < 0.5 ? -1 : 1;
    return {
      "--x": ((2 + i * 75.4878 + random() * 2.2) % 100).toFixed(2) + "%",
      "--wind": (direction * (9 + random() * 28)).toFixed(1) + "px",
      "--drift": (direction * (2 + random() * 12)).toFixed(1) + "px",
      "--size": (layer.size + random() * 0.8).toFixed(2) + "px",
      "--alpha": (layer.alpha + random() * 0.13).toFixed(2),
      "--fall": fall.toFixed(2) + "s",
      "--phase": (-start * fall).toFixed(2) + "s",
    } as CSSProperties;
  });
}
export function Snow() {
  // No particles (or field allocation) until enabled, and no JS animation loop.
  const [seeds] = useState(makeField);
  const [paused, setPaused] = useState(
    () => typeof document !== "undefined" && document.hidden,
  );
  useEffect(() => {
    const on = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return (
    <div className="snow-film" aria-hidden="true" data-paused={paused}>
      <div className="snow-dust">
        {seeds.map((s, i) => (
          <i key={i} style={s} />
        ))}
      </div>
      {[8, 24, 39, 54, 70, 84, 95, 17].map((x, i) => (
        <span
          className="snow-crystal"
          key={i}
          style={{
            "--crystal-x": `${x}%`,
            "--crystal-size": `${[14, 16, 12, 15, 13, 17, 12, 15][i]}px`,
            "--crystal-phase": `${-i * 5.75}s`,
          } as CSSProperties}
        >
          <img src={assetUrl("art/snowflake.png")} alt="" />
        </span>
      ))}
    </div>
  );
}
