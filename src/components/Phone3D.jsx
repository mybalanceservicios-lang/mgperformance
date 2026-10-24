// iPhone hecho 100% con código (three.js): sin archivos 3D externos.
// Se usa en la portada, en el diagnóstico de cada publicación y para generar imágenes de ejemplo.
import { forwardRef, Suspense, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Float, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/* ---------- medidas (proporción real de un iPhone) ---------- */
const W = 1;
const H = 2.06;
const R = 0.16; // radio de las esquinas
const DEPTH = 0.08;
const BEVEL = 0.022;
const HALF = DEPTH / 2 + BEVEL; // z de cada cara

/* ---------- colores ---------- */
const COLORS = [
  [/titanio desierto|desert/i, '#c4a586'],
  [/titanio natural|natural/i, '#b9b3a9'],
  [/titanio blanco|blanco/i, '#e6e3dd'],
  [/titanio negro|negro|black|grafito|medianoche|midnight|space/i, '#2b2c30'],
  [/morado|purple|púrpura|lila|lavanda/i, '#5b4a72'],
  [/azul alpino|sierra|alpine/i, '#9db6cf'],
  [/ultramarino|ultramarine/i, '#4f68d6'],
  [/verde azulado|teal/i, '#a5cbc6'],
  [/azul|blue/i, '#2f4f78'],
  [/rosa|pink/i, '#f1c7cd'],
  [/verde|green/i, '#b8cfb4'],
  [/amarillo|yellow/i, '#efe2a2'],
  [/rojo|red/i, '#a51d2a'],
  [/dorado|oro|gold/i, '#e3cfa7'],
  [/plata|silver|estelar|starlight/i, '#e9e4da'],
  [/naranja|orange|cosmic/i, '#e07b39']
];
export function phoneColor(name) {
  if (!name) return '#3a3550';
  if (/^#([0-9a-f]{3}){1,2}$/i.test(name)) return name;
  return COLORS.find(([re]) => re.test(name))?.[1] ?? '#3a3550';
}
export function phoneVariant(model = '') {
  if (/pro/i.test(model)) return 'pro';
  if (/air/i.test(model)) return 'air';
  return 'base';
}

/* ---------- geometrías ---------- */
function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function useGeometries() {
  return useMemo(() => {
    const body = new THREE.ExtrudeGeometry(roundedRect(W - BEVEL * 2, H - BEVEL * 2, R - BEVEL), {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 6,
      curveSegments: 24
    });
    body.translate(0, 0, -DEPTH / 2);
    const bezel = new THREE.ShapeGeometry(roundedRect(W - 0.03, H - 0.03, R - 0.015), 24);
    const screen = new THREE.ShapeGeometry(roundedRect(W - 0.09, H - 0.09, R - 0.045), 24);
    // UV de 0..1 para que el fondo de pantalla ocupe todo
    const pos = screen.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = pos.getX(i) / (W - 0.09) + 0.5;
      uv[i * 2 + 1] = pos.getY(i) / (H - 0.09) + 0.5;
    }
    screen.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const island = new THREE.ShapeGeometry(roundedRect(0.3, 0.09, 0.045), 12);
    const bumpPro = new THREE.ExtrudeGeometry(roundedRect(0.46, 0.46, 0.12), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3, curveSegments: 16 });
    const bumpBase = new THREE.ExtrudeGeometry(roundedRect(0.2, 0.42, 0.1), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3, curveSegments: 16 });
    const bumpAir = new THREE.ExtrudeGeometry(roundedRect(W - 0.08, 0.26, 0.11), { depth: 0.014, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 3, curveSegments: 16 });
    return { body, bezel, screen, island, bumpPro, bumpBase, bumpAir };
  }, []);
}

/* Fondo de pantalla estilo iOS (violeta / azul / negro) con la hora y fecha reales del visitante */
let wallpaperTexture = null;
let wallpaperCanvas = null;
let clockTimer = null;

function paintWallpaper() {
  const g = wallpaperCanvas.getContext('2d');
  g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#05030c';
  g.fillRect(0, 0, 512, 1024);
  const blob = (x, y, r, color) => {
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 1024);
  };
  blob(120, 760, 520, 'rgba(91,33,182,0.95)');
  blob(430, 330, 460, 'rgba(37,99,235,0.85)');
  blob(260, 980, 360, 'rgba(147,51,234,0.7)');
  blob(80, 160, 300, 'rgba(14,165,233,0.35)');
  // reloj de la pantalla bloqueada, como en un iPhone real
  const now = new Date();
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  const date = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
  g.textAlign = 'center';
  g.fillStyle = 'rgba(255,255,255,0.72)';
  g.font = '500 30px -apple-system, Inter, sans-serif';
  g.fillText(date, 256, 150);
  g.fillStyle = 'rgba(255,255,255,0.93)';
  g.font = '600 150px -apple-system, Inter, sans-serif';
  g.fillText(time, 256, 300);
  if (wallpaperTexture) wallpaperTexture.needsUpdate = true;
}

function getWallpaper() {
  if (wallpaperTexture) return wallpaperTexture;
  wallpaperCanvas = document.createElement('canvas');
  wallpaperCanvas.width = 512;
  wallpaperCanvas.height = 1024;
  paintWallpaper();
  wallpaperTexture = new THREE.CanvasTexture(wallpaperCanvas);
  wallpaperTexture.colorSpace = THREE.SRGBColorSpace;
  // se redibuja justo al cambiar cada minuto
  const tick = () => {
    paintWallpaper();
    clockTimer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
  };
  clearTimeout(clockTimer);
  clockTimer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
  // repinta cuando carga la tipografía
  document.fonts?.ready.then(paintWallpaper);
  return wallpaperTexture;
}

/* ---------- partes ---------- */
function Lens({ position, r = 0.078 }) {
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.012]}>
        <cylinderGeometry args={[r + 0.014, r + 0.016, 0.03, 40]} />
        <meshStandardMaterial color="#6f6f78" metalness={1} roughness={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.022]}>
        <cylinderGeometry args={[r, r, 0.022, 40]} />
        <meshPhysicalMaterial color="#05060a" roughness={0.05} metalness={0.3} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0, 0.0335]}>
        <circleGeometry args={[r * 0.45, 32]} />
        <meshPhysicalMaterial color="#0c1022" roughness={0} metalness={0.5} clearcoat={1} emissive="#140a2e" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function CameraModule({ variant, color, geos }) {
  const glass = <meshPhysicalMaterial color={color} roughness={0.12} metalness={0.25} clearcoat={1} clearcoatRoughness={0.1} />;
  if (variant === 'air') {
    return (
      <group position={[0, H / 2 - 0.2, 0]}>
        <mesh geometry={geos.bumpAir}>{glass}</mesh>
        <Lens position={[-0.28, 0, 0.012]} r={0.07} />
        <mesh position={[0.05, 0, 0.026]}>
          <circleGeometry args={[0.022, 20]} />
          <meshStandardMaterial color="#f6f1dc" emissive="#3b3420" />
        </mesh>
      </group>
    );
  }
  if (variant === 'pro') {
    return (
      <group position={[-W / 2 + 0.3, H / 2 - 0.3, 0]}>
        <mesh geometry={geos.bumpPro}>{glass}</mesh>
        <Lens position={[-0.1, 0.105, 0.012]} />
        <Lens position={[-0.1, -0.105, 0.012]} />
        <Lens position={[0.1, 0, 0.012]} />
        <mesh position={[0.12, 0.15, 0.026]}>
          <circleGeometry args={[0.025, 20]} />
          <meshStandardMaterial color="#f6f1dc" emissive="#3b3420" />
        </mesh>
        <mesh position={[0.12, -0.15, 0.026]}>
          <circleGeometry args={[0.022, 20]} />
          <meshStandardMaterial color="#111" roughness={0.2} />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[-W / 2 + 0.2, H / 2 - 0.3, 0]}>
      <mesh geometry={geos.bumpBase}>{glass}</mesh>
      <Lens position={[0, 0.1, 0.012]} r={0.07} />
      <Lens position={[0, -0.1, 0.012]} r={0.07} />
      <mesh position={[0.17, 0.12, 0.004]}>
        <circleGeometry args={[0.024, 20]} />
        <meshStandardMaterial color="#f6f1dc" emissive="#3b3420" />
      </mesh>
    </group>
  );
}

function Hotspot({ mark, active, onSelect }) {
  const ring = useRef();
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const t = (clock.elapsedTime * 1.4) % 1;
    ring.current.scale.setScalar(1 + t * 1.6);
    ring.current.material.opacity = 0.7 * (1 - t);
  });
  const x = (mark.x ?? 0) * (W / 2) * 0.86;
  const y = (mark.y ?? 0) * (H / 2) * 0.92;
  const color = active ? '#ffffff' : '#ff9f0a';
  return (
    <group position={[x, y, 0.012]}>
      <mesh
        onClick={e => {
          e.stopPropagation();
          onSelect?.(mark);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <circleGeometry args={[0.045, 32]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <circleGeometry args={[0.018, 24]} />
        <meshBasicMaterial color="#1a0f00" toneMapped={false} />
      </mesh>
      <mesh ref={ring} position={[0, 0, -0.001]}>
        <ringGeometry args={[0.05, 0.062, 40]} />
        <meshBasicMaterial color={color} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

export function PhoneModel({ color = '#3a3550', variant = 'pro', marks = [], activeMark, onMark, screenOn = true, ...props }) {
  const geos = useGeometries();
  const tint = useMemo(() => new THREE.Color(color), [color]);
  const frame = useMemo(() => tint.clone().lerp(new THREE.Color('#9a9aa0'), 0.35), [tint]);
  const wallpaper = useMemo(() => (typeof document !== 'undefined' ? getWallpaper() : null), []);

  return (
    <group {...props}>
      {/* cuerpo: [0] tapas (vidrio trasero) · [1] marco */}
      <mesh geometry={geos.body} castShadow>
        <meshPhysicalMaterial attach="material-0" color={tint} roughness={0.42} metalness={0.15} clearcoat={0.6} clearcoatRoughness={0.4} />
        <meshStandardMaterial attach="material-1" color={frame} roughness={0.22} metalness={0.95} />
      </mesh>

      {/* frente */}
      <group position={[0, 0, HALF + 0.0005]}>
        <mesh geometry={geos.bezel}>
          <meshStandardMaterial color="#020203" roughness={0.15} />
        </mesh>
        <mesh geometry={geos.screen} position={[0, 0, 0.0008]}>
          {screenOn && wallpaper ? (
            <meshBasicMaterial map={wallpaper} toneMapped={false} />
          ) : (
            <meshPhysicalMaterial color="#050507" roughness={0.05} clearcoat={1} />
          )}
        </mesh>
        <mesh geometry={geos.island} position={[0, H / 2 - 0.115, 0.0016]}>
          <meshBasicMaterial color="#000" />
        </mesh>
        {marks.filter(m => m.side === 'front').map(m => (
          <Hotspot key={m.id} mark={m} active={activeMark === m.id} onSelect={onMark} />
        ))}
      </group>

      {/* dorso (visto desde atrás: x positivo = derecha de quien mira) */}
      <group position={[0, 0, -HALF - 0.0005]} rotation={[0, Math.PI, 0]}>
        <CameraModule variant={variant} color={tint} geos={geos} />
        {marks.filter(m => m.side === 'back').map(m => (
          <Hotspot key={m.id} mark={m} active={activeMark === m.id} onSelect={onMark} />
        ))}
      </group>

      {/* botones laterales */}
      <mesh position={[W / 2 + 0.004, 0.35, 0]}>
        <boxGeometry args={[0.02, 0.28, 0.05]} />
        <meshStandardMaterial color={frame} metalness={0.95} roughness={0.25} />
      </mesh>
      {[0.55, 0.3].map(y => (
        <mesh key={y} position={[-W / 2 - 0.004, y, 0]}>
          <boxGeometry args={[0.02, 0.18, 0.05]} />
          <meshStandardMaterial color={frame} metalness={0.95} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/* Luces de estudio sin descargar nada (reflejos tipo foto de producto) */
export function StudioLights({ intensity = 1 }) {
  return (
    <>
      <ambientLight intensity={0.35 * intensity} />
      <directionalLight position={[3, 4, 5]} intensity={1.6 * intensity} />
      <directionalLight position={[-4, 2, -3]} intensity={0.9 * intensity} color="#a78bfa" />
      <pointLight position={[0, -3, 3]} intensity={6 * intensity} color="#3b82f6" />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.2} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer intensity={1.4} position={[-5, 0, 1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#8b5cf6" />
        <Lightformer intensity={1.4} position={[5, 0, 1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} color="#3b82f6" />
        <Lightformer intensity={0.8} position={[0, -4, -3]} scale={[8, 2, 1]} />
      </Environment>
    </>
  );
}

/* ---------- Portada: varios iPhones flotando ---------- */
const HERO_PHONES = [
  { color: '#c4a586', variant: 'pro', position: [0.15, 0.05, 0.6], rotation: [0.05, -0.55, 0.08], back: true },
  { color: '#5b4a72', variant: 'pro', position: [-1.35, -0.25, -0.4], rotation: [0.1, 0.5, -0.12], back: false },
  { color: '#2f4f78', variant: 'base', position: [1.55, -0.15, -0.5], rotation: [-0.05, 2.7, 0.1], back: true },
  { color: '#f1c7cd', variant: 'base', position: [-0.55, 1.15, -1.6], rotation: [0.2, 3.4, 0.25], back: true },
  { color: '#e6e3dd', variant: 'air', position: [1.0, 1.25, -1.9], rotation: [0.15, -0.4, -0.2], back: false }
];

function Parallax({ children }) {
  const group = useRef();
  const { pointer } = useThree();
  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, pointer.x * 0.25, 3, dt);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -pointer.y * 0.12, 3, dt);
  });
  return <group ref={group}>{children}</group>;
}

export function HeroPhones({ className }) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 6], fov: 32 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <StudioLights />
          <Parallax>
            {HERO_PHONES.map((p, i) => (
              <Float key={i} speed={1.2 + i * 0.15} rotationIntensity={0.35} floatIntensity={0.7}>
                <PhoneModel color={p.color} variant={p.variant} position={p.position} rotation={p.rotation} />
              </Float>
            ))}
          </Parallax>
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ---------- Visor de diagnóstico: se gira con el dedo, puntos tocables ---------- */
function SpinIntro({ controls, enabled }) {
  useFrame((_, dt) => {
    if (enabled.current && controls.current) {
      controls.current.setAzimuthalAngle(controls.current.getAzimuthalAngle() + dt * 0.5);
      controls.current.update();
    }
  });
  return null;
}

export const PhoneViewer = forwardRef(function PhoneViewer({ color, variant, marks, activeMark, onMark, className }, ref) {
  const controls = useRef();
  const spinning = useRef(true);
  const [target, setTarget] = useState(null);

  useImperativeHandle(ref, () => ({
    show(side) {
      spinning.current = false;
      setTarget(side === 'back' ? Math.PI : 0);
    }
  }));

  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 6], fov: 30 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Suspense fallback={null}>
          <StudioLights />
          <PhoneModel color={color} variant={variant} marks={marks} activeMark={activeMark} onMark={onMark} />
          <ContactShadows position={[0, -1.25, 0]} opacity={0.5} scale={5} blur={2.6} far={2} color="#1e1036" />
          <OrbitControls
            ref={controls}
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 2 - 0.5}
            maxPolarAngle={Math.PI / 2 + 0.5}
            onStart={() => {
              spinning.current = false;
              setTarget(null);
            }}
          />
          <SpinIntro controls={controls} enabled={spinning} />
          <TurnTo controls={controls} target={target} onDone={() => setTarget(null)} />
        </Suspense>
      </Canvas>
    </div>
  );
});

function TurnTo({ controls, target, onDone }) {
  useFrame((_, dt) => {
    const c = controls.current;
    if (target == null || !c) return;
    const cur = c.getAzimuthalAngle();
    let diff = target - cur;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    if (Math.abs(diff) < 0.01) {
      onDone();
      return;
    }
    c.setAzimuthalAngle(cur + diff * Math.min(1, dt * 6));
    c.update();
  });
  return null;
}

/* ---------- Estudio: para sacar "fotos" del modelo ---------- */
export function PhoneStudio({ color, variant, view = 'angle', className }) {
  const rot = { front: [0, 0, 0], back: [0, Math.PI, 0], angle: [0.12, -0.5, 0.06], backangle: [0.1, Math.PI + 0.55, -0.05], side: [0, Math.PI / 2 - 0.25, 0] }[view] ?? [0, 0, 0];
  const Spin = () => {
    const g = useRef();
    useFrame((_, dt) => {
      if (view === 'spin' && g.current) g.current.rotation.y += dt * 1.2;
    });
    return (
      <group ref={g} rotation={rot}>
        <PhoneModel color={color} variant={variant} />
      </group>
    );
  };
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 5.4], fov: 30 }} dpr={2} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} shadows>
        <Suspense fallback={null}>
          <StudioLights />
          <Spin />
          <ContactShadows position={[0, -1.22, 0]} opacity={0.55} scale={5} blur={2.4} far={2} color="#000" />
        </Suspense>
      </Canvas>
    </div>
  );
}

export function useIsLowPower() {
  const [low, setLow] = useState(false);
  useEffect(() => {
    setLow(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);
  return low;
}
