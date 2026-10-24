import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowDown, BadgeCheck, Camera, RefreshCcw, ShieldCheck } from 'lucide-react';
import BlurText from '@/components/reactbits/BlurText';
import { ShimmeringText } from '@/components/elevenlabs/shimmering-text';
import Listing from '@/components/Listing';
import Reviews from '@/components/Reviews';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { waLink } from '@/lib/utils';

// three.js pesa: se carga aparte para que la página abra rápido
const HeroVitrina = lazy(() => import('@/components/Phone3D').then(m => ({ default: m.HeroVitrina })));

// Vitrina: primero una foto idéntica (carga al instante) y el 3D se suma cuando la página ya está lista
function Showcase() {
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      setLoad(true);
    };
    const idle = () => (window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 1200));
    if (document.readyState === 'complete') idle();
    else window.addEventListener('load', idle, { once: true });
    // si el visitante toca o scrollea antes, se carga en ese momento
    const now = () => go();
    window.addEventListener('pointerdown', now, { once: true, passive: true });
    return () => {
      done = true;
      window.removeEventListener('load', idle);
      window.removeEventListener('pointerdown', now);
    };
  }, []);

  return (
    <>
      <picture>
        <source media="(max-width: 767px)" srcSet="hero/vitrina-m.webp" />
        <img
          src="hero/vitrina-d.webp"
          alt="Vitrina con iPhone 17 Pro Max naranja cósmico, iPhone 17 Pro azul, iPhone Air y iPhone 16 Pro"
          fetchPriority="high"
          decoding="async"
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}
        />
      </picture>
      {load && (
        <Suspense fallback={null}>
          <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}>
            <HeroVitrina
              className="absolute inset-0"
              onReady={() => setReady(true)}
              onConsult={m => window.open(waLink(`Hola! ¿Tienen ${m.name} ${m.color}? ¿Qué precio tiene?`), '_blank')}
            />
          </div>
        </Suspense>
      )}
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-16">
      <div className="absolute inset-0 -z-10 opacity-70">
        {/* fondo animado liviano (CSS, sin 3D) */}
        <div className="hero-glow" />
      </div>
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-[#05030c]" />

      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-4 px-4 md:grid-cols-[1fr_1.15fr] md:min-h-[640px]">
        <div className="relative z-10 order-2 pb-12 md:order-1 md:pb-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] font-medium backdrop-blur">
            <RefreshCcw size={14} className="text-violet-300" />
            <ShimmeringText text="Tomamos tu celular en parte de pago" duration={2.6} color="#c4b5fd" shimmerColor="#ffffff" />
          </span>
          <h1 className="mt-5 text-[2.6rem] leading-[1.02] font-extrabold sm:text-6xl lg:text-7xl">
            <BlurText text="Cambiá tu iPhone" className="block" delay={80} />
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-200 to-sky-300 bg-clip-text text-transparent">
              <BlurText text="por uno mejor." delay={110} />
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-5 max-w-md text-lg leading-relaxed text-white/70"
          >
            Entregá tu celular usado y llevate un iPhone nuevo o seleccionado, con batería verificada y fotos reales.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to="/cotizar" className="btn btn-ml !min-h-[52px] !rounded-full !px-6 text-base">
              <RefreshCcw size={18} /> Cotizá tu usado
            </Link>
            <button
              type="button"
              onClick={() => document.getElementById('publicaciones')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn !min-h-[52px] !rounded-full border border-white/15 bg-white/5 !px-6 text-base text-white backdrop-blur hover:bg-white/10"
            >
              Ver iPhones <ArrowDown size={17} />
            </button>
          </motion.div>
        </div>

        <div className="relative order-1 h-[54svh] min-h-[380px] md:order-2 md:h-[660px]">
          <div className="absolute inset-[10%] -z-10 rounded-full bg-violet-600/30 blur-[90px]" />
          <Showcase />
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const items = [
    { icon: RefreshCcw, title: 'Tomamos tu usado', text: 'Como parte de pago' },
    { icon: BadgeCheck, title: 'Batería verificada', text: 'Publicada tal cual' },
    { icon: Camera, title: 'Fotos y videos reales', text: 'Del equipo exacto' },
    { icon: ShieldCheck, title: 'Garantía escrita', text: 'En cada publicación' }
  ];
  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="ml-panel grid grid-cols-2 divide-white/6 md:grid-cols-4 md:divide-x">
        {items.map(i => (
          <div key={i.title} className="flex items-center gap-3 px-4 py-4">
            <i.icon size={22} className="shrink-0 text-violet-300" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{i.title}</div>
              <div className="truncate text-xs text-white/50">{i.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home({ products, loading }) {
  const location = useLocation();
  useEffect(() => {
    const id = location.state?.scrollTo;
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
  }, [location.state]);

  return (
    <main>
      <Hero />
      <Benefits />
      <Listing products={products} loading={loading} />
      <Reviews />
    </main>
  );
}
