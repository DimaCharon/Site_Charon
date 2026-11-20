import { assetUrl } from "../config/routes";
import { copy } from "../config/site";
import * as T from "three";

type Point = [number, number];
const outline: Point[] = [
  [1.36, 0.81],
  [0.72, 1.44],
  [-0.54, 1.44],
  [-1.41, 0.58],
  [-1.41, -0.58],
  [-0.54, -1.44],
  [0.72, -1.44],
  [1.36, -0.81],
  [0.79, -0.26],
  [0.33, -0.71],
  [-0.23, -0.71],
  [-0.68, -0.26],
  [-0.68, 0.26],
  [-0.23, 0.71],
  [0.33, 0.71],
  [0.79, 0.26],
];
function extrude(p: Point[], depth: number, bevel: number) {
  const s = new T.Shape();
  // Rounded, individually machined panels. No clipping of a concave silhouette.
  p.forEach((v, i) => {
    const prev = p[(i + p.length - 1) % p.length],
      next = p[(i + 1) % p.length];
    const lp = Math.hypot(prev[0] - v[0], prev[1] - v[1]),
      ln = Math.hypot(next[0] - v[0], next[1] - v[1]);
    const r = Math.min(0.086, lp * 0.16, ln * 0.16);
    const ax = v[0] + ((prev[0] - v[0]) * r) / lp,
      ay = v[1] + ((prev[1] - v[1]) * r) / lp;
    const bx = v[0] + ((next[0] - v[0]) * r) / ln,
      by = v[1] + ((next[1] - v[1]) * r) / ln;
    if (i === 0) s.moveTo(ax, ay);
    else s.lineTo(ax, ay);
    s.quadraticCurveTo(v[0], v[1], bx, by);
  });
  s.closePath();
  const geom = new T.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 6,
    steps: 1,
    curveSegments: 4,
  });
  const normal = geom.attributes.normal,
    position = geom.attributes.position;
  const v = new T.Vector3();
  for (let i = 0; i < normal.count; i++) {
    if (normal.getZ(i) > 0.91) {
      v.set(
        normal.getX(i) + position.getX(i) * 0.105,
        normal.getY(i) + position.getY(i) * 0.095,
        normal.getZ(i),
      ).normalize();
      normal.setXYZ(i, v.x, v.y, v.z);
    }
  }
  return geom;
}
// The studio's original HDR reflections are pre-convolved offline. Loading
// the small half-float lookup avoids a costly GPU convolution at startup.
let studioData:
  | Promise<{ data: Uint16Array; width: number; height: number }>
  | undefined;
async function materials() {
  studioData ??= new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Studio lighting unavailable"));
    image.src = assetUrl("art/studio-lut.png");
  }).then((image) => {
    // The PNG stores log-encoded HDR radiance, not a display image. Preserve
    // the original CubeUV layout (including all roughness levels).
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
    const table = Uint16Array.from({ length: 256 }, (_, i) =>
      T.DataUtils.toHalfFloat(Math.expm1(i / 100)),
    );
    const data = new Uint16Array(pixels.length);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = table[pixels[i]];
      data[i + 1] = table[pixels[i + 1]];
      data[i + 2] = table[pixels[i + 2]];
      data[i + 3] = 0x3c00;
    }
    return { data, width: image.width, height: image.height };
  });
  const [lut, brush] = await Promise.all([
    studioData,
    new T.TextureLoader().loadAsync(assetUrl("art/brushed.webp")),
  ]);
  const env = new T.DataTexture(
    lut.data,
    lut.width,
    lut.height,
    T.RGBAFormat,
    T.HalfFloatType,
  );
  env.mapping = T.CubeUVReflectionMapping;
  env.colorSpace = T.LinearSRGBColorSpace;
  env.minFilter = env.magFilter = T.LinearFilter;
  env.generateMipmaps = false;
  env.needsUpdate = true;
  brush.wrapS = brush.wrapT = T.RepeatWrapping;
  brush.repeat.set(0.5, 0.5);
  brush.colorSpace = T.SRGBColorSpace;
  brush.anisotropy = 4;
  return { env, brush };
}
function makeArtifact(brush: T.Texture) {
  const group = new T.Group();
  const silver = new T.MeshPhysicalMaterial({
    color: 0xd6d7de,
    metalness: 1,
    roughness: 0.235,
    map: brush,
    bumpMap: brush,
    bumpScale: 0.0045,
    clearcoat: 0.15,
    clearcoatRoughness: 0.23,
    anisotropy: 0.52,
    envMapIntensity: 1.2,
  });
  const polished = silver.clone();
  polished.color.set(0xe5e4e9);
  polished.roughness = 0.215;
  const graphite = new T.MeshStandardMaterial({
    color: 0x4a4a55,
    metalness: 0.92,
    roughness: 0.3,
    envMapIntensity: 0.8,
    map: brush,
  });
  const dark = new T.MeshStandardMaterial({
    color: 0x14161d,
    metalness: 0.7,
    roughness: 0.39,
  });
  const lavender = new T.MeshStandardMaterial({
    color: 0xa78ae2,
    emissive: 0x8064b9,
    emissiveIntensity: 0.25,
    metalness: 0.52,
    roughness: 0.3,
    envMapIntensity: 0.55,
  });
  const shell = (
    p: Point[],
    z: number,
    d: number,
    bevel: number,
    material: T.Material,
    scale = 1,
  ) => {
    const m = new T.Mesh(extrude(p, d, bevel), material);
    m.position.z = z;
    m.scale.set(scale, scale, 1);
    group.add(m);
    return m;
  };
  // A machined identity mark, deliberately not a substitute character or mascot.
  shell(outline, -0.585, 0.21, 0.038, graphite, 0.987);
  shell(outline, -0.324, 0.055, 0.014, lavender, 1.008);
  shell(outline, -0.214, 0.3, 0.038, graphite);
  shell(outline, 0.137, 0.053, 0.014, dark, 0.995);
  const main: Point[] = [
    [-0.02, 1.44],
    ...outline.slice(2, 6),
    [0.15, -1.44],
    [-0.05, -0.71],
    ...outline.slice(10, 14),
    [0.12, 0.71],
  ];
  const top: Point[] = [
    outline[0],
    outline[1],
    [0.085, 1.44],
    [0.225, 0.71],
    outline[14],
    outline[15],
  ];
  const bottom: Point[] = [
    [0.255, -1.44],
    ...outline.slice(6, 10),
    [0.055, -0.71],
  ];
  shell(main, 0.215, 0.132, 0.04, silver);
  shell(top, 0.215, 0.132, 0.04, polished);
  shell(bottom, 0.215, 0.132, 0.04, silver);
  // Precisely spaced ceramic inlays on the upper arm.
  for (let i = 0; i < 3; i++) {
    const slot = new T.Mesh(
      new T.BoxGeometry(0.034, 0.236, 0.007),
      i === 1 ? lavender : dark,
    );
    slot.position.set(0.9 + i * 0.067, 0.88 - i * 0.067, 0.39);
    slot.rotation.z = -0.785;
    group.add(slot);
  }
  // Recessed fasteners: dark socket, narrow metallic shoulder, torx-like inset.
  for (const [x, y] of [
    [-1.25, 0.47],
    [-1.24, -0.48],
    [0.55, -1.12],
  ]) {
    const rim = new T.Mesh(
      new T.CylinderGeometry(0.037, 0.037, 0.01, 24),
      polished,
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, y, 0.391);
    group.add(rim);
    const screw = new T.Mesh(new T.CircleGeometry(0.027, 24), graphite);
    screw.position.set(x, y, 0.397);
    group.add(screw);
    const socket = new T.Mesh(new T.CircleGeometry(0.014, 6), dark);
    socket.position.set(x, y, 0.398);
    group.add(socket);
  }
  const label = document.createElement("canvas");
  label.width = 1024;
  label.height = 220;
  const ctx = label.getContext("2d")!;
  ctx.fillStyle = "#23252c";
  ctx.textAlign = "center";
  ctx.font = "600 122px Arial, sans-serif";
  ctx.fillText([...copy["studio.engraving"]].join(" "), 512, 121, 970);
  ctx.font = "32px monospace";
  ctx.fillStyle = "#44464e";
  ctx.fillText([...copy["studio.engravingSub"]].join(" "), 512, 183, 970);
  const lt = new T.CanvasTexture(label);
  lt.colorSpace = T.SRGBColorSpace;
  lt.anisotropy = 8;
  const lm = new T.Mesh(
    new T.PlaneGeometry(0.94, 0.202),
    new T.MeshBasicMaterial({
      map: lt,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );
  lm.position.set(-1.055, 0.01, 0.391);
  lm.rotation.z = Math.PI / 2;
  group.add(lm);
  for (let i = 0; i < 7; i++) {
    const g = new T.Mesh(
      new T.BoxGeometry(0.012, 0.14 + (i % 3) * 0.035, 0.003),
      graphite,
    );
    g.position.set(-0.23 + i * 0.032, -1.03, 0.389);
    group.add(g);
  }
  return group;
}
export type StudioOptions = {
  wire: boolean;
  paused: boolean;
  reduced: boolean;
  active: boolean;
};
export type StudioAPI = {
  set: (options: StudioOptions) => void;
  turn: (x: number, y: number) => void;
  reset: () => void;
  snapshot: () => string;
  dispose: () => void;
};
function release(root: T.Object3D) {
  const materials = new Set<T.Material>(),
    textures = new Set<T.Texture>();
  root.traverse((o) => {
    if (o instanceof T.Mesh) {
      o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        materials.add(m);
    }
  });
  for (const m of materials) {
    for (const v of Object.values(m))
      if (v instanceof T.Texture) textures.add(v);
    m.dispose();
  }
  textures.forEach((t) => t.dispose());
}
export async function createStudio(
  host: HTMLDivElement,
  options: StudioOptions,
  onModel: (mascot: boolean) => void,
): Promise<StudioAPI> {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
    premultipliedAlpha: true,
  });
  if (!gl) throw new Error("WebGL2 is not available");
  const renderer = new T.WebGLRenderer({
    canvas,
    context: gl,
    alpha: true,
    antialias: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(
    Math.min(devicePixelRatio || 1, innerWidth < 720 ? 1.45 : 1.7),
  );
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(29, 1, 0.1, 100);
  camera.position.z = 8;
  const { env, brush } = await materials();
  scene.environment = env;
  scene.environmentRotation.y = 1.16;
  const key = new T.DirectionalLight(0xf8f8ff, 2.1);
  key.position.set(-3, 6, 5);
  scene.add(key);
  const edge = new T.DirectionalLight(0xa89cdb, 1.0);
  edge.position.set(4, 0, -2);
  scene.add(edge);
  scene.add(new T.AmbientLight(0xc9cbd7, 0.35));
  const pivot = new T.Group();
  scene.add(pivot);
  let model: T.Object3D = makeArtifact(brush);
  pivot.add(model);
  let mixer: T.AnimationMixer | null = null;
  const wire = new T.MeshBasicMaterial({
    color: 0xb4a5e6,
    wireframe: true,
    transparent: true,
    opacity: 0.64,
  });
  const originals = new Map<T.Mesh, T.Material | T.Material[]>();
  function remember() {
    originals.clear();
    model.traverse((o) => {
      if (o instanceof T.Mesh) originals.set(o, o.material);
    });
  }
  remember();
  let destroyed = false,
    visible = true,
    opts = { ...options },
    raf = 0,
    last = 0,
    time = 0,
    dragX = 0,
    dragY = 0,
    ptX = 0,
    ptY = 0,
    rx = 0.23,
    ry = -0.54,
    dragging = false,
    startX = 0,
    startY = 0,
    calm = 0;
  const applyMaterial = () => {
    originals.forEach((original, o) => {
      o.material = opts.wire ? wire : original;
    });
  };
  function draw(now: number, force = false) {
    raf = 0;
    if (destroyed) return;
    if (!force && (!visible || document.hidden || !opts.active)) return;
    const dt = Math.min((now - last) / 1000, 0.06);
    if (!force && now - last < 1000 / 30) {
      raf = requestAnimationFrame((t) => draw(t));
      return;
    }
    last = now;
    const moving = !opts.paused && !opts.reduced;
    if (moving) time += dt;
    const targetX =
        0.23 +
        dragX +
        (opts.reduced ? 0 : ptY * 0.052) +
        (moving ? Math.sin(time * 0.31) * 0.023 : 0),
      targetY =
        -0.54 +
        dragY +
        (opts.reduced ? 0 : ptX * 0.12) +
        (moving ? Math.sin(time * 0.13) * 0.15 : 0);
    const k = opts.reduced ? 1 : 1 - Math.exp(-dt * 11);
    rx += (targetX - rx) * k;
    ry += (targetY - ry) * k;
    scene.environmentRotation.y = 1.16 + (opts.reduced ? 0 : ptX * 0.095);
    pivot.rotation.set(
      rx,
      ry,
      -0.36 + (moving ? Math.sin(time * 0.19) * 0.011 : 0),
    );
    pivot.position.y = 0.065 + (moving ? Math.sin(time * 0.67) * 0.035 : 0);
    if (moving) mixer?.update(dt);
    renderer.render(scene, camera);
    const easing = Math.abs(rx - targetX) + Math.abs(ry - targetY) > 0.001;
    if (moving || easing || dragging || calm > 0) {
      calm = Math.max(0, calm - 1);
      if (visible && !document.hidden && opts.active)
        raf = requestAnimationFrame((t) => draw(t));
    }
  }
  const kick = () => {
    if (!raf && !destroyed && visible && opts.active && !document.hidden)
      raf = requestAnimationFrame((t) => draw(t));
  };
  function resize() {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const ratio = r.width / r.height;
    const vertical = ratio < 1 ? 4.07 / ratio : 4.03;
    camera.aspect = ratio;
    camera.position.z =
      vertical / (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)));
    camera.updateProjectionMatrix();
    renderer.setSize(r.width, r.height, false);
    calm = 2;
    kick();
  }
  function down(e: PointerEvent) {
    if (e.button !== 0) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    host.setPointerCapture(e.pointerId);
    host.classList.add("dragging");
    kick();
  }
  function move(e: PointerEvent) {
    const b = host.getBoundingClientRect();
    ptX = ((e.clientX - b.left) / b.width) * 2 - 1;
    ptY = ((e.clientY - b.top) / b.height) * 2 - 1;
    if (dragging) {
      dragY += (e.clientX - startX) * 0.009;
      dragX = T.MathUtils.clamp(
        dragX + (e.clientY - startY) * 0.006,
        -1.15,
        1.15,
      );
      startX = e.clientX;
      startY = e.clientY;
    }
    calm = 2;
    kick();
  }
  function up() {
    dragging = false;
    host.classList.remove("dragging");
    calm = 3;
    kick();
  }
  function leave() {
    ptX = ptY = 0;
    kick();
  }
  function visibility() {
    if (document.hidden) (cancelAnimationFrame(raf), (raf = 0));
    else kick();
  }
  await renderer.compileAsync(scene, camera);
  host.appendChild(canvas);
  canvas.setAttribute("aria-hidden", "true");
  host.addEventListener("pointerdown", down);
  host.addEventListener("pointermove", move);
  host.addEventListener("pointerup", up);
  host.addEventListener("pointercancel", up);
  host.addEventListener("lostpointercapture", up);
  host.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", visibility);
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) kick();
    else {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  io.observe(host);
  resize();
  applyMaterial();
  cancelAnimationFrame(raf);
  raf = 0;
  draw(performance.now(), true);
  onModel(false);
  if (__HAS_MASCOT__) {
    void import("three/addons/loaders/GLTFLoader.js")
      .then(async ({ GLTFLoader }) => {
        const gltf = await new GLTFLoader().loadAsync(
          assetUrl("models/charon.glb"),
        );
        if (destroyed) {
          release(gltf.scene);
          return;
        }
        originals.forEach((m, o) => {
          o.material = m;
        });
        pivot.remove(model);
        release(model);
        model = gltf.scene;
        const box = new T.Box3().setFromObject(model);
        const extent = box.getSize(new T.Vector3());
        const scale = 2.95 / Math.max(extent.x, extent.y, extent.z, 0.001);
        model.scale.multiplyScalar(scale);
        model.position.sub(
          box.getCenter(new T.Vector3()).multiplyScalar(scale),
        );
        pivot.add(model);
        remember();
        applyMaterial();
        if (gltf.animations.length) {
          mixer = new T.AnimationMixer(model);
          const idle =
            gltf.animations.find((a) => /idle|wait|breath/i.test(a.name)) ||
            gltf.animations[0];
          mixer.clipAction(idle).play();
        }
        onModel(true);
        calm = 2;
        kick();
      })
      .catch(() => {
        /* A damaged optional asset never blocks the portfolio. */
      });
  }
  return {
    set(next) {
      opts = { ...next };
      applyMaterial();
      calm = 2;
      if (!opts.active) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else kick();
    },
    turn(x, y) {
      dragY += x;
      dragX = T.MathUtils.clamp(dragX + y, -1.15, 1.15);
      calm = 2;
      kick();
    },
    reset() {
      dragX = dragY = ptX = ptY = time = 0;
      calm = 2;
      kick();
    },
    snapshot() {
      renderer.render(scene, camera);
      return canvas.toDataURL("image/png");
    },
    dispose() {
      destroyed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerup", up);
      host.removeEventListener("pointercancel", up);
      host.removeEventListener("lostpointercapture", up);
      host.removeEventListener("pointerleave", leave);
      mixer?.stopAllAction();
      originals.forEach((m, o) => {
        o.material = m;
      });
      release(model);
      wire.dispose();
      env.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
