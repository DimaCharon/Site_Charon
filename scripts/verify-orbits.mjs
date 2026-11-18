/**
 * Верификация орбитальной системы My Digital World.
 * Считает экранные позиции узлов и подписей при t=0 и ищет пересечения подписей.
 * Запуск: node scripts/verify-orbits.mjs
 */
import * as THREE from "three";

/* Параметры камеры из digital-world.tsx */
const CAM_POS = new THREE.Vector3(0, 2.1, 7.6);
const FOV = 42;
const CANVAS_W = 1104; // px (max-w-6xl с px-6)
const CANVAS_H = 576; // px (64vh при 900px viewport)
const DPR = 1;

/* Подписи узлов (порядок worldNodes) */
const NODES = [
  { label: "AI", df: 9 },
  { label: "CODE", df: 9 },
  { label: "TRADING", df: 9 },
  { label: "DESIGN", df: 9 },
  { label: "AUTOMATION", df: 9 },
  { label: "TECHNOLOGY", df: 9 },
  { label: "EXPERIMENTS", df: 9 },
  { label: "charon · identity", df: 10, center: true },
];

/* Ширина подписи в px (JetBrains Mono 10px, letter-spacing 0.22em ≈ 8.2px/символ) */
function labelNaturalWidth(text) {
  const perChar = text.length > 12 ? 9.2 : 8.4;
  return text.length * perChar;
}

/* ─── Кандидат параметров орбит ─── */
const SPEED = 0.11;
const ORBITS = [
  // radius, phase, tiltX, tiltZ, yOff, dir
  { r: 2.55, phase: 0.448, tiltX: 0.35, tiltZ: 0.15, y: 0.52, dir: 1 }, // AI — право
  { r: 2.9, phase: 5.17, tiltX: 0.35, tiltZ: -0.15, y: -0.49, dir: 1 }, // CODE — верх-право
  { r: 2.35, phase: 3.82, tiltX: 0.35, tiltZ: 0.15, y: 0.28, dir: 1 }, // TRADING — верх-лево
  { r: 2.95, phase: 3.754, tiltX: 0.35, tiltZ: -0.15, y: -0.66, dir: 1 }, // DESIGN — лево
  { r: 2.6, phase: 2.564, tiltX: 0.35, tiltZ: 0.15, y: -0.2, dir: 1 }, // AUTOMATION — низ-лево
  { r: 2.8, phase: 1.944, tiltX: 0.35, tiltZ: -0.15, y: 0.04, dir: 1 }, // TECHNOLOGY — низ-центр
  { r: 2.45, phase: 1.096, tiltX: 0.35, tiltZ: 0.15, y: -0.06, dir: 1 }, // EXPERIMENTS — низ-право
];

/* Смещение подписи по Y относительно узла: вверху/внизу */
const LABEL_Y = [-0.55, -0.55, -0.55, -0.55, 0.42, -0.55, -0.55];

/* Центральная подпись — над ядром */
const CENTER_LABEL_POS = new THREE.Vector3(0, 1.35, 0);

/* ─── Математика orbitPosition (как в компоненте) ─── */
function orbitPosition(o, t, out) {
  const a = o.phase + t * SPEED * o.dir;
  out.set(Math.cos(a) * o.r, 0, Math.sin(a) * o.r);
  out.applyEuler(new THREE.Euler(o.tiltX, 0, o.tiltZ));
  out.y += o.y;
  return out;
}

/* ─── Камера ─── */
const camera = new THREE.PerspectiveCamera(FOV, CANVAS_W / CANVAS_H, 0.1, 100);
camera.position.copy(CAM_POS);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();
camera.updateProjectionMatrix();

const halfH = CANVAS_H / 2;
const halfW = CANVAS_W / 2;

function project(v) {
  const p = v.clone().project(camera);
  return { x: p.x * halfW, y: -p.y * halfH, z: p.z };
}

/* ─── Расчёт ─── */
const t = 0;
const rects = [];

ORBITS.forEach((o, i) => {
  const pos = orbitPosition(o, t, new THREE.Vector3());
  const screen = project(pos);
  const dist = pos.distanceTo(CAM_POS);
  // масштаб drei Html: distanceFactor / (2 * tan(fov/2) * dist)
  const scale = NODES[i].df / (2 * Math.tan((FOV * Math.PI) / 360) * dist);
  const w = labelNaturalWidth(NODES[i].label) * scale * DPR;
  const h = 13 * scale * DPR;
  const labelWorld = pos.clone();
  labelWorld.y += LABEL_Y[i];
  const ls = project(labelWorld);
  rects.push({
    name: NODES[i].label,
    cx: ls.x, cy: ls.y,
    x1: ls.x - w / 2, x2: ls.x + w / 2,
    y1: ls.y - h / 2, y2: ls.y + h / 2,
    node: screen, dist, scale,
  });
});

/* Центральная подпись */
{
  const ls = project(CENTER_LABEL_POS);
  const dist = CENTER_LABEL_POS.distanceTo(CAM_POS);
  const scale = NODES[7].df / (2 * Math.tan((FOV * Math.PI) / 360) * dist);
  const w = labelNaturalWidth(NODES[7].label) * scale;
  const h = 13 * scale;
  rects.push({
    name: NODES[7].label,
    cx: ls.x, cy: ls.y,
    x1: ls.x - w / 2, x2: ls.x + w / 2,
    y1: ls.y - h / 2, y2: ls.y + h / 2,
    node: project(CENTER_LABEL_POS), dist, scale,
  });
}

/* ─── Отчёт ─── */
console.log("=== Экранные позиции (px, canvas " + CANVAS_W + "x" + CANVAS_H + ") ===");
const nodeCircles = rects.map((r) => ({ name: r.name, cx: r.node.x, cy: r.node.y, rad: (0.19 * 750) / r.dist }));
for (const r of rects) {
  const inView = r.node.x > -halfW && r.node.x < halfW && r.node.y > -halfH && r.node.y < halfH;
  console.log(
    r.name.padEnd(18),
    "node(" + r.node.x.toFixed(0) + "," + r.node.y.toFixed(0) + ")",
    "label(" + r.cx.toFixed(0) + "," + r.cy.toFixed(0) + ")",
    "w=" + (r.x2 - r.x1).toFixed(0),
    inView ? "" : "  ⚠ УЗЕЛ ЗА КАДРОМ",
  );
}

console.log("\n=== Пересечения подписей ===");
let overlaps = 0;
for (let i = 0; i < rects.length; i++) {
  for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const ox = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
    const oy = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
    if (ox > 0 && oy > 0) {
      overlaps++;
      console.log("⛔", a.name, "×", b.name, "— перекрытие", ox.toFixed(0) + "x" + oy.toFixed(0) + "px");
    }
  }
}
if (overlaps === 0) console.log("✅ Пересечений нет");

/* Проверка: подписи внутри canvas */
console.log("\n=== Подписи за пределами canvas ===");
let outside = 0;
for (const r of rects) {
  if (r.x1 < -halfW + 4 || r.x2 > halfW - 4 || r.y1 < -halfH + 4 || r.y2 > halfH - 4) {
    outside++;
    console.log("⚠", r.name, "выходит за край:", r.x1.toFixed(0), r.y1.toFixed(0), r.x2.toFixed(0), r.y2.toFixed(0));
  }
}
if (outside === 0) console.log("✅ Все подписи внутри");

/* Подсказка-пилюля внизу по центру: ~230px шириной, top ≈ -halfH + 46px */
const pill = { x1: -115, x2: 115, y1: -halfH + 46, y2: -halfH + 78 };
console.log("\n=== Пересечения с пилюлей-подсказкой ===");
let pillHit = 0;
for (const r of rects) {
  const ox = Math.min(r.x2, pill.x2) - Math.max(r.x1, pill.x1);
  const oy = Math.min(r.y2, pill.y2) - Math.max(r.y1, pill.y1);
  if (ox > 0 && oy > 0) { pillHit++; console.log("⛔", r.name, "× пилюля"); }
}
if (pillHit === 0) console.log("✅ Пилюля свободна");

/* Пересечения подписей со сферами других узлов (r=0.19) */
console.log("\n=== Подписи на чужих сферах ===");
let sphereHit = 0;
for (const r of rects) {
  for (const n of nodeCircles) {
    if (n.name === r.name) continue;
    // расстояние от центра сферы до прямоугольника подписи
    const dx = Math.max(r.x1 - n.cx, 0, n.cx - r.x2);
    const dy = Math.max(r.y1 - n.cy, 0, n.cy - r.y2);
    if (dx * dx + dy * dy < n.rad * n.rad * 0.64) {
      sphereHit++;
      console.log("⚠", r.name, "задевает сферу", n.name);
    }
  }
}
if (sphereHit === 0) console.log("✅ Подписи не задевают сферы");

/* ─── Скан по времени: как часто возникают перекрытия ─── */
/* Фикс-оверлей «charon · identity»: центр (0, 1.35, 0), без дистанционного масштаба,
   12px моно + tracking 0.3em ≈ 184×15px в центре сверху */
function overlayRect() {
  const ls = project(new THREE.Vector3(0, 1.55, 0));
  const w = 184, h = 16;
  return { name: "[overlay]", x1: ls.x - w / 2, x2: ls.x + w / 2, y1: ls.y - h / 2, y2: ls.y + h / 2 };
}

function checkAt(t) {
  const rs = [overlayRect()];
  const spheres = [];
  ORBITS.forEach((o, i) => {
    const pos = orbitPosition(o, t, new THREE.Vector3());
    const dist = pos.distanceTo(CAM_POS);
    const scale = NODES[i].df / (2 * Math.tan((FOV * Math.PI) / 360) * dist);
    const w = labelNaturalWidth(NODES[i].label) * scale;
    const h = 13 * scale;
    const labelWorld = pos.clone();
    labelWorld.y += LABEL_Y[i];
    const ls = project(labelWorld);
    rs.push({ name: NODES[i].label, x1: ls.x - w / 2, x2: ls.x + w / 2, y1: ls.y - h / 2, y2: ls.y + h / 2 });
    const ns = project(pos);
    spheres.push({ name: NODES[i].label, cx: ns.x, cy: ns.y, rad: (0.19 * 750) / dist });
  });
  let ov = 0;
  for (let i = 0; i < rs.length; i++)
    for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i], b = rs[j];
      if (Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) > 0 && Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) > 0) ov++;
    }
  // подпись на чужой сфере
  for (const r of rs)
    for (const n of spheres) {
      if (n.name === r.name || r.name === "[overlay]") continue;
      const dx = Math.max(r.x1 - n.cx, 0, n.cx - r.x2);
      const dy = Math.max(r.y1 - n.cy, 0, n.cy - r.y2);
      if (dx * dx + dy * dy < n.rad * n.rad * 0.64) ov++;
    }
  return ov;
}
console.log("\n=== Скан перекрытий по времени (65с > полный оборот 57с, шаг 1с) ===");
let bad = 0;
const detail = [];
for (let t = 0; t <= 65; t += 1) {
  const ov = checkAt(t);
  if (ov > 0) { bad++; detail.push(t); }
}
if (bad === 0) console.log("✅ За полный оборот — ни одного перекрытия (включая фикс-оверлей)");
else console.log("⚠ Перекрытия в моменты (с):", detail.join(", "));

/* Детали: кто именно сталкивается с оверлеем */
function checkPairsAt(t, verbose) {
  const rs = [overlayRect()];
  ORBITS.forEach((o, i) => {
    const pos = orbitPosition(o, t, new THREE.Vector3());
    const dist = pos.distanceTo(CAM_POS);
    const scale = NODES[i].df / (2 * Math.tan((FOV * Math.PI) / 360) * dist);
    const w = labelNaturalWidth(NODES[i].label) * scale;
    const h = 13 * scale;
    const labelWorld = pos.clone();
    labelWorld.y += LABEL_Y[i];
    const ls = project(labelWorld);
    rs.push({ name: NODES[i].label, x1: ls.x - w / 2, x2: ls.x + w / 2, y1: ls.y - h / 2, y2: ls.y + h / 2 });
  });
  const pairs = [];
  for (let i = 0; i < rs.length; i++)
    for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i], b = rs[j];
      if (Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) > 0 && Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) > 0)
        pairs.push(a.name + " × " + b.name);
    }
  return pairs;
}
for (const t of detail.slice(0, 8)) {
  console.log("  t=" + t + "s:", checkPairsAt(t).join("; "));
}

/* Детали: подпись на чужой сфере */
function spherePairsAt(t) {
  const rs = [];
  const spheres = [];
  ORBITS.forEach((o, i) => {
    const pos = orbitPosition(o, t, new THREE.Vector3());
    const dist = pos.distanceTo(CAM_POS);
    const scale = NODES[i].df / (2 * Math.tan((FOV * Math.PI) / 360) * dist);
    const w = labelNaturalWidth(NODES[i].label) * scale;
    const h = 13 * scale;
    const labelWorld = pos.clone();
    labelWorld.y += LABEL_Y[i];
    const ls = project(labelWorld);
    rs.push({ name: NODES[i].label, x1: ls.x - w / 2, x2: ls.x + w / 2, y1: ls.y - h / 2, y2: ls.y + h / 2 });
    const ns = project(pos);
    spheres.push({ name: NODES[i].label, cx: ns.x, cy: ns.y, rad: (0.19 * 750) / dist });
  });
  const pairs = [];
  for (const r of rs)
    for (const n of spheres) {
      if (n.name === r.name) continue;
      const dx = Math.max(r.x1 - n.cx, 0, n.cx - r.x2);
      const dy = Math.max(r.y1 - n.cy, 0, n.cy - r.y2);
      if (dx * dx + dy * dy < n.rad * n.rad * 0.64)
        pairs.push(r.name + "→" + n.name + " (r=" + n.rad.toFixed(0) + ")");
    }
  return pairs;
}
for (const t of detail.slice(0, 8)) {
  console.log("  сферы t=" + t + "s:", spherePairsAt(t).join("; "));
}

/* Детали перекрытия на проблемных временах */
console.log("\n=== Какие пары перекрываются ===");
for (const t of [10, 12]) {
  const rs = [];
  ORBITS.forEach((o, i) => {
    const pos = orbitPosition(o, t, new THREE.Vector3());
    const dist = pos.distanceTo(CAM_POS);
    const scale = NODES[i].df / (2 * Math.tan((FOV * Math.PI) / 360) * dist);
    const w = labelNaturalWidth(NODES[i].label) * scale;
    const h = 13 * scale;
    const labelWorld = pos.clone();
    labelWorld.y += LABEL_Y[i];
    const ls = project(labelWorld);
    rs.push({ name: NODES[i].label, x1: ls.x - w / 2, x2: ls.x + w / 2, y1: ls.y - h / 2, y2: ls.y + h / 2 });
  });
  for (let i = 0; i < rs.length; i++)
    for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i], b = rs[j];
      if (Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) > 0 && Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) > 0)
        console.log("  t=" + t + "s:", a.name, "×", b.name);
    }
}
