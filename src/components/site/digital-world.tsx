"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, Lightformer, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { site, worldNodes, type WorldNode } from "@/config/site";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

/* ═══════════════ Мини-сцены узлов ═══════════════ */

function MiniScene({ scene }: { scene: WorldNode["scene"] }) {
  switch (scene) {
    case "ai":
      return (
        <svg viewBox="0 0 200 120" className="h-full w-full" fill="none" aria-hidden="true">
          <g className="stroke-silver/40" strokeWidth="1">
            <path d="M100 18 L40 60 M100 18 L160 60 M40 60 L100 100 M160 60 L100 100 M40 60 L160 60 M100 18 L100 100" />
          </g>
          {[[100, 18], [40, 60], [160, 60], [100, 100]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={i === 0 ? 7 : 5} className={i === 0 ? "fill-lav anim-core" : "fill-silver/60"} />
          ))}
          <circle cx="100" cy="60" r="4" className="fill-blu anim-core" style={{ animationDelay: "-1.4s" }} />
        </svg>
      );
    case "code":
      return (
        <div className="flex h-full w-full flex-col justify-center gap-2.5 p-5" aria-hidden="true">
          {[92, 64, 78, 40, 70].map((w, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="font-mono text-[9px] text-muted-foreground/50">{String(i + 1).padStart(2, "0")}</span>
              <div
                className={`h-2.5 rounded-sm ${i === 1 ? "bg-lav/70" : i === 3 ? "bg-blu/60" : "bg-silver/35"}`}
                style={{ width: `${w}%`, animation: `type-w 1.2s ${i * 0.16}s cubic-bezier(0.22,1,0.36,1) both` }}
              />
            </div>
          ))}
        </div>
      );
    case "trading":
      return (
        <svg viewBox="0 0 200 120" className="h-full w-full" fill="none" aria-hidden="true">
          <g className="stroke-border" strokeWidth="1">
            <path d="M10 30 H190 M10 60 H190 M10 90 H190" />
          </g>
          {[[25, 55, 85], [48, 35, 95], [71, 62, 45], [94, 42, 78], [117, 70, 30], [140, 50, 88], [163, 25, 60]].map(([x, top, bottom], i) => (
            <rect key={i} x={x - 5} y={top} width="10" height={bottom - top} rx="1.5"
              className={i % 2 ? "fill-lav/60" : "fill-silver/45"} />
          ))}
          <path d="M25 50 L48 30 L71 57 L94 37 L117 65 L140 45 L163 20" className="stroke-blu" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "design":
      return (
        <div className="relative h-full w-full" aria-hidden="true">
          <svg viewBox="0 0 200 120" className="absolute inset-0 h-full w-full" fill="none">
            <g className="stroke-border" strokeWidth="1">
              <path d="M40 12 V108 M80 12 V108 M120 12 V108 M160 12 V108 M20 36 H180 M20 72 H180" />
            </g>
          </svg>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-4xl font-semibold text-lav">
            Aa
          </span>
          <span className="absolute left-[24%] top-[18%] h-3.5 w-3.5 border border-blu/70" style={{ animation: "cursor-grid 6s ease-in-out infinite" }} />
        </div>
      );
    case "automation":
      return (
        <svg viewBox="0 0 200 120" className="h-full w-full" fill="none" aria-hidden="true">
          <rect x="18" y="46" width="40" height="28" rx="7" className="stroke-silver/60" strokeWidth="1.4" />
          <rect x="80" y="46" width="40" height="28" rx="14" className="stroke-lav/70" strokeWidth="1.4" />
          <rect x="142" y="46" width="40" height="28" rx="7" className="stroke-silver/60" strokeWidth="1.4" />
          <path d="M58 60 H80" className="stroke-lav/70" strokeWidth="1.6" strokeDasharray="4 5" />
          <path d="M120 60 H142" className="stroke-lav/70" strokeWidth="1.6" strokeDasharray="4 5" />
          <g className="anim-spin-slow" style={{ transformOrigin: "100px 60px", animationDuration: "9s" }}>
            <circle cx="100" cy="60" r="11" className="stroke-lav/70" strokeWidth="1.4" strokeDasharray="8 30 30 8" />
          </g>
        </svg>
      );
    case "technology":
      return (
        <svg viewBox="0 0 200 120" className="h-full w-full" fill="none" aria-hidden="true">
          <path
            d="M100 22 L123 35 L123 61 L100 74 L77 61 L77 35 Z"
            className="stroke-lav/70" strokeWidth="1.5"
          />
          <path d="M100 46 L123 59 M100 46 L77 59 M100 46 V74" className="stroke-silver/35" strokeWidth="1" />
          <circle cx="100" cy="48" r="4" className="fill-lav anim-core" />
          <ellipse cx="100" cy="48" rx="72" ry="26" className="stroke-silver/30" strokeWidth="1" strokeDasharray="2 6" transform="rotate(-12 100 48)" />
          <g style={{ transformOrigin: "100px 48px" }} className="anim-spin-slow">
            <circle cx="172" cy="48" r="3" className="fill-blu" />
          </g>
        </svg>
      );
    case "experiments":
      return (
        <svg viewBox="0 0 200 120" className="h-full w-full" fill="none" aria-hidden="true">
          {[[30, 30], [60, 78], [92, 44], [128, 86], [150, 32], [176, 62], [46, 104], [108, 12]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 5 : 3} className={i % 3 === 0 ? "fill-lav/70" : "fill-silver/50"} style={{ animation: `core-pulse ${2 + (i % 4) * 0.7}s ${i * 0.3}s ease-in-out infinite` }} />
          ))}
          <path d="M30 30 Q 92 120 176 62" className="stroke-blu/50" strokeWidth="1" strokeDasharray="3 6" />
        </svg>
      );
  }
}

/* ═══════════════ 3D-система ═══════════════ */

interface OrbitSpec {
  radius: number;
  speed: number;
  phase: number;
  tilt: THREE.Euler;
  y: number;
}

const orbitSpecs: OrbitSpec[] = worldNodes.map((_, i) => ({
  radius: 2.1 + (i % 3) * 0.62,
  speed: (0.1 + (i % 4) * 0.045) * (i % 2 === 0 ? 1 : -1),
  phase: (i / worldNodes.length) * Math.PI * 2,
  tilt: new THREE.Euler(0.38 + (i % 3) * 0.16, i * 0.5, (i % 2 === 0 ? 1 : -1) * 0.22),
  y: (i % 3 - 1) * 0.42,
}));

function orbitPosition(spec: OrbitSpec, t: number, out: THREE.Vector3) {
  const a = spec.phase + t * spec.speed;
  out.set(Math.cos(a) * spec.radius, 0, Math.sin(a) * spec.radius);
  out.applyEuler(spec.tilt);
  out.y += spec.y;
  return out;
}

/* Орбитальная линия */
function OrbitLine({ spec, active }: { spec: OrbitSpec; active: boolean }) {
  const object = React.useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const v = new THREE.Vector3();
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      v.set(Math.cos(a) * spec.radius, 0, Math.sin(a) * spec.radius);
      v.applyEuler(spec.tilt);
      v.y += spec.y;
      pts.push(v.clone());
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#8b90a0"),
      transparent: true,
      opacity: 0.16,
    });
    return new THREE.Line(geo, mat);
  }, [spec]);

  return (
    <primitive
      object={object}
      material-transparent={true}
      material-opacity={active ? 0.42 : 0.16}
      material-color={active ? "#b7b1f5" : "#8b90a0"}
    />
  );
}

/* Узел системы */
/* Смещение подписей по вертикали — чтобы соседние не слипались */
const labelOffsets = [0, 0.16, 0, 0.16, 0, 0.16, 0];

function SystemNode({
  node,
  spec,
  index,
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  node: WorldNode;
  spec: OrbitSpec;
  index: number;
  selected: boolean;
  hovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const mesh = React.useRef<THREE.Mesh>(null);
  const tmp = React.useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    orbitPosition(spec, clock.getElapsedTime(), tmp);
    mesh.current.position.copy(tmp);
    const targetScale = selected ? 1.65 : hovered ? 1.4 : 1;
    mesh.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as THREE.Vector3, 0.12);
  });

  const emissive = selected ? "#9d97f2" : hovered ? "#6e93c7" : "#000000";
  const emissiveIntensity = selected ? 1.6 : hovered ? 0.9 : 0;

  return (
    <mesh
      ref={mesh}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(node.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "";
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      <sphereGeometry args={[0.19, 28, 28]} />
      <meshStandardMaterial
        color={selected ? "#b7b1f5" : hovered ? "#aeb2bd" : "#7d828e"}
        metalness={0.85}
        roughness={0.3}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
      <Html center distanceFactor={9} position={[0, 0.42 + (labelOffsets[index] ?? 0), 0]} zIndexRange={[10, 0]}>
        <div
          className={`select-none font-mono text-[10px] uppercase tracking-[0.22em] transition-colors duration-300 ${
            selected ? "text-lav" : hovered ? "text-foreground" : "text-muted-foreground"
          }`}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          {node.label}
        </div>
      </Html>
      {/* Тонкое кольцо-подсветка у выбранного */}
      {selected && (
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[0.32, 0.008, 8, 64]} />
          <meshStandardMaterial color="#b7b1f5" emissive="#8f86ee" emissiveIntensity={1.4} />
        </mesh>
      )}
    </mesh>
  );
}

/* Центральная идентичность */
function IdentityCore({ selected }: { selected: string | null }) {
  const group = React.useRef<THREE.Group>(null);
  const ring = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y += 0.003;
      const targetY = pointer.x * 0.28;
      const targetX = -pointer.y * 0.16;
      group.current.rotation.y += (targetY - group.current.rotation.y) * 0.03;
      group.current.rotation.x += (targetX - group.current.rotation.x) * 0.03;
    }
    if (ring.current) {
      ring.current.rotation.z = t * 0.4;
      const s = 1 + Math.sin(t * 1.6) * 0.04 + (selected ? 0.15 : 0);
      ring.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[0.62, 48, 48]} />
        <meshPhysicalMaterial color="#33363d" metalness={0.75} roughness={0.32} clearcoat={0.5} />
      </mesh>
      {/* Звезда на ядре */}
      <mesh position={[0, 0, 0.6]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[0.14, 20, 20]} />
        <meshStandardMaterial color="#b7b1f5" emissive="#8f86ee" emissiveIntensity={2.2} />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.05, 0.012, 10, 90]} />
        <meshStandardMaterial color="#c9ccd3" metalness={1} roughness={0.25} />
      </mesh>
      <Html center distanceFactor={10} position={[0, -1.05, 0]} zIndexRange={[10, 0]}>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/80"
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          charon · identity
        </div>
      </Html>
    </group>
  );
}

function WorldSystem({
  selected,
  hovered,
  onSelect,
  onHover,
}: {
  selected: string | null;
  hovered: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={1} />
      <pointLight position={[-5, 2, -4]} intensity={18} color="#9d97f2" distance={14} />
      <pointLight position={[5, -2, -3]} intensity={12} color="#7fa0c8" distance={14} />

      <IdentityCore selected={selected} />

      {worldNodes.map((node, i) => (
        <React.Fragment key={node.id}>
          <OrbitLine spec={orbitSpecs[i]} active={selected === node.id || hovered === node.id} />
          <SystemNode
            node={node}
            spec={orbitSpecs[i]}
            index={i}
            selected={selected === node.id}
            hovered={hovered === node.id}
            onSelect={onSelect}
            onHover={onHover}
          />
        </React.Fragment>
      ))}

      <Environment resolution={128}>
        <group rotation={[-Math.PI / 3, 0, 0]}>
          <Lightformer form="circle" intensity={3} position={[0, 5, -9]} scale={2} />
          <Lightformer form="rect" intensity={1.6} color="#b7b1f5" position={[-5, 1, -1]} scale={[3, 0.8]} />
          <Lightformer form="rect" intensity={1.2} color="#a9c3e8" position={[5, -1, -1]} scale={[3, 0.8]} />
        </group>
      </Environment>
    </>
  );
}

const WorldCanvas = dynamic(
  () =>
    Promise.resolve(({ selected, hovered, onSelect, onHover, inView }: {
      selected: string | null;
      hovered: string | null;
      onSelect: (id: string) => void;
      onHover: (id: string | null) => void;
      inView: boolean;
    }) => (
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 2.1, 7.6], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ touchAction: "pan-y" }}
        frameloop={inView ? "always" : "never"}
        onPointerMissed={() => onSelect("")}
      >
        <WorldSystem selected={selected} hovered={hovered} onSelect={onSelect} onHover={onHover} />
      </Canvas>
    )),
  { ssr: false, loading: () => null }
);

/* ═══════════════ Секция ═══════════════ */

export function DigitalWorld() {
  const [mounted, setMounted] = React.useState(false);
  const [inView, setInView] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const sectionRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: "30% 0px 30% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const selectedNode = worldNodes.find((n) => n.id === selected) ?? null;

  return (
    <section
      id="world"
      ref={sectionRef}
      className="relative overflow-hidden border-y border-line bg-secondary/25 py-28 md:py-36"
      aria-label="Мой цифровой мир"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading index="03" title={site.world.title} lead={site.world.lead} hint="interactive" />

        <Reveal from="scale">
          <div className="relative">
            {/* 3D-сцена */}
            <div className="relative h-[58vh] min-h-[400px] w-full overflow-hidden rounded-3xl border border-line md:h-[64vh]" data-cursor="zone">
              <div className="grain absolute inset-0 bg-background/60" />
              {mounted && (
                <WorldCanvas
                  selected={selected}
                  hovered={hovered}
                  onSelect={(id) => setSelected(id || null)}
                  onHover={setHovered}
                  inView={inView}
                />
              )}

              {/* Подсказка */}
              {!selected && (
                <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2">
                  <span className="glass-panel rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    коснитесь узла, чтобы раскрыть сцену
                  </span>
                </div>
              )}
            </div>

            {/* Панель раскрытой сцены */}
            <AnimatePresence>
              {selectedNode && (
                <motion.aside
                  key={selectedNode.id}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.97 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="glass-panel absolute bottom-24 right-4 z-10 w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5 md:bottom-28 md:right-8"
                  aria-live="polite"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-lav">
                        {selectedNode.label}
                      </p>
                      <h3 className="mt-1.5 font-display text-lg font-semibold tracking-tight">
                        {selectedNode.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-muted-foreground transition-colors hover:border-lav/50 hover:text-foreground"
                      aria-label="Закрыть сцену"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="matte-panel mt-4 h-28 overflow-hidden rounded-xl">
                    <MiniScene scene={selectedNode.scene} />
                  </div>

                  <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
                    {selectedNode.description}
                  </p>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        {/* Легенда-чипсы */}
        <Reveal delay={0.15}>
          <div className="mask-fade-x mt-6 flex flex-wrap items-center gap-2">
            {worldNodes.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelected(n.id)}
                className={`rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                  selected === n.id
                    ? "border-lav/60 bg-lav/10 text-lav"
                    : "border-line text-muted-foreground hover:border-lav/40 hover:text-foreground"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
