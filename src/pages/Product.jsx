import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, PackageX, Play, RefreshCcw, Share2 } from 'lucide-react';
import ListingCard, { cardTitle, off } from '@/components/ListingCard';
import Diagnostic from '@/components/Diagnostic';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { batteryColor, BatteryIcon, MediaView, PhoneMock } from '@/components/ui';
import { phoneColor } from '@/components/Phone3D';
import { STORE, TRADE_IN_MESSAGE } from '@/config';
import { cn, formatPrice, getCondition, productUrl, waLink } from '@/lib/utils';
import { family } from '@/components/Listing';

function ago(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d <= 0) return 'Publicado hoy';
  if (d === 1) return 'Publicado ayer';
  if (d < 30) return `Publicado hace ${d} días`;
  return `Publicado hace ${Math.floor(d / 30)} ${d < 60 ? 'mes' : 'meses'}`;
}

function Gallery({ product }) {
  const media = product.media ?? [];
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [product.id]);
  if (!media.length)
    return (
      <div className="aspect-square">
        <PhoneMock color={phoneColor(product.color)} label="Fotos próximamente" />
      </div>
    );
  const cur = media[Math.min(i, media.length - 1)];
  const go = n => setI((n + media.length) % media.length);
  return (
    <div className="flex gap-3 p-3 sm:p-5">
      {/* miniaturas verticales (como Mercado Libre) */}
      <div className="no-scrollbar hidden max-h-[560px] w-16 shrink-0 flex-col gap-2 overflow-y-auto sm:flex">
        {media.map((m, n) => (
          <button
            key={m.id ?? m.url}
            type="button"
            onMouseEnter={() => setI(n)}
            onClick={() => setI(n)}
            aria-label={`${m.type === 'video' ? 'Video' : 'Foto'} ${n + 1}`}
            className={cn('relative aspect-square shrink-0 overflow-hidden rounded-md border-2 bg-black/30', n === i ? 'border-violet-400' : 'border-white/10 hover:border-white/30')}
          >
            <MediaView item={m} />
            {m.type === 'video' && (
              <span className="absolute inset-0 grid place-items-center bg-black/35">
                <Play size={16} fill="white" />
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="relative flex-1">
        <motion.div
          key={cur.id ?? cur.url}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="aspect-square overflow-hidden rounded-lg bg-[radial-gradient(circle_at_50%_40%,#1d1438,#0b0818)]"
          drag={media.length > 1 && cur.type !== 'video' ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => (info.offset.x < -50 ? go(i + 1) : info.offset.x > 50 ? go(i - 1) : null)}
        >
          <MediaView item={cur} controls={cur.type === 'video'} autoPlay={cur.type === 'video'} cover={false} />
        </motion.div>
        {media.length > 1 && (
          <>
            <button type="button" onClick={() => go(i - 1)} className="absolute top-1/2 left-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 backdrop-blur sm:hidden" aria-label="Anterior">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => go(i + 1)} className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 backdrop-blur sm:hidden" aria-label="Siguiente">
              <ChevronRight size={18} />
            </button>
            <div className="mt-3 flex justify-center gap-1.5 sm:hidden">
              {media.map((_, n) => (
                <span key={n} className={cn('h-1.5 rounded-full transition-all', n === i ? 'w-4 bg-white' : 'w-1.5 bg-white/35')} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Product({ products, loading }) {
  const { id } = useParams();
  const [copied, setCopied] = useState(false);
  const product = products.find(p => p.id === id);
  useEffect(() => window.scrollTo(0, 0), [id]);

  const related = useMemo(
    () =>
      product
        ? products
            .filter(p => p.id !== product.id)
            .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
            .slice(0, 4)
        : [],
    [products, product]
  );

  if (loading) return <div className="mx-auto max-w-7xl px-4 pt-24"><div className="ml-panel h-[70vh] animate-pulse" /></div>;
  if (!product)
    return (
      <main className="mx-auto max-w-xl px-4 pt-32 text-center">
        <PackageX size={40} className="mx-auto text-white/40" />
        <h1 className="mt-4 text-2xl font-semibold">Esta publicación ya no está disponible</h1>
        <p className="mt-2 text-white/60">Puede que el equipo se haya vendido.</p>
        <Link to="/" className="btn btn-ml mt-6">Ver iPhones disponibles</Link>
      </main>
    );

  const cond = getCondition(product.condition);
  const discount = off(product);
  const consult = `Hola ${STORE.name}! Me interesa este equipo:\n\n${cardTitle(product)} · ${cond.label}${product.battery != null ? ` · Batería ${product.battery}%` : ''} — ${formatPrice(product.price)}\n${productUrl(product)}\n\n¿Sigue disponible?`;
  const tradeIn = `${TRADE_IN_MESSAGE}\n\nMe interesa: ${cardTitle(product)} (${formatPrice(product.price)})`;

  const share = async () => {
    const url = productUrl(product);
    try {
      if (navigator.share) await navigator.share({ title: cardTitle(product), url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch { /* cancelado */ }
  };

  const specs = [
    ['Modelo', product.model],
    ['Capacidad', product.storage],
    ['Color', product.color],
    ['Condición', cond.label],
    ['Batería', product.battery != null ? `${product.battery}%` : null],
    ['Garantía', product.warranty],
    ['Incluye', product.includes?.length ? product.includes.join(', ') : 'Solo el equipo']
  ].filter(([, v]) => v);

  return (
    <main className="mx-auto max-w-7xl px-4 pt-20 pb-10">
      <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm text-white/55">
        <Link to="/" className="text-violet-300 hover:text-violet-200">Volver al listado</Link>
        <span className="text-white/20">|</span>
        <Link to={`/?modelo=${encodeURIComponent(family(product.model))}`} className="hover:text-white">{family(product.model)}</Link>
        <ChevronRight size={14} />
        <span className="truncate text-white/40">{[product.storage, product.color].filter(Boolean).join(' · ')}</span>
      </nav>

      <div className="ml-panel grid overflow-hidden lg:grid-cols-[1fr_400px]">
        <Gallery product={product} />

        <aside className="border-t border-white/6 p-6 lg:border-t-0 lg:border-l">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-white/50">
              {cond.label} | {ago(product.created_at)}
            </p>
            <button type="button" onClick={share} className="text-white/60 hover:text-white" aria-label="Compartir" title={copied ? 'Link copiado' : 'Compartir'}>
              {copied ? <Check size={18} className="text-ml-green" /> : <Share2 size={18} />}
            </button>
          </div>
          <h1 className="mt-1 text-2xl leading-tight font-semibold">{cardTitle(product)}</h1>
          {product.status === 'reservado' && <span className="mt-2 inline-block rounded bg-amber-400 px-2 py-0.5 text-xs font-bold text-black">RESERVADO</span>}

          <div className="mt-5">
            {discount > 0 && <div className="text-sm text-white/40 line-through">{formatPrice(product.compare_price)}</div>}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-light tracking-tight">{formatPrice(product.price)}</span>
              {discount > 0 && <span className="text-lg font-semibold text-ml-green">{discount}% OFF</span>}
            </div>
          </div>

          {product.battery != null && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-white/70">
                  <BatteryIcon value={product.battery} className="text-white" /> Condición de batería
                </span>
                <span className="text-lg font-bold" style={{ color: batteryColor(product.battery) }}>{product.battery}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${product.battery}%` }}
                  transition={{ duration: 1.1, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ background: batteryColor(product.battery), boxShadow: `0 0 12px ${batteryColor(product.battery)}` }}
                />
              </div>
            </div>
          )}

          <p className="mt-5 flex items-center gap-2 font-semibold text-ml-green">
            <RefreshCcw size={16} /> Tomamos tu usado en parte de pago
          </p>

          <ul className="mt-4 space-y-1.5 text-sm text-white/75">
            {product.storage && <li>• {product.storage.replace('GB', ' GB')} de almacenamiento</li>}
            {product.warranty && <li>• Garantía: {product.warranty}</li>}
            {product.includes?.length > 0 && <li>• Incluye: {product.includes.join(', ')}</li>}
            {product.stock > 1 && <li>• {product.stock} disponibles</li>}
          </ul>

          <div className="mt-6 space-y-2.5">
            <a href={waLink(consult)} target="_blank" rel="noreferrer" className="btn btn-ml w-full !min-h-[52px] text-base">
              <WhatsAppIcon className="h-5 w-5" /> Contactanos
            </a>
            <a href={waLink(tradeIn)} target="_blank" rel="noreferrer" className="btn btn-ml-soft w-full !min-h-[48px]">
              <RefreshCcw size={17} /> Cotizar mi usado para este equipo
            </a>
          </div>
          <p className="mt-3 text-center text-xs text-white/40">Te respondemos por WhatsApp</p>
        </aside>
      </div>

      <Diagnostic product={product} />

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_400px]">
        <section className="ml-panel p-6">
          <h2 className="text-xl font-semibold">Características</h2>
          <table className="mt-4 w-full overflow-hidden rounded-lg text-sm">
            <tbody>
              {specs.map(([k, v], n) => (
                <tr key={k} className={n % 2 ? '' : 'bg-white/[0.04]'}>
                  <th className="w-40 px-4 py-2.5 text-left font-semibold text-white/80">{k}</th>
                  <td className="px-4 py-2.5 text-white/70">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        {product.description && (
          <section className="ml-panel p-6">
            <h2 className="text-xl font-semibold">Descripción</h2>
            <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-white/70">{product.description}</p>
          </section>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Otros iPhones</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map(p => (
              <ListingCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
