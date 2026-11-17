"use client";

import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows, Environment, Lightformer } from "@react-three/drei";

/**
 * ─────────────────────────────────────────────────────────────────
 *  МАСКОТ CHARON — 3D-компонент
 *
 *  СЛОТ ПОД МОДЕЛЬ: положите файл `public/models/charon.glb` —
 *  он будет подхвачен автоматически (без правок кода).
 *  Пока модели нет, показывается фирменное «энергетическое ядро»:
 *  графитовая сфера, тёмный глянцевый визор с глазами и звезда-ядро.
 * ─────────────────────────────────────────────────────────────────
 */

const GLB_URL = "/models/charon.glb";

/* ── Геометрия звезды ── */
function useStarGeometry(outer = 0.34, inner = 0.13, depth = 0.09) {
  return React.useMemo(() => {
    const shape = new THREE.Shape();
    const spikes = 4;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.028,
      bevelSegments: 3,
    });
    geo.center();
    return geo;
  }, [outer, inner, depth]);
}

/* ── Поле частиц ── */
function Particles({ count = 130, radius = 3.4 }: { count?: number; radius?: number }) {
  const ref = React.useRef<THREE.Points>(null);

  const geometry = React.useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // сферическое распределение с приплюснутостью
      const r = radius * (0.55 + Math.random() * 0.45);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.6;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count, radius]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.028;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.02}
        color="#b9bcc4"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ── Глаза на визоре (моргание + реакция) ── */
function Eyes({ excitedRef }: { excitedRef: React.MutableRefObject<number> }) {
  const left = React.useRef<THREE.Mesh>(null);
  const right = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // моргание каждые ~4.6с
    const cycle = t % 4.6;
    const blink = cycle > 4.35 ? 0.12 : 1;
    // при «волнении» глаза чуть больше
    const excite = 1 + excitedRef.current * 0.45;
    const sy = blink * excite;
    if (left.current) left.current.scale.set(excite, sy, 1);
    if (right.current) right.current.scale.set(excite, sy, 1);
  });

  const eyeGeo = React.useMemo(() => new THREE.CapsuleGeometry(0.052, 0.05, 4, 10), []);

  return (
    <group position={[0, 0.06, 1.62]}>
      <mesh ref={left} geometry={eyeGeo} position={[-0.21, 0, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#cfd0f6" emissive="#9d97f2" emissiveIntensity={2.4} />
      </mesh>
      <mesh ref={right} geometry={eyeGeo} position={[0.21, 0, 0]}>
        <meshStandardMaterial color="#cfd0f6" emissive="#9d97f2" emissiveIntensity={2.4} />
      </mesh>
    </group>
  );
}

/* ── Фирменное «энергетическое ядро» (фолбэк без GLB) ── */
function CharonCore({ pulseRef }: { pulseRef: React.MutableRefObject<number> }) {
  const group = React.useRef<THREE.Group>(null);
  const body = React.useRef<THREE.Mesh>(null);
  const star = React.useRef<THREE.Mesh>(null);
  const ringA = React.useRef<THREE.Mesh>(null);
  const ringB = React.useRef<THREE.Mesh>(null);
  const sats = React.useRef<THREE.Group>(null);
  const starGeo = useStarGeometry();
  const excitedRef = React.useRef(0);
  const materialsRef = React.useRef<{ star?: THREE.MeshStandardMaterial }>({});

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const pulse = pulseRef.current;

    // постоянное медленное вращение тела
    if (body.current) body.current.rotation.y += delta * 0.16;

    // кольца
    if (ringA.current) {
      ringA.current.rotation.z += delta * 0.22;
      ringA.current.rotation.x = Math.PI / 2.6 + Math.sin(t * 0.4) * 0.07;
    }
    if (ringB.current) {
      ringB.current.rotation.z -= delta * 0.15;
      ringB.current.rotation.y = Math.PI / 3.4 + Math.cos(t * 0.32) * 0.09;
    }

    // спутники на орбитах
    if (sats.current) sats.current.rotation.y += delta * 0.4;

    // пульсация звезды
    if (star.current) {
      const s = 1 + Math.sin(t * 2.1) * 0.05 + pulse * 0.5;
      star.current.scale.setScalar(s);
      star.current.rotation.z = t * 0.35;
    }
    if (materialsRef.current.star) {
      materialsRef.current.star.emissiveIntensity = 1.6 + Math.sin(t * 2.1) * 0.35 + pulse * 4;
    }

    // параллакс на курсор
    if (group.current) {
      const targetY = state.pointer.x * 0.55;
      const targetX = -state.pointer.y * 0.34;
      group.current.rotation.y += (targetY - group.current.rotation.y) * 0.055;
      group.current.rotation.x += (targetX - group.current.rotation.x) * 0.055;
    }

    // затухание «волнения»
    excitedRef.current = Math.max(0, excitedRef.current - delta * 1.4);
  });

  return (
    <group ref={group}>
      {/* Тело — матовый графит */}
      <mesh ref={body} castShadow>
        <sphereGeometry args={[1.32, 64, 64]} />
        <meshPhysicalMaterial
          color="#33363d"
          metalness={0.74}
          roughness={0.34}
          clearcoat={0.55}
          clearcoatRoughness={0.5}
        />
      </mesh>

      {/* Визор — тёмный глянец */}
      <mesh position={[0, 0.08, 0.98]} scale={[0.86, 0.5, 0.42]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhysicalMaterial
          color="#0b0c10"
          metalness={0.55}
          roughness={0.09}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.6}
        />
      </mesh>

      <Eyes excitedRef={excitedRef} />

      {/* Звезда-ядро на «груди» */}
      <mesh ref={star} geometry={starGeo} position={[0, -0.42, 1.14]} rotation={[0.08, 0, 0]}>
        <meshStandardMaterial
          ref={(m) => (materialsRef.current.star = m ?? undefined)}
          color="#b7b1f5"
          emissive="#8f86ee"
          emissiveIntensity={1.8}
          metalness={0.3}
          roughness={0.28}
        />
      </mesh>

      {/* Серебряные орбитальные кольца */}
      <mesh ref={ringA} rotation={[Math.PI / 2.6, 0, 0]}>
        <torusGeometry args={[2.02, 0.014, 12, 140]} />
        <meshStandardMaterial color="#c9ccd3" metalness={1} roughness={0.24} />
      </mesh>
      <mesh ref={ringB} rotation={[Math.PI / 3.4, Math.PI / 3.4, 0]}>
        <torusGeometry args={[2.3, 0.008, 12, 160]} />
        <meshStandardMaterial color="#9aa0ab" metalness={1} roughness={0.32} />
      </mesh>

      {/* Спутники */}
      <group ref={sats}>
        <mesh position={[2.02, 0, 0]}>
          <sphereGeometry args={[0.06, 20, 20]} />
          <meshStandardMaterial color="#b7b1f5" emissive="#8f86ee" emissiveIntensity={2.2} />
        </mesh>
        <mesh position={[-1.44, 0, 1.44]}>
          <sphereGeometry args={[0.045, 20, 20]} />
          <meshStandardMaterial color="#a9c3e8" emissive="#6e93c7" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[-0.9, -0.75, -1.98]}>
          <sphereGeometry args={[0.035, 20, 20]} />
          <meshStandardMaterial color="#cfd2d8" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/* ── GLB-модель (подхватывается автоматически) ── */
function GLBCharon({ pulseRef }: { pulseRef: React.MutableRefObject<number> }) {
  // Динамический импорт, чтобы бандл не тянул GLTFLoader без модели
  const [GltfScene, setGltfScene] = React.useState<THREE.Group | null>(null);

  React.useEffect(() => {
    let disposed = false;
    import("three/examples/jsm/loaders/GLTFLoader.js").then(async ({ GLTFLoader }) => {
      try {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(GLB_URL);
        if (disposed) return;
        const root = gltf.scene;

        // Автоцентрирование и масштаб под сцену
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.9 / maxDim;
        root.scale.setScalar(scale);
        root.position.sub(center.multiplyScalar(scale));
        root.position.y += (size.y * scale) / 2 - 1.15;

        setGltfScene(root);
      } catch {
        /* модель не загрузилась — остаёмся на фолбэке */
      }
    });
    return () => {
      disposed = true;
    };
  }, []);

  const group = React.useRef<THREE.Group>(null);
  const inner = React.useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    // параллакс + мягкое «дыхание» модели
    const targetY = state.pointer.x * 0.5;
    const targetX = -state.pointer.y * 0.3;
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.055;
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.055;
    if (inner.current) {
      inner.current.rotation.y += delta * 0.18;
      const s = 1 + pulseRef.current * 0.06;
      inner.current.scale.setScalar(THREE.MathUtils.lerp(inner.current.scale.x, s, 0.12));
    }
  });

  if (!GltfScene) return <CharonCore pulseRef={pulseRef} />;

  return (
    <group ref={group}>
      <group ref={inner} position={[0, 0.55, 0]}>
        <primitive object={GltfScene} />
      </group>
      {/* Фирменные кольца-орбиты вокруг любой модели */}
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[2.15, 0.01, 10, 150]} />
        <meshStandardMaterial color="#c9ccd3" metalness={1} roughness={0.25} />
      </mesh>
    </group>
  );
}

/* ── Риг: клик-пульс + плавание ── */
function AvatarRig({ hasModel }: { hasModel: boolean }) {
  const pulseRef = React.useRef(0);
  const scaleGroup = React.useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    pulseRef.current = Math.max(0, pulseRef.current - delta * 1.8);
    if (scaleGroup.current) {
      const target = 1 + pulseRef.current * 0.08;
      const s = THREE.MathUtils.lerp(scaleGroup.current.scale.x, target, 0.15);
      scaleGroup.current.scale.setScalar(s);
    }
  });

  const onPointerDown = React.useCallback(() => {
    pulseRef.current = 1;
  }, []);

  return (
    <Float speed={1.6} rotationIntensity={0.22} floatIntensity={0.85} floatingRange={[-0.12, 0.12]}>
      <group onPointerDown={onPointerDown} onClick={onPointerDown}>
        <group ref={scaleGroup}>
          {hasModel ? <GLBCharon pulseRef={pulseRef} /> : <CharonCore pulseRef={pulseRef} />}
        </group>
      </group>
    </Float>
  );
}

/* ── Сцена ── */
export function CharonAvatar({
  className,
  inView = true,
}: {
  className?: string;
  inView?: boolean;
}) {
  const [hasModel, setHasModel] = React.useState(false);
  const wrapper = React.useRef<HTMLDivElement>(null);

  // Проверяем наличие GLB-файла
  React.useEffect(() => {
    let cancelled = false;
    fetch(GLB_URL, { method: "HEAD" })
      .then((res) => {
        if (!cancelled && res.ok) setHasModel(true);
      })
      .catch(() => {
        /* файла нет — используется фирменное ядро */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={wrapper} className={className} data-cursor-label="Вращай">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.35, 7.4], fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ touchAction: "pan-y" }}
        frameloop={inView ? "always" : "never"}
      >
        <React.Suspense fallback={null}>
          <ambientLight intensity={0.32} />
          <directionalLight position={[4, 6, 5]} intensity={1.15} color="#ffffff" />
          {/* Контровой лавандовый */}
          <pointLight position={[-6, 2.4, -3]} intensity={26} color="#9d97f2" distance={16} />
          {/* Контровой голубой */}
          <pointLight position={[6, -1.8, -2.4]} intensity={18} color="#7fa0c8" distance={16} />

          <AvatarRig hasModel={hasModel} />

          <ContactShadows
            position={[0, -2.35, 0]}
            opacity={0.55}
            scale={9}
            blur={2.6}
            far={4.2}
            color="#000000"
          />

          <Environment resolution={256}>
            {/* Локальный «студийный» свет — без внешних ресурсов */}
            <group rotation={[-Math.PI / 3, 0, 0]}>
              <Lightformer form="circle" intensity={4} position={[0, 5, -9]} scale={2} />
              <Lightformer
                form="rect"
                intensity={2.5}
                color="#b7b1f5"
                position={[-5, 1, -1]}
                scale={[3, 0.8]}
              />
              <Lightformer
                form="rect"
                intensity={2}
                color="#a9c3e8"
                position={[5, -1, -1]}
                scale={[3, 0.8]}
              />
              <Lightformer form="rect" intensity={1.2} position={[0, -5, 2]} scale={[4, 1]} />
            </group>
          </Environment>

          <Particles />
        </React.Suspense>
      </Canvas>
    </div>
  );
}

export default CharonAvatar;
