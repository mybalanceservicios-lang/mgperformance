import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Images, Play, Plus } from 'lucide-react';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import { BatteryBadge, ConditionBadge, MediaView, PhoneMock, StatusBadge } from './ui';
import { useCart } from '@/lib/cart';
import { formatPrice, getCondition } from '@/lib/utils';

export default function ProductCard({ product, index = 0 }) {
  const cart = useCart();
  const inCart = cart.has(product.id);
  const cover = product.media?.[0];
  const second = product.media?.find((m, i) => i > 0 && m.type === 'image');
  const hasVideo = product.media?.some(m => m.type === 'video');
  const sold = product.status === 'vendido';
  const cond = getCondition(product.condition);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.04, ease: [0.32, 0.72, 0, 1] }}
    >
      <SpotlightCard
        className="p-0 group h-full"
        spotlightColor={cond.color}
        intensity={0.12}
        style={{
          '--spotlight-card-surface': '#13161e',
          '--spotlight-card-shadow': 'var(--neu-out)',
          '--spotlight-card-border': 'rgba(255,255,255,0.05)'
        }}
      >
        <Link to={`/producto/${product.id}`} className="block" aria-label={`Ver ${product.model} ${product.storage ?? ''}`}>
          <div className="relative m-2.5 aspect-[4/5] overflow-hidden rounded-[18px] bg-[#0b0d12] shadow-[var(--neu-in)]">
            {cover ? (
              <>
                <MediaView item={cover} className="transition-transform duration-700 ease-[cubic-bezier(.32,.72,0,1)] group-hover:scale-[1.04]" />
                {second && (
                  <MediaView item={second} className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                )}
              </>
            ) : (
              <PhoneMock color={cond.color} label={product.model} />
            )}
            {sold && <div className="absolute inset-0 bg-black/55" />}
            <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
              <ConditionBadge condition={product.condition} className="glass" />
              <StatusBadge status={product.status} />
            </div>
            <BatteryBadge value={product.battery} className="glass absolute right-2.5 bottom-2.5 !shadow-none" />
            <div className="absolute bottom-2.5 left-2.5 flex gap-1.5">
              {hasVideo && (
                <span className="chip glass text-ink">
                  <Play size={11} fill="currentColor" />
                </span>
              )}
              {product.media?.length > 1 && (
                <span className="chip glass text-ink">
                  <Images size={12} /> {product.media.length}
                </span>
              )}
            </div>
          </div>
        </Link>

        <div className="px-4 pt-1 pb-4">
          <div>
            <Link to={`/producto/${product.id}`} className="block min-w-0">
              <h3 className="truncate text-[0.98rem] font-bold sm:text-[1.05rem]">{product.model}</h3>
              <p className="truncate text-sm text-muted">
                {[product.storage, product.color].filter(Boolean).join(' · ')}
              </p>
            </Link>
          </div>

          <div className="mt-3.5 flex items-end justify-between gap-3">
            <div>
              {product.compare_price && (
                <div className="text-xs text-faint line-through">{formatPrice(product.compare_price)}</div>
              )}
              <div className="text-[1.05rem] font-extrabold tracking-tight whitespace-nowrap sm:text-xl">{formatPrice(product.price)}</div>
            </div>
            <button
              type="button"
              disabled={sold}
              onClick={() => (inCart ? cart.setOpen(true) : cart.add(product))}
              aria-label={inCart ? 'Ver mi selección' : 'Agregar a mi selección'}
              title={inCart ? 'Ya está en tu selección' : 'Agregar a mi selección'}
              className={`icon-btn ${inCart ? 'bg-ios-green/15 text-ios-green shadow-[var(--neu-in)]' : 'btn-neu text-ios-blue'}`}
            >
              {inCart ? <Check size={20} strokeWidth={2.6} /> : <Plus size={22} strokeWidth={2.4} />}
            </button>
          </div>
        </div>
      </SpotlightCard>
    </motion.article>
  );
}
