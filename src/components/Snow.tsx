import { useEffect, useState, type CSSProperties } from "react";
import { Snowflake } from "lucide-react";
// Compositor-only transforms. No animation loop, no allocation on pointer/scroll events.
const seeds = Array.from(
  { length: 17 },
  (_, i) =>
    ({
      "--x": `${(i * 43 + 3) % 101}%`,
      "--wind": `${(i % 2 ? -1 : 1) * (12 + (i % 31))}px`,
      "--size": (i % 4 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.5) + "px",
      "--alpha": String(0.17 + (i % 4) * 0.055),
      "--fall": 20 + ((i * 7) % 15) + "s",
      "--phase": -((i * 8.31 + 4) % 31) + "s",
    }) as CSSProperties,
);
export function Snow() {
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
      <span className="snow-crystal">
        <Snowflake size={10} strokeWidth={1.2} />
      </span>
    </div>
  );
}
