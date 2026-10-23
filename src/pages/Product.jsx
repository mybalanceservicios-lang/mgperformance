import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, HardDrive, Package, Palette, Play, Share2, ShieldCheck, ShoppingBag } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { BatteryIcon, batteryColor, ConditionBadge, Empty, InfoTip, MediaView, PhoneMock, StatusBadge } from '@/components/ui';
import { useCart } from '@/lib/cart';
import { cn, formatPrice, getCondition, productLine, productUrl, waLink } from '@/lib/utils';
import { STORE } from '@/config';

function Gallery({ product }) {
  const media = product.media ?? [];
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const cond = getCondition(product.condition);
  const go = n => {
    setDir(n > i ? 1 : -1);
    setI((n + media.length) % media.length);
  };

  if (!media.length) {
    return (
      <div className="neu aspect-square overflow-hidden p-3">
        <div className="h-full overflow-hidden rounded-[18px]">
          <PhoneMock color={cond.color} label="Fotos próximamente" />
        </div>
      </div>
    );
  }

  const current = media[i];
  return (
    <div>
      <div className="neu relative overflow-hidden p-2.5">
        <div className="relative aspect-square overflow-hidden rounded-[18px] bg-[#0b0d12] shadow-[var(--neu-in)]">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={current.id ?? current.url}
              custom={dir}
              initial={{ opacity: 0, x: dir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -60 }}
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              className="absolute inset-0"
              drag={media.length > 1 && current.type !== 'video' ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) go(i + 1);
                else if (info.offset.x > 60) go(i - 1);
              }}
            >
              <MediaView item={current} controls={current.type === 'video'} cover={current.type !== 'video'} />
            </motion.div>
          </AnimatePresence>
          {media.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(i - 1)}
                className="glass absolute top-1/2 left-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full"
                aria-label="Anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() => go(i + 1)}
                className="glass absolute top-1/2 right-3 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full"
                aria-label="Siguiente"
              >
                <ChevronRight size={20} />
              </button>
              <div className="glass absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full px-2.5 py-1.5">
                {media.map((_, n) => (
                  <span key={n} className={cn('h-1.5 rounded-full transition-all', n === i ? 'w-4 bg-white' : 'w-1.5 bg-white/40')} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {media.length > 1 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto p-1">
          {media.map((m, n) => (
            <button
              key={m.id ?? m.url}
              type="button"
              onClick={() => go(n)}
              aria-label={`Ver ${m.type === 'video' ? 'video' : 'foto'} ${n + 1}`}
              className={cn(
                'relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl transition',
                n === i ? 'shadow-[var(--neu-in)] ring-2 ring-ios-blue' : 'neu-sm opacity-70 hover:opacity-100'
              )}
            >
              <MediaView item={m} />
              {m.type === 'video' && (
                <span className="absolute inset-0 grid place-items-center bg-black/30">
                  <Play size={18} fill="white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Spec({ icon, label, value, extra }) {
  return (
    <div className="neu-inset flex items-center gap-3 px-4 py-3">
      <span className="text-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold tracking-wide text-faint uppercase">{label}</div>
        <div className="truncate text-[0.95rem] font-semibold">{value}</div>
      </div>
      {extra}
    </div>
  );
}

export default function Product({ products, loading }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [copied, setCopied] = useState(false);
  const product = products.find(p => p.id === id);

  useEffect(() => window.scrollTo(0, 0), [id]);

  const related = useMemo(() => {
    if (!product) return [];
    return products
      .filter(p => p.id !== product.id && p.status !== 'vendido')
      .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
      .slice(0, 3);
  }, [products, product]);

  if (loading) return <div className="mx-auto max-w-6xl px-4 pt-32"><div className="neu h-[60vh] animate-pulse" /></div>;
  if (!product)
    return (
      <main className="mx-auto max-w-xl px-4 pt-32">
        <Empty
          icon={<Package size={26} />}
          title="Este equipo ya no está publicado"
          text="Puede que se haya vendido. Mirá los demás equipos disponibles."
          action={<Link className="btn btn-primary" to="/">Ver equipos</Link>}
        />
      </main>
    );

  const cond = getCondition(product.condition);
  const sold = product.status === 'vendido';
  const inCart = cart.has(product.id);
  const consult = `Hola ${STORE.name}! Me interesa este equipo:\n\n• ${productLine(product)}\n${productUrl(product)}\n\n¿Sigue disponible?`;

  const share = async () => {
    const url = productUrl(product);
    try {
      if (navigator.share) await navigator.share({ title: product.model, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch { /* cancelado */ }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pt-24 md:pt-28">
      <div className="mb-5 flex items-center justify-between">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} className="btn btn-ghost !px-2">
          <ChevronLeft size={20} /> Volver
        </button>
        <button type="button" onClick={share} className="btn btn-neu !min-h-[40px] !px-3.5 !text-sm">
          {copied ? <Check size={16} className="text-ios-green" /> : <Share2 size={16} />} {copied ? 'Link copiado' : 'Compartir'}
        </button>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.05fr_1fr] md:gap-12">
        <Gallery product={product} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ConditionBadge condition={product.condition} />
            <StatusBadge status={product.status} />
            {product.featured && <span className="chip bg-ios-orange/15 text-ios-orange">Destacado</span>}
          </div>
          <h1 className="mt-3 text-4xl font-extrabold md:text-5xl">{product.model}</h1>
          <p className="mt-1 text-lg text-muted">{[product.storage, product.color].filter(Boolean).join(' · ')}</p>

          <div className="mt-6 flex items-end gap-3">
            <span className="text-4xl font-extrabold tracking-tight">{formatPrice(product.price)}</span>
            {product.compare_price && <span className="pb-1 text-lg text-faint line-through">{formatPrice(product.compare_price)}</span>}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {product.battery != null && (
              <div className="neu-inset col-span-2 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-semibold tracking-wide text-faint uppercase">
                    Condición de batería
                    <InfoTip title="Condición de batería">
                      Medida en Ajustes → Batería → Estado y carga. Es la capacidad máxima actual respecto de nueva.
                    </InfoTip>
                  </div>
                  <span className="text-lg font-bold" style={{ color: batteryColor(product.battery) }}>
                    {product.battery}%
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/50">
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
            {product.storage && <Spec icon={<HardDrive size={18} />} label="Capacidad" value={product.storage} />}
            {product.color && <Spec icon={<Palette size={18} />} label="Color" value={product.color} />}
            {product.warranty && (
              <Spec icon={<ShieldCheck size={18} />} label="Garantía" value={product.warranty} />
            )}
            <Spec
              icon={<BatteryIcon value={product.battery ?? 100} />}
              label="Estado"
              value={cond.label}
              extra={<InfoTip title={cond.label} align="right">{cond.hint}</InfoTip>}
            />
          </div>

          {product.includes?.length > 0 && (
            <div className="mt-5">
              <div className="label">Incluye</div>
              <div className="flex flex-wrap gap-2">
                {product.includes.map(x => (
                  <span key={x} className="chip neu-sm !py-1.5 text-ink">
                    <Check size={13} className="text-ios-green" /> {x}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.description && (
            <p className="mt-5 text-[0.95rem] leading-relaxed whitespace-pre-line text-muted">{product.description}</p>
          )}

          {/* Acciones: fijas abajo en celular, como en apps de iOS */}
          <div className="glass fixed inset-x-0 bottom-0 z-40 flex gap-3 rounded-t-[26px] border-x-0 border-b-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:mt-8 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <button
              type="button"
              disabled={sold}
              onClick={() => (inCart ? cart.setOpen(true) : cart.add(product))}
              className={cn('btn flex-1 !min-h-[54px] text-base', inCart ? 'btn-neu !text-ios-green' : 'btn-neu')}
            >
              {inCart ? <Check size={19} /> : <ShoppingBag size={19} />}
              {inCart ? 'En tu selección' : 'Sumar a selección'}
            </button>
            <a
              href={sold ? undefined : waLink(consult)}
              target="_blank"
              rel="noreferrer"
              aria-disabled={sold}
              className={cn('btn btn-wa flex-1 !min-h-[54px] text-base', sold && 'pointer-events-none opacity-45')}
            >
              <WhatsAppIcon className="h-5 w-5" /> Consultar ya
            </a>
          </div>
          <p className="mt-3 hidden text-center text-xs text-faint md:block">
            “Sumar” lo guarda en tu lista para consultar varios juntos. “Consultar ya” abre WhatsApp solo con este equipo.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 mb-10">
          <h2 className="mb-6 text-2xl font-bold">También te puede interesar</h2>
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 lg:grid-cols-3">
            {related.map((p, n) => (
              <ProductCard key={p.id} product={p} index={n} />
            ))}
          </div>
        </section>
      )}
      <div className="h-24 md:hidden" />
    </main>
  );
}
