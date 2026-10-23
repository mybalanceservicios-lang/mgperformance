import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Info, X } from 'lucide-react';
import { cn, getCondition } from '@/lib/utils';
import { useMediaUrl } from '@/lib/useProducts';

/* Control segmentado estilo iOS con "pastilla" animada */
export function Segmented({ options, value, onChange, className, size = 'md', grid }) {
  const id = useId();
  return (
    <div className={cn('segmented', grid && 'grid grid-cols-3', className)} role="group">
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={size === 'sm' ? '!px-2.5 !text-[0.8rem]' : undefined}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="seg-thumb"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      onClick={() => onChange(!checked)}
    />
  );
}

/* Ícono de batería estilo iOS: verde ≥ 90, amarillo/naranja ≥ 80, rojo debajo */
export function batteryColor(v) {
  if (v >= 90) return 'var(--green)';
  if (v >= 80) return 'var(--orange)';
  return 'var(--red)';
}

export function BatteryIcon({ value, className }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <svg viewBox="0 0 28 14" className={cn('h-3.5 w-7', className)} aria-hidden="true">
      <rect x="0.75" y="0.75" width="23.5" height="12.5" rx="3.6" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />
      <rect x="25.5" y="4.5" width="1.8" height="5" rx="0.9" fill="currentColor" fillOpacity="0.45" />
      <rect x="2.5" y="2.5" width={(20 * pct) / 100} height="9" rx="2.2" fill={batteryColor(pct)} />
    </svg>
  );
}

export function BatteryBadge({ value, className }) {
  if (value == null || value === '') return null;
  return (
    <span className={cn('chip neu-sm !rounded-full text-ink', className)} title="Condición de la batería (Ajustes → Batería)">
      <BatteryIcon value={value} />
      <span style={{ color: batteryColor(value) }}>{value}%</span>
    </span>
  );
}

export function ConditionBadge({ condition, className }) {
  const c = getCondition(condition);
  return (
    <span
      className={cn('chip', className)}
      style={{ color: c.color, background: `color-mix(in srgb, ${c.color} 14%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
      {c.label}
    </span>
  );
}

export function StatusBadge({ status, className }) {
  if (!status || status === 'disponible') return null;
  const vendido = status === 'vendido';
  return (
    <span
      className={cn('chip glass', className)}
      style={{ color: vendido ? 'var(--red)' : 'var(--orange)' }}
    >
      {vendido ? 'Vendido' : 'Reservado'}
    </span>
  );
}

/* Botón "i" con globo explicativo — didáctico sin ocupar lugar */
export function InfoTip({ title, children, className, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = e => !ref.current?.contains(e.target) && setOpen(false);
    const esc = e => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  return (
    <span ref={ref} className={cn('relative inline-flex align-middle', className)}>
      <button
        type="button"
        aria-label={`Más info: ${title}`}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="grid h-6 w-6 place-items-center rounded-full text-muted transition hover:text-ios-blue"
      >
        <Info size={15} strokeWidth={2.2} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'glass absolute top-8 z-50 block w-64 rounded-2xl p-3.5 text-left text-[0.82rem] leading-relaxed text-muted shadow-2xl',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            <span className="mb-1 block font-semibold text-ink">{title}</span>
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* Hoja deslizable: desde abajo en celular (como iOS) y desde la derecha en escritorio */
export function Sheet({ open, onClose, title, children, footer, side = 'right' }) {
  useEffect(() => {
    if (!open) return;
    const esc = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  const from = isDesktop ? { x: side === 'right' ? '100%' : '-100%' } : { y: '100%' };
  const to = isDesktop ? { x: 0 } : { y: 0 };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={from}
            animate={to}
            exit={from}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            drag={isDesktop ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
            className={cn(
              'absolute flex flex-col bg-[#11141b] shadow-[0_-20px_60px_rgba(0,0,0,0.6)]',
              isDesktop
                ? cn('top-0 bottom-0 w-[440px] max-w-full border-white/5', side === 'right' ? 'right-0 border-l' : 'left-0 border-r')
                : 'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-[28px] border-t border-white/5'
            )}
          >
            {!isDesktop && <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-white/20" />}
            <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-3">
              <h2 className="text-xl font-bold">{title}</h2>
              <button type="button" onClick={onClose} className="icon-btn neu-sm !h-9 !w-9 !rounded-full text-muted" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
            {footer && <div className="shrink-0 border-t border-white/5 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* Dibujo de iPhone para productos sin fotos */
export function PhoneMock({ color = '#2a2f3d', className, label }) {
  return (
    <div className={cn('relative grid h-full w-full place-items-center overflow-hidden grid-dots', className)}>
      <div
        className="absolute h-2/3 w-2/3 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${color}55, transparent 70%)` }}
      />
      <div
        className="relative aspect-[9/19] h-[78%] rounded-[18%/8.5%] p-[3.5%]"
        style={{
          background: 'linear-gradient(145deg, #3a3f4c, #15181f)',
          boxShadow: '12px 14px 30px rgba(0,0,0,.6), -6px -6px 16px rgba(255,255,255,.04), inset 0 0 0 1px rgba(255,255,255,.12)'
        }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[15%/7.2%] bg-gradient-to-br from-[#0a1430] via-[#151b3a] to-[#2a0f3a]">
          <div className="absolute top-[2.5%] left-1/2 h-[3.6%] w-[34%] -translate-x-1/2 rounded-full bg-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(10,132,255,.45),transparent_55%),radial-gradient(circle_at_75%_30%,rgba(191,90,242,.4),transparent_50%)]" />
          {label && (
            <span className="absolute inset-x-0 bottom-[12%] text-center text-[10px] font-semibold tracking-wide text-white/70">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* Foto o video (resuelve también archivos del modo demo) */
export function MediaView({ item, className, controls = false, autoPlay = false, cover = true }) {
  const url = useMediaUrl(item?.url);
  if (!item || !url) return <div className={cn('animate-pulse bg-white/[0.03]', className)} />;
  const fit = cover ? 'object-cover' : 'object-contain';
  if (item.type === 'video') {
    return (
      <video
        src={controls ? url : `${url}#t=0.1`}
        className={cn('h-full w-full', fit, className)}
        playsInline
        muted={!controls}
        loop={!controls}
        autoPlay={autoPlay}
        controls={controls}
        preload="metadata"
      />
    );
  }
  return <img src={url} alt="" loading="lazy" decoding="async" className={cn('h-full w-full', fit, className)} />;
}

export function Empty({ icon, title, text, action }) {
  return (
    <div className="neu flex flex-col items-center px-6 py-14 text-center">
      <div className="neu-inset mb-4 grid h-16 w-16 place-items-center rounded-2xl text-muted">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
