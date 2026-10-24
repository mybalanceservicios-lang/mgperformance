import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { batteryColor, BatteryIcon, MediaView, PhoneMock } from './ui';
import { cn, formatPrice, getCondition } from '@/lib/utils';
import { phoneColor } from './Phone3D';
import Pesos from './Pesos';

export function off(p) {
  return p.compare_price && p.price && p.compare_price > p.price ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
}

export function cardTitle(p) {
  return [p.model, p.storage?.replace('GB', ' GB').replace('TB', ' TB'), p.color].filter(Boolean).join(' ');
}

// Tarjeta estilo Mercado Libre. layout="grid" (columnas) o "row" (lista en celular)
export default function ListingCard({ product: p, layout = 'grid', linkless }) {
  const cover = p.media?.find(m => m.type === 'image') ?? p.media?.[0];
  const hasVideo = p.media?.some(m => m.type === 'video');
  const discount = off(p);
  const Wrapper = linkless ? 'div' : Link;
  const row = layout === 'row';

  return (
    <Wrapper to={linkless ? undefined : `/producto/${p.id}`} className={cn('ml-card group', row ? 'flex-row' : 'flex-col')}>
      <div className={cn('relative shrink-0 overflow-hidden bg-[radial-gradient(circle_at_50%_40%,#1d1438,#0b0818)]', row ? 'w-32 self-stretch sm:w-44' : 'aspect-square')}>
        {cover ? (
          <MediaView item={cover} cover={false} className="transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <PhoneMock color={phoneColor(p.color)} />
        )}
        {hasVideo && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            <Play size={10} fill="currentColor" /> Video
          </span>
        )}
        {p.status === 'reservado' && (
          <span className="absolute top-2 left-2 rounded bg-amber-400 px-1.5 py-0.5 text-[11px] font-bold text-black">RESERVADO</span>
        )}
      </div>
      <div className={cn('flex min-w-0 flex-1 flex-col border-white/6', row ? 'border-l p-3' : 'border-t p-4')}>
        <h3 className="line-clamp-2 text-[15px] leading-snug text-white/90">{cardTitle(p)}</h3>
        <p className="mt-1 text-xs text-white/45">{getCondition(p.condition).label}</p>
        <div className="mt-2">
          {discount > 0 && <div className="text-xs text-white/40 line-through">{formatPrice(p.compare_price)}</div>}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-normal tracking-tight text-white">{formatPrice(p.price)}</span>
            {discount > 0 && <span className="text-sm font-semibold text-ml-green">{discount}% OFF</span>}
          </div>
          <Pesos usd={p.price} className="block text-[13px] text-white/50" />
        </div>
        {p.battery != null && (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold" style={{ color: batteryColor(p.battery) }}>
            <BatteryIcon value={p.battery} className="text-white" /> Batería {p.battery}%
          </p>
        )}
        <p className="mt-auto pt-2 text-[13px] font-semibold text-ml-green">Tomamos tu usado</p>
      </div>
    </Wrapper>
  );
}
