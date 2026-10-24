// iPhone hecho 100% con código (three.js): sin archivos 3D externos.
// Se usa en la portada, en el diagnóstico de cada publicación y para generar imágenes de ejemplo.
import { createContext, forwardRef, Suspense, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

// Modo liviano (vitrina): materiales simples y sin detalles chicos, para que la página no se trabe
const Lite = createContext(false);
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Float, Lightformer, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/* ---------- Canvas seguro ----------
   · libera la memoria de gráficos al salir de la pantalla (clave en iPhone/Safari)
   · baja la resolución en celulares
   · se pausa cuando no está a la vista
   · si el navegador corta los gráficos, se oculta en vez de romper la página */
const isMobile = typeof navigator !== 'undefined' && /iphone|ipad|ipod|android/i.test(navigator.userAgent);

function ReleaseOnUnmount() {
  const gl = useThree(s => s.gl);
  useEffect(
    () => () => {
      try {
        gl.dispose();
        gl.forceContextLoss();
      } catch {
        /* ya liberado */
      }
    },
    [gl]
  );
  return null;
}

function ReadySignal({ onReady }) {
  const n = useRef(0);
  useFrame(() => {
    n.current += 1;
    if (n.current === 3) onReady?.();
  });
  return null;
}

function SafeCanvas({ children, dpr = [1, 2], gl, keepRendering = false, ...props }) {
  const wrap = useRef(null);
  const [visible, setVisible] = useState(true);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    if (keepRendering || !wrap.current) return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, [keepRendering]);

  if (lost) return null;
  const maxDpr = isMobile ? Math.min(1.5, Array.isArray(dpr) ? dpr[1] : dpr) : Array.isArray(dpr) ? dpr[1] : dpr;
  return (
    <div ref={wrap} className="h-full w-full">
      <Canvas
        {...props}
        dpr={[1, maxDpr]}
        frameloop={visible ? 'always' : 'never'}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: 'default', ...gl }}
        onCreated={({ gl: renderer }) => {
          renderer.domElement.addEventListener('webglcontextlost', e => {
            e.preventDefault();
            setLost(true);
          });
        }}
      >
        {children}
        <ReleaseOnUnmount />
      </Canvas>
    </div>
  );
}

/* ---------- medidas (proporción real de un iPhone) ---------- */
const W = 1;
const H = 2.06;
const R = 0.16; // radio de las esquinas
const DEPTH = 0.08;
const BEVEL = 0.022;
const HALF = DEPTH / 2 + BEVEL; // z de cada cara

/* ---------- colores ---------- */
const COLORS = [
  [/naranja c[oó]smico|cosmic orange/i, '#e8762e'],
  [/azul profundo|deep blue/i, '#33456b'],
  [/azul cielo|sky blue/i, '#bcd3e6'],
  [/azul niebla|mist blue/i, '#b7c7d9'],
  [/lavanda|lavender/i, '#c9bde3'],
  [/salvia|sage/i, '#b9c8b0'],
  [/dorado claro|light gold/i, '#e7d7b5'],
  [/blanco nube|cloud white/i, '#f0eeea'],
  [/negro espacial|space black/i, '#26272b'],
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
  if (/1[7-9]\s*pro/i.test(model)) return 'pro17';
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

let GEOS = null;
function useGeometries() {
  return useMemo(() => {
    if (GEOS) return GEOS;
    const body = new THREE.ExtrudeGeometry(roundedRect(W - BEVEL * 2, H - BEVEL * 2, R - BEVEL), {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 8,
      curveSegments: 32
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
    // iPhone 17 Pro: meseta de cámaras de lado a lado + ventana de vidrio para las lentes
    const plateau = new THREE.ExtrudeGeometry(roundedRect(W - 0.05, 0.58, 0.13), { depth: 0.016, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 4, curveSegments: 20 });
    const lensWindow = new THREE.ShapeGeometry(roundedRect(0.5, 0.5, 0.13), 20);
    const port = new THREE.ShapeGeometry(roundedRect(0.13, 0.034, 0.017), 10);
    GEOS = { body, bezel, screen, island, bumpPro, bumpBase, bumpAir, plateau, lensWindow, port };
    return GEOS;
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
// Textura de lente de cámara: vidrio oscuro con anillos internos, recubrimiento violeta y un brillo
let lensTexture = null;
function getLensTexture() {
  if (lensTexture) return lensTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const cx = 128;
  g.fillStyle = '#07080c';
  g.beginPath();
  g.arc(cx, cx, 128, 0, Math.PI * 2);
  g.fill();
  // borde interior gris (montura de la lente)
  let grad = g.createRadialGradient(cx, cx, 90, cx, cx, 128);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.7, 'rgba(70,72,82,0.9)');
  grad.addColorStop(1, 'rgba(20,20,26,1)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  // anillos concéntricos de los elementos ópticos
  for (const [r, a] of [[96, 0.35], [74, 0.28], [52, 0.25]]) {
    g.strokeStyle = `rgba(150,155,185,${a})`;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(cx, cx, r, 0, Math.PI * 2);
    g.stroke();
  }
  // recubrimiento antirreflejo (violeta / azul)
  grad = g.createRadialGradient(cx - 10, cx - 10, 4, cx, cx, 70);
  grad.addColorStop(0, 'rgba(40,20,90,0.95)');
  grad.addColorStop(0.5, 'rgba(60,50,150,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(cx, cx, 70, 0, Math.PI * 2);
  g.fill();
  // pupila
  g.fillStyle = '#020204';
  g.beginPath();
  g.arc(cx, cx, 22, 0, Math.PI * 2);
  g.fill();
  // brillo de luz
  grad = g.createRadialGradient(cx - 38, cx - 42, 0, cx - 38, cx - 42, 30);
  grad.addColorStop(0, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  lensTexture = new THREE.CanvasTexture(c);
  lensTexture.colorSpace = THREE.SRGBColorSpace;
  return lensTexture;
}

function Lens({ position, r = 0.078, ring = '#9a9ca4' }) {
  const tex = useMemo(() => (typeof document !== 'undefined' ? getLensTexture() : null), []);
  return (
    <group position={position}>
      {/* aro elevado del color del equipo */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.013]}>
        <cylinderGeometry args={[r + 0.017, r + 0.019, 0.026, 48]} />
        <meshStandardMaterial color={ring} metalness={0.45} roughness={0.3} />
      </mesh>
      {/* vidrio de la lente */}
      <mesh position={[0, 0, 0.0265]}>
        <circleGeometry args={[r, 48]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Flash({ position, r = 0.025 }) {
  return (
    <mesh position={position}>
      <circleGeometry args={[r, 24]} />
      <meshStandardMaterial color="#f3ead0" emissive="#5a4e2c" emissiveIntensity={0.6} roughness={0.4} />
    </mesh>
  );
}

function CameraModule({ variant, color, geos }) {
  const ring = color.clone().lerp(new THREE.Color('#000000'), 0.12).getStyle();
  const steel = color.clone().lerp(new THREE.Color('#a6a8ae'), 0.5).getStyle();
  const lite = useContext(Lite);
  const glass = lite ? <meshStandardMaterial color={color} roughness={0.22} metalness={0.2} /> : <meshPhysicalMaterial color={color} roughness={0.12} metalness={0.25} clearcoat={1} clearcoatRoughness={0.1} />;
  if (variant === 'air') {
    return (
      <group position={[0, H / 2 - 0.2, 0]}>
        <mesh geometry={geos.bumpAir}>{glass}</mesh>
        <Lens position={[-0.28, 0, 0.012]} r={0.072} ring={ring} />
        <Flash position={[0.05, 0, 0.026]} r={0.022} />
      </group>
    );
  }
  if (variant === 'pro17') {
    return (
      <group position={[0, H / 2 - 0.31, 0]}>
        <mesh geometry={geos.plateau}>
          {lite ? <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} /> : <meshPhysicalMaterial color={color} roughness={0.38} metalness={0.35} clearcoat={0.3} clearcoatRoughness={0.5} />}
        </mesh>
        <group position={[-W / 2 + 0.3, 0, 0.017]}>
          <Lens position={[-0.11, 0.115, 0.012]} r={0.08} ring={ring} />
          <Lens position={[-0.11, -0.115, 0.012]} r={0.08} ring={ring} />
          <Lens position={[0.11, 0, 0.012]} r={0.08} ring={ring} />
        </group>
        <Flash position={[W / 2 - 0.15, 0.12, 0.0295]} r={0.03} />
        <mesh position={[W / 2 - 0.15, -0.12, 0.0295]}>
          <circleGeometry args={[0.026, 24]} />
          <meshStandardMaterial color="#111" roughness={0.2} />
        </mesh>
        <mesh position={[W / 2 - 0.3, 0.12, 0.0295]}>
          <circleGeometry args={[0.012, 16]} />
          <meshStandardMaterial color="#111" roughness={0.3} />
        </mesh>
      </group>
    );
  }
  if (variant === 'pro') {
    return (
      <group position={[-W / 2 + 0.3, H / 2 - 0.3, 0]}>
        <mesh geometry={geos.bumpPro}>{glass}</mesh>
        <Lens position={[-0.1, 0.105, 0.012]} r={0.075} ring={steel} />
        <Lens position={[-0.1, -0.105, 0.012]} r={0.075} ring={steel} />
        <Lens position={[0.1, 0, 0.012]} r={0.075} ring={steel} />
        <Flash position={[0.12, 0.15, 0.026]} />
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
      <Lens position={[0, 0.1, 0.012]} r={0.068} ring={ring} />
      <Lens position={[0, -0.1, 0.012]} r={0.068} ring={ring} />
      <Flash position={[0.17, 0.12, 0.004]} r={0.024} />
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
  const lite = useContext(Lite);
  const tint = useMemo(() => new THREE.Color(color), [color]);
  const frame = useMemo(() => tint.clone().lerp(new THREE.Color('#9a9aa0'), 0.35), [tint]);
  const wallpaper = useMemo(() => (typeof document !== 'undefined' ? getWallpaper() : null), []);

  return (
    <group {...props}>
      {/* cuerpo: [0] tapas (vidrio trasero) · [1] marco */}
      <mesh geometry={geos.body} castShadow>
        {lite ? (
          <meshStandardMaterial attach="material-0" color={tint} roughness={0.42} metalness={0.12} />
        ) : (
          <meshPhysicalMaterial attach="material-0" color={tint} roughness={0.42} metalness={0.15} clearcoat={0.6} clearcoatRoughness={0.4} />
        )}
        <meshStandardMaterial attach="material-1" color={frame} roughness={0.3} metalness={lite ? 0.45 : 0.7} />
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
        {/* vidrio frontal: reflejo sutil */}
        {!lite && <mesh geometry={geos.bezel} position={[0, 0, 0.0024]}>
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.06} roughness={0} metalness={0} clearcoat={1} clearcoatRoughness={0} />
        </mesh>}
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

      {/* borde inferior: USB-C y parlantes */}
      <mesh geometry={geos.port} position={[0, -H / 2 - 0.0005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#050505" side={THREE.DoubleSide} />
      </mesh>
      {!lite && [-1, 1].map(side =>
        [0, 1, 2, 3, 4].map(i => (
          <mesh key={`${side}${i}`} position={[side * (0.14 + i * 0.03), -H / 2 - 0.0005, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.008, 10]} />
            <meshBasicMaterial color="#050505" side={THREE.DoubleSide} />
          </mesh>
        ))
      )}
      {/* líneas de antena */}
      {!lite && [H / 2 - 0.14, -H / 2 + 0.14].flatMap(y =>
        [-1, 1].map(side => (
          <mesh key={`${y}${side}`} position={[side * (W / 2 + 0.0015), y, 0]} rotation={[0, side * Math.PI / 2, 0]}>
            <planeGeometry args={[DEPTH * 1.2, 0.012]} />
            <meshStandardMaterial color="#2a2a2e" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
        ))
      )}

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
export function StudioLights({ intensity = 1, env = true }) {
  return (
    <>
      {!env && <hemisphereLight args={['#ffffff', '#2a1d4a', 0.9 * intensity]} />}
      <ambientLight intensity={0.6 * intensity} />
      <directionalLight position={[3, 4, 5]} intensity={1.8 * intensity} />
      <directionalLight position={[-4, 2, 3]} intensity={0.8 * intensity} />
      <directionalLight position={[0, 3, -5]} intensity={0.6 * intensity} />
      {env && <Environment resolution={isMobile ? 64 : 128} frames={1}>
        <Lightformer intensity={2.4} position={[0, 4, 3]} scale={[8, 2, 1]} />
        <Lightformer intensity={1.2} position={[-5, 0, 1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer intensity={1.2} position={[5, 0, 1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer intensity={0.4} position={[0, 0, -5]} scale={[8, 4, 1]} color="#8b5cf6" />
        <Lightformer intensity={0.8} position={[0, -4, 2]} scale={[8, 2, 1]} />
      </Environment>}
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
      <SafeCanvas camera={{ position: [0, 0, 6], fov: 32 }} dpr={[1, 1.75]}>
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
      </SafeCanvas>
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
      <SafeCanvas camera={{ position: [0, 0, 6], fov: 30 }} dpr={[1, 2]}>
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
      </SafeCanvas>
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
      <SafeCanvas camera={{ position: [0, 0, 5.4], fov: 30 }} dpr={2} gl={{ antialias: true, preserveDrawingBuffer: true }} keepRendering>
        <Suspense fallback={null}>
          <StudioLights />
          <Spin />
          <ContactShadows position={[0, -1.22, 0]} opacity={0.55} scale={5} blur={2.4} far={2} color="#000" />
        </Suspense>
      </SafeCanvas>
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

/* ---------- Portada estilo vitrina: plataforma giratoria que se mueve con el dedo ---------- */
export const SHOWCASE = [
  { name: 'iPhone 17 Pro Max', color: 'Naranja cósmico', hex: '#e8762e', variant: 'pro17' },
  { name: 'iPhone 17 Pro', color: 'Azul profundo', hex: '#33456b', variant: 'pro17' },
  { name: 'iPhone Air', color: 'Azul cielo', hex: '#bcd3e6', variant: 'air' },
  { name: 'iPhone 17', color: 'Lavanda', hex: '#c9bde3', variant: 'base' },
  { name: 'iPhone 17 Pro', color: 'Plata', hex: '#e4e5e7', variant: 'pro17' },
  { name: 'iPhone 16 Pro', color: 'Titanio desierto', hex: '#c9ad8f', variant: 'pro' }
];
const RING = 1.85;
const STEP = (Math.PI * 2) / SHOWCASE.length;

function Turntable({ index, drag }) {
  const ring = useRef();
  const spins = useRef([]);
  useFrame((_, dt) => {
    if (!ring.current) return;
    const target = -index * STEP + drag.current;
    // camino más corto hacia el destino
    let diff = target - ring.current.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    ring.current.rotation.y += diff * Math.min(1, dt * (drag.active ? 14 : 4));
    const rr = ring.current.rotation.y;
    spins.current.forEach((g, i) => {
      if (!g) return;
      // tamaño: el del frente un poco más grande; siempre apoyado sobre su pedestal
      const size = i === index ? 1.12 : 0.9;
      const sc = THREE.MathUtils.damp(g.scale.x, size, 6, dt);
      g.scale.setScalar(sc);
      g.position.y = (sc - 1) * (H / 2) - 0.04;
      if (i === index) {
        g.rotation.y += dt * 0.45; // el del frente gira despacio sobre sí mismo
        return;
      }
      // los demás quedan quietos mostrando las cámaras, inclinados hacia el centro
      const side = Math.sin(i * STEP + rr) > 0 ? -1 : 1;
      const target = Math.PI + side * 0.55 - rr;
      let d = target - g.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      g.rotation.y += d * Math.min(1, dt * 3);
    });
  });
  return (
    <group ref={ring}>
      {SHOWCASE.map((p, i) => {
        const a = i * STEP;
        const front = i === index;
        return (
          <group key={i} position={[Math.sin(a) * RING, 0, Math.cos(a) * RING]}>
            <group
              ref={el => {
                // arranca ya en su lugar final (así coincide con la foto de portada)
                if (el && !el.userData.init) {
                  el.userData.init = true;
                  const sc = front ? 1.12 : 0.9;
                  el.scale.setScalar(sc);
                  el.position.y = (sc - 1) * (H / 2) - 0.04;
                  el.rotation.y = front ? Math.PI - 0.35 : Math.PI + (Math.sin(a) > 0 ? -1 : 1) * 0.55;
                }
                spins.current[i] = el;
              }}
            >
              <PhoneModel color={p.hex} variant={p.variant} />
            </group>
            {/* pedestal */}
            <mesh position={[0, -H / 2 - 0.09, 0]}>
              <cylinderGeometry args={[0.62, 0.66, 0.08, 48]} />
              <meshStandardMaterial color="#1a1035" metalness={0.35} roughness={0.3} />
            </mesh>
            <mesh position={[0, -H / 2 - 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.6, 0.63, 64]} />
              <meshBasicMaterial color={front ? '#c4b5fd' : '#6d28d9'} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      {/* plataforma de la vitrina */}
      <mesh position={[0, -H / 2 - 0.2, 0]}>
        <cylinderGeometry args={[RING + 0.95, RING + 1.05, 0.12, 96]} />
        <meshStandardMaterial color="#130b2a" metalness={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[0, -H / 2 - 0.139, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RING + 0.9, RING + 0.95, 128]} />
        <meshBasicMaterial color="#8b5cf6" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function HeroVitrina({ className, onConsult, onReady, bare = false }) {
  const [index, setIndex] = useState(0);
  const drag = useRef(0);
  const state = useRef({ active: false, x: 0, moved: false });
  const idle = useRef(Date.now());
  const n = SHOWCASE.length;
  const go = d => {
    idle.current = Date.now();
    setIndex(i => (i + d + n) % n);
  };

  const onDown = e => {
    state.current = { active: true, x: e.clientX, moved: false };
    drag.active = true;
    idle.current = Date.now();
  };
  const onMove = e => {
    if (!state.current.active) return;
    const dx = e.clientX - state.current.x;
    if (Math.abs(dx) > 4) state.current.moved = true;
    drag.current = (dx / 260) * STEP * 1.6;
  };
  const onUp = () => {
    if (!state.current.active) return;
    state.current.active = false;
    drag.active = false;
    const steps = Math.round(drag.current / STEP);
    drag.current = 0;
    if (steps) setIndex(i => (((i - steps) % n) + n) % n);
    idle.current = Date.now();
  };

  const cur = SHOWCASE[index];
  return (
    <div className={className}>
      <div
        className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerCancel={onUp}
      >
        <SafeCanvas camera={{ position: [0, 0.35, RING + 6.1], fov: 30 }} dpr={[1, 1.75]}>
          <Suspense fallback={null}>
            <StudioLights env={false} intensity={1.15} />
            <spotLight position={[0, 5, RING + 2]} angle={0.45} penumbra={0.8} intensity={30} color="#ffffff" />
            <Lite.Provider value>
              <group position={[0, 0.1, -RING + 0.2]}>
                <Turntable index={index} drag={drag} />
              </group>
            </Lite.Provider>
            <ReadySignal onReady={onReady} />
          </Suspense>
        </SafeCanvas>
      </div>
      {/* controles de la vitrina */}
      <div style={bare ? { display: 'none' } : undefined} className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center gap-2 md:bottom-6">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-black/40 py-1.5 pr-1.5 pl-1.5 backdrop-blur-md">
          <button type="button" onClick={() => go(-1)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-lg hover:bg-white/20" aria-label="Anterior">
            ‹
          </button>
          <div className="min-w-[150px] text-center leading-tight">
            <div className="text-sm font-semibold">{cur.name}</div>
            <div className="text-[11px] text-white/60">{cur.color}</div>
          </div>
          <button type="button" onClick={() => go(1)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-lg hover:bg-white/20" aria-label="Siguiente">
            ›
          </button>
        </div>
        <div className="flex gap-1.5">
          {SHOWCASE.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                idle.current = Date.now();
                setIndex(i);
              }}
              className={`pointer-events-auto h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/35'}`}
              aria-label={`Ver ${SHOWCASE[i].name}`}
            />
          ))}
        </div>
        {onConsult && (
          <button type="button" onClick={() => onConsult(cur)} className="pointer-events-auto text-xs font-semibold text-violet-200 hover:text-white">
            Consultar por este modelo →
          </button>
        )}
      </div>
    </div>
  );
}
