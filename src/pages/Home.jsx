import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowDown, BadgeCheck, Camera, ChevronRight, MessageCircle, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import Aurora from '@/components/reactbits/Aurora';
import BlurText from '@/components/reactbits/BlurText';
import CountUp from '@/components/reactbits/CountUp';
import StarBorder from '@/components/reactbits/StarBorder';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import { ShimmeringText } from '@/components/elevenlabs/shimmering-text';
import Catalog, { DEFAULT_FILTERS } from '@/components/Catalog';
import { BatteryIcon, batteryColor } from '@/components/ui';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { CONDITIONS, STORE } from '@/config';
import { formatPrice, waLink } from '@/lib/utils';

// El Orb (three.js) pesa: lo cargamos aparte para que la página abra rápido
const Orb = lazy(() => import('@/components/elevenlabs/orb').then(m => ({ default: m.Orb })));

function Hero({ products }) {
  const available = products.filter(p => p.status !== 'vendido');
  const withBattery = available.filter(p => p.battery != null);
  const avgBattery = withBattery.length
    ? Math.round(withBattery.reduce((s, p) => s + Number(p.battery), 0) / withBattery.length)
    : 0;
  const models = new Set(available.map(p => p.model)).size;
  const sample = available.find(p => p.battery >= 90) ?? available[0];

  return (
    <section className="relative isolate overflow-hidden pt-28 pb-10 md:pt-36 md:pb-16">
      <div className="absolute inset-x-0 top-0 -z-10 h-[110%] opacity-60">
        <Aurora colorStops={['#0a84ff', '#bf5af2', '#64d2ff']} amplitude={1.1} blend={0.55} speed={0.6} />
      </div>
      <div className="hero-fade absolute inset-0 -z-10" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ios-green shadow-[0_0_10px_var(--green)]" />
            <ShimmeringText text="Stock real · Fotos y videos propios" duration={2.4} color="#8e95a5" shimmerColor="#ffffff" />
          </div>

          <h1 className="text-[2.6rem] leading-[1.02] font-extrabold sm:text-6xl md:text-[4.3rem]">
            <BlurText text="Tu próximo iPhone," className="block" delay={90} animateBy="words" direction="top" />
            <span className="text-gradient block">
              <BlurText text="verificado." delay={120} animateBy="letters" direction="bottom" />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-5 max-w-lg text-[1.05rem] leading-relaxed text-muted"
          >
            Nuevos y usados seleccionados. Cada equipo con su batería real, fotos sacadas por nosotros y garantía. Armá tu
            selección y la seguimos por WhatsApp.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.6 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <StarBorder
              as="a"
              href="#catalogo"
              onClick={e => {
                e.preventDefault();
                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
              }}
              color="#64d2ff"
              radius={16}
              backgroundColor="#0a84ff"
              textColor="#fff"
              borderColor="rgba(255,255,255,0.18)"
              className="!px-6 !py-3.5 font-semibold"
              stars={2}
              glow={0.8}
            >
              Ver equipos <ArrowDown size={17} />
            </StarBorder>
            <a
              href={waLink(`Hola ${STORE.name}! Estoy buscando un iPhone.`)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-neu !min-h-[50px] !rounded-2xl !px-5"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] text-ios-green" /> Hablar con nosotros
            </a>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95, duration: 0.6 }}
            className="neu mt-10 grid max-w-lg grid-cols-3 divide-x divide-white/5 py-4"
          >
            {[
              { n: available.length, label: 'Equipos en stock' },
              { n: avgBattery, label: 'Batería promedio', suffix: '%' },
              { n: models, label: 'Modelos' }
            ].map(s => (
              <div key={s.label} className="px-4 text-center">
                <dd className="text-2xl font-extrabold tabular-nums md:text-3xl">
                  <CountUp to={s.n} duration={1.6} suffix={s.suffix ?? ''} />
                </dd>
                <dt className="mt-0.5 text-[11px] font-medium text-muted md:text-xs">{s.label}</dt>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Orb de ElevenLabs dentro de un "pozo" neumórfico, con widgets estilo iOS flotando */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 1, ease: [0.32, 0.72, 0, 1] }}
          className="relative mx-auto aspect-square w-full max-w-[440px]"
        >
          <div className="neu absolute inset-[4%] !rounded-full" />
          <div className="neu-inset absolute inset-[11%] !rounded-full" />
          <div className="absolute inset-[13%] overflow-hidden rounded-full">
            <Suspense fallback={<div className="h-full w-full animate-pulse rounded-full bg-ios-blue/10" />}>
              <Orb colors={['#7cc4ff', '#b48cff']} seed={7} />
            </Suspense>
          </div>

          {sample && (
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="glass absolute top-[6%] -left-2 w-44 rounded-[22px] p-3.5 shadow-2xl md:-left-6"
            >
              <div className="text-[11px] font-semibold text-muted">Batería</div>
              <div className="mt-1 flex items-center gap-2">
                <BatteryIcon value={sample.battery ?? 100} className="h-4 w-8 text-ink" />
                <span className="text-2xl font-bold" style={{ color: batteryColor(sample.battery ?? 100) }}>
                  {sample.battery ?? 100}%
                </span>
              </div>
              <div className="mt-1 truncate text-[11px] text-muted">{sample.model}</div>
            </motion.div>
          )}

          <motion.div
            animate={{ y: [0, 9, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="glass absolute -right-1 bottom-[9%] flex items-center gap-3 rounded-[22px] p-3 pr-4 shadow-2xl md:-right-5"
          >
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-gradient-to-b from-[#34d76a] to-[#22b455] text-[#04210f]">
              <Camera size={20} />
            </span>
            <div>
              <div className="text-sm font-semibold">Fotos reales</div>
              <div className="text-[11px] text-muted">Del equipo que te llevás</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Categories({ products, onPick }) {
  const stats = useMemo(
    () =>
      CONDITIONS.map(c => {
        const list = products.filter(p => p.condition === c.id && p.status !== 'vendido');
        const min = list.length ? Math.min(...list.map(p => Number(p.price) || Infinity)) : null;
        return { ...c, count: list.length, min: Number.isFinite(min) ? min : null };
      }),
    [products]
  );

  return (
    <section className="mx-auto max-w-6xl px-4 pt-8" aria-labelledby="cat-title">
      <div className="mb-6">
        <p className="text-sm font-semibold text-ios-purple">Por condición</p>
        <h2 id="cat-title" className="text-3xl font-bold md:text-4xl">
          ¿Qué estado buscás?
        </h2>
        <p className="mt-2 max-w-xl text-muted">
          Clasificamos cada equipo con criterios claros para que sepas exactamente qué vas a recibir.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-4">
        {stats.map((c, i) => (
          <motion.button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.07, duration: 0.5 }}
            whileTap={{ scale: 0.97 }}
            className="text-left"
          >
            <SpotlightCard
              className="h-full !p-5"
              spotlightColor={c.color}
              intensity={0.2}
              style={{
                '--spotlight-card-surface': '#13161e',
                '--spotlight-card-shadow': 'var(--neu-out)',
                '--spotlight-card-border': 'rgba(255,255,255,0.05)'
              }}
            >
              <div
                className="mb-5 grid h-11 w-11 place-items-center rounded-[14px]"
                style={{ background: `color-mix(in srgb, ${c.color} 16%, #0b0d12)`, boxShadow: 'var(--neu-in)' }}
              >
                <span className="h-3 w-3 rounded-full" style={{ background: c.color, boxShadow: `0 0 14px ${c.color}` }} />
              </div>
              <h3 className="text-lg font-bold">{c.label}</h3>
              <p className="mt-1 min-h-[2.5rem] text-[13px] leading-snug text-muted">{c.hint}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted">
                  {c.count ? (
                    <>
                      <b className="text-ink">{c.count}</b> {c.count === 1 ? 'equipo' : 'equipos'}
                    </>
                  ) : (
                    'Sin stock ahora'
                  )}
                </span>
                <ChevronRight size={18} style={{ color: c.color }} />
              </div>
              {c.min != null && <div className="mt-1 text-xs text-faint">desde {formatPrice(c.min)}</div>}
            </SpotlightCard>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: <ShoppingBag size={22} />,
      color: 'var(--blue)',
      title: 'Armá tu selección',
      text: 'Tocá + en los equipos que te gusten. Podés sumar varios o consultar uno solo directo desde su publicación.'
    },
    {
      icon: <MessageCircle size={22} />,
      color: 'var(--green)',
      title: 'Enviala por WhatsApp',
      text: 'Con un toque nos llega tu lista con modelo, batería y precio. Sin formularios ni registros.'
    },
    {
      icon: <BadgeCheck size={22} />,
      color: 'var(--purple)',
      title: 'Coordinamos y lo probás',
      text: 'Te confirmamos stock, medios de pago y entrega. Revisás el equipo antes de cerrar.'
    }
  ];
  return (
    <section id="como-funciona" className="mx-auto max-w-6xl px-4 pt-24">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold text-ios-green">Cómo comprar</p>
        <h2 className="text-3xl font-bold md:text-4xl">Simple, en 3 pasos</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.1, duration: 0.55 }}
            className="neu relative p-6"
          >
            <span className="absolute top-5 right-6 font-display text-5xl font-extrabold text-white/[0.04]">{i + 1}</span>
            <span className="neu-inset mb-5 grid h-12 w-12 place-items-center rounded-2xl" style={{ color: s.color }}>
              {s.icon}
            </span>
            <h3 className="text-lg font-bold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Guía didáctica de batería */}
      <div className="neu mt-5 grid gap-6 p-6 md:grid-cols-[1fr_1.4fr] md:items-center md:p-8">
        <div>
          <span className="chip mb-3 bg-ios-teal/10 text-ios-teal">
            <Sparkles size={13} /> Guía rápida
          </span>
          <h3 className="text-2xl font-bold">¿Cómo leer la batería?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Es el % de capacidad que conserva respecto de nueva. Lo verificamos en Ajustes → Batería en cada equipo y lo
            publicamos tal cual.
          </p>
        </div>
        <div className="space-y-3">
          {[
            { v: 100, t: 'Nuevo o como nuevo', d: 'Rinde como el primer día.' },
            { v: 92, t: '90% o más', d: 'Excelente. Diferencia imperceptible en el uso diario.' },
            { v: 85, t: '80% – 89%', d: 'Muy buena. Llega al final del día con uso normal.' }
          ].map(r => (
            <div key={r.t} className="neu-inset flex items-center gap-4 px-4 py-3">
              <BatteryIcon value={r.v} className="h-4 w-8 shrink-0 text-ink" />
              <div className="min-w-0">
                <div className="text-sm font-semibold" style={{ color: batteryColor(r.v) }}>
                  {r.t}
                </div>
                <div className="text-xs text-muted">{r.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="neu flex items-start gap-4 p-6">
          <span className="neu-inset grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-ios-orange">
            <ShieldCheck size={21} />
          </span>
          <div>
            <h3 className="font-bold">Garantía escrita</h3>
            <p className="mt-1 text-sm text-muted">Cada publicación indica la garantía de ese equipo.</p>
          </div>
        </div>
        <div className="neu flex items-start gap-4 p-6">
          <span className="neu-inset grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-ios-teal">
            <Camera size={21} />
          </span>
          <div>
            <h3 className="font-bold">Lo que ves es lo que recibís</h3>
            <p className="mt-1 text-sm text-muted">Fotos y videos del equipo exacto, sin imágenes de catálogo.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home({ products, loading }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const location = useLocation();

  useEffect(() => {
    const id = location.state?.scrollTo;
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
  }, [location.state]);

  const pick = condition => {
    setFilters(f => ({ ...f, condition }));
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main>
      <Hero products={products} />
      <Categories products={products} onPick={pick} />
      <Catalog products={products} loading={loading} filters={filters} setFilters={setFilters} />
      <HowItWorks />
    </main>
  );
}
