import { copy } from "../config/site";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Art } from "../config/site";
const TAU = Math.PI * 2;
type P = [number, number, number];
function project([x, y, z]: P, ax = 0.34, ay = -0.35, az = -0.16) {
  const a = x * Math.cos(ay) + z * Math.sin(ay),
    b = -x * Math.sin(ay) + z * Math.cos(ay);
  const c = y * Math.cos(ax) - b * Math.sin(ax);
  return [
    (a * Math.cos(az) - c * Math.sin(az)) * 59 + 160,
    90 - (a * Math.sin(az) + c * Math.cos(az)) * 59,
  ];
}
function line(points: number[][]) {
  return points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}
function sequence(
  n: number,
  f: (t: number, i: number) => P,
  ax?: number,
  ay?: number,
  az?: number,
) {
  return line(
    Array.from({ length: n + 1 }, (_, i) => project(f(i / n, i), ax, ay, az)),
  );
}
const artCache = new Map<Art, string[]>();
function geometry(kind: Art) {
  const cached = artCache.get(kind);
  if (cached) return cached;
  const paths: string[] = [];
  if (kind === "trading") {
    const surface = (x: number, z: number): P => [
      x * 2.4,
      0.5 * Math.sin(x * 3.7 + z * 3.4) +
        0.34 * Math.cos(x * 2.6 - z * 4.1) +
        0.19 * Math.sin(z * 5),
      z * 1.5,
    ];
    for (let i = 0; i < 34; i++)
      paths.push(
        sequence(
          64,
          (t) => surface(t * 2 - 1, (i / 33) * 2 - 1),
          0.59,
          -0.45,
          -0.05,
        ),
      );
    for (let i = 0; i < 26; i++)
      paths.push(
        sequence(
          48,
          (t) => surface((i / 25) * 2 - 1, t * 2 - 1),
          0.59,
          -0.45,
          -0.05,
        ),
      );
  } else if (kind === "ai") {
    for (let i = 1; i < 42; i++) {
      const v = (i / 42) * Math.PI;
      paths.push(
        sequence(
          95,
          (t) => {
            const u = t * TAU,
              r =
                1.12 +
                0.17 * Math.cos(3 * u + v * 3) * Math.pow(Math.sin(v), 2);
            return [
              r * Math.sin(v) * Math.cos(u),
              r * Math.cos(v),
              r * Math.sin(v) * Math.sin(u),
            ];
          },
          0.19,
          -0.36,
          -0.49,
        ),
      );
    }
  } else if (kind === "design") {
    for (let i = 0; i < 50; i++) {
      const v = (i / 50) * TAU;
      paths.push(
        sequence(
          110,
          (t) => {
            const u = t * TAU;
            const ring = 1 + 0.32 * Math.cos(v + u * 2);
            return [
              Math.cos(u) * ring,
              Math.sin(u) * ring,
              0.42 * Math.sin(v + 2 * u) + 0.43 * Math.cos(u * 2),
            ];
          },
          0.53,
          -0.56,
          -0.23,
        ),
      );
    }
  } else if (kind === "automation") {
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 16; i++) {
        const d = (i / 15 - 0.5) * 0.26;
        paths.push(
          sequence(
            65,
            (t) => {
              const u = t * TAU;
              const a = 0.61 * Math.cos(u),
                b = 0.61 * Math.sin(u);
              return [
                j * 0.77 - 0.77 + a,
                b * (j % 2 ? 0.45 : 1) + d,
                j % 2 ? b * 0.85 : d,
              ];
            },
            0.26,
            -0.37,
            -0.41,
          ),
        );
      }
  } else if (kind === "product" || kind === "code") {
    for (let k = 0; k < 5; k++) {
      const y = k * 0.25 - 0.55;
      for (let d = 0; d < 3; d++) {
        const a = 1.05 - d * 0.07;
        paths.push(
          line(
            [
              [-a, y, -a],
              [a, y, -a],
              [a, y, a],
              [-a, y, a],
              [-a, y, -a],
            ].map((p) => project(p as P, 0.49, -0.61, -0.04)),
          ),
        );
      }
      for (let j = 0; j < 5; j++) {
        const z = -0.7 + j * 0.32;
        paths.push(
          line(
            [
              [-0.7, y, z],
              [0.18 + 0.13 * Math.cos(j * 3), y, z],
            ].map((p) => project(p as P, 0.49, -0.61, -0.04)),
          ),
        );
      }
    }
  } else if (kind === "technology") {
    for (let i = 0; i < 32; i++) {
      const y = (i / 31 - 0.5) * 1.58;
      const radius = 0.55 + 0.43 * Math.cos(y * 3.1);
      paths.push(
        sequence(
          80,
          (t) => [Math.cos(t * TAU) * radius, y, Math.sin(t * TAU) * radius],
          0.34,
          -0.34,
          -0.41,
        ),
      );
    }
  } else {
    for (let i = 0; i < 40; i++) {
      const v = (i / 40) * TAU;
      paths.push(
        sequence(
          85,
          (t) => {
            const u = t * TAU,
              r = 0.89 + 0.21 * Math.cos(3 * u + v);
            return [
              r * Math.cos(u),
              r * Math.sin(u),
              0.5 * Math.sin(3 * u + v),
            ];
          },
          0.65,
          -0.5,
          -0.2,
        ),
      );
    }
  }
  artCache.set(kind, paths);
  return paths;
}
export function GenerativeArt({
  kind,
  className = "",
}: {
  kind: Art;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null),
    [near, setNear] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "250px" },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [kind]);
  const paths = useMemo(
    () => (near && kind !== "identity" ? geometry(kind) : []),
    [kind, near],
  );
  if (kind === "identity")
    return (
      <div className={"identity-art " + className}>
        <span className="identity-art-orbit" />
        <img
          src={`${import.meta.env.BASE_URL}art/identity.webp`}
          width="900"
          height="680"
          alt={copy["studio.text31"]}
          loading="lazy"
        />
      </div>
    );
  return (
    <svg
      ref={ref}
      className={"generative-art art-" + kind + " " + className}
      viewBox="0 0 320 180"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={id}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
          gradientUnits="objectBoundingBox"
        >
          <stop stopColor="#7c709f" />
          <stop offset=".3" stopColor="#e2dbf1" />
          <stop offset=".56" stopColor="#afa8d6" />
          <stop offset=".73" stopColor="#817797" />
          <stop offset="1" stopColor="#d9d4e1" />
        </linearGradient>
      </defs>
      <g
        stroke={`url(#${id})`}
        strokeWidth={kind === "trading" ? 0.62 : 0.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            opacity={0.52 + 0.41 * (0.5 + 0.5 * Math.sin(i * 0.14))}
          />
        ))}
      </g>
    </svg>
  );
}
export function Fingerprint() {
  const lines = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => {
        const r = 0.18 + i * 0.032;
        return line(
          Array.from({ length: 135 }, (_, j) => {
            const a = (j / 134) * TAU * (0.89 + 0.1 * Math.sin(i * 0.125));
            const s =
              r *
              (1 +
                0.1 * Math.sin(a * 3 + r * 1.9) +
                0.075 * Math.cos(a * 2 - r * 2));
            const x = Math.cos(a) * s * 37,
              y = Math.sin(a) * s * 58;
            return [83 + x * 0.86 - y * 0.41, 95 + x * 0.41 + y * 0.86];
          }),
        );
      }),
    [],
  );
  return (
    <svg
      viewBox="0 0 165 190"
      className="fingerprint"
      fill="none"
      aria-hidden="true"
    >
      {lines.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth={1.05}
          opacity={0.42 + 0.43 * (0.5 + 0.5 * Math.sin(i * 0.26))}
        />
      ))}
    </svg>
  );
}
