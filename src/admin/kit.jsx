import { motion } from 'motion/react';
import { Crown } from 'lucide-react';
import CountUp from '@/components/reactbits/CountUp';
import { InfoTip } from '@/components/ui';
import { cn, formatPrice } from '@/lib/utils';
import { presetRange, RANGE_PRESETS } from './metrics';
import { STORE } from '@/config';

const AVATAR_COLORS = ['#0a84ff', '#30d158', '#bf5af2', '#ff9f0a', '#64d2ff', '#ff375f'];

export function Avatar({ name = '?', owner, size = 40 }) {
  const color = owner ? '#ff9f0a' : AVATAR_COLORS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(145deg, ${color}, color-mix(in srgb, ${color} 60%, #000))`,
        boxShadow: `0 6px 16px -6px ${color}, inset 0 1px 0 rgba(255,255,255,.3)`
      }}
    >
      {name.trim().slice(0, 1).toUpperCase()}
      {owner && (
        <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-[#0e1016]">
          <Crown size={10} className="text-ios-orange" />
        </span>
      )}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// Tarjeta de indicador con número animado (CountUp de React Bits)
export function Kpi({ label, value, money = true, icon, color = 'var(--blue)', hint, sub, className, big }) {
  const prefix = money ? (STORE.currency === 'USD' ? 'US$ ' : '$ ') : '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      className={cn('neu relative overflow-hidden p-4 md:p-5', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-muted">
          {label}
          {hint && <InfoTip title={label}>{hint}</InfoTip>}
        </span>
        {icon && (
          <span className="neu-inset grid h-8 w-8 place-items-center rounded-xl" style={{ color }}>
            {icon}
          </span>
        )}
      </div>
      <div className={cn('mt-2 font-extrabold tracking-tight tabular-nums', big ? 'text-[1.6rem] sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-[1.7rem]')}>
        <CountUp key={value} to={Math.round(value)} duration={1} separator="." prefix={prefix} />
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
      <span className="pointer-events-none absolute -right-6 -bottom-8 h-20 w-20 rounded-full blur-2xl" style={{ background: color, opacity: 0.18 }} />
    </motion.div>
  );
}

export function BarChart({ data, height = 150 }) {
  const max = Math.max(1, ...data.map(d => d.total));
  return (
    <div>
      <div className="flex items-end gap-1.5 md:gap-2" style={{ height }}>
        {data.map((d, i) => {
          const h = (d.total / max) * 100;
          const today = i === data.length - 1;
          return (
            <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end">
              <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg bg-black/80 px-2 py-1 text-[10px] font-semibold whitespace-nowrap group-hover:block">
                {formatPrice(d.total)} · {d.count} u.
              </span>
              <div className="neu-inset absolute inset-0 !rounded-[10px] opacity-60" />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(h, d.total ? 4 : 0)}%` }}
                transition={{ duration: 0.8, delay: i * 0.03, ease: [0.32, 0.72, 0, 1] }}
                className="relative rounded-[10px]"
                style={{
                  background: today ? 'linear-gradient(180deg,#64d2ff,#0a84ff)' : 'linear-gradient(180deg,#3d7bd9,#1f3f7a)',
                  boxShadow: today ? '0 0 18px rgba(10,132,255,.6)' : 'none'
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 md:gap-2">
        {data.map((d, i) => (
          <span key={d.key} className={cn('flex-1 text-center text-[10px] tabular-nums', i === data.length - 1 ? 'font-bold text-ios-blue' : 'text-faint')}>
            {d.day}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Card({ title, action, children, className }) {
  return (
    <section className={cn('neu p-4 md:p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-bold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* Filtro de fechas: atajos + desde/hasta */
export function DateRange({ value, onChange }) {
  const [from, to] = value;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {RANGE_PRESETS.map(p => {
          const [a, b] = presetRange(p.value);
          const on = a === from && b === to;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange([a, b])}
              className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition', on ? 'bg-violet-500 text-white' : 'bg-white/5 text-muted hover:text-ink')}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <input type="date" value={from} onChange={e => onChange([e.target.value, to])} className="field !min-h-[34px] !w-auto !rounded-xl !px-2.5 !py-1 !text-xs" aria-label="Desde" />
        <span>a</span>
        <input type="date" value={to} onChange={e => onChange([from, e.target.value])} className="field !min-h-[34px] !w-auto !rounded-xl !px-2.5 !py-1 !text-xs" aria-label="Hasta" />
      </div>
    </div>
  );
}

export function waPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  // números argentinos cargados sin código de país
  if (digits.length === 10) return `549${digits}`;
  if (digits.length === 11 && digits.startsWith('15')) return null;
  return digits;
}

export function WhatsAppLink({ phone, text = '', className, children, size = 'md' }) {
  const p = waPhone(phone);
  if (!p) return null;
  return (
    <a
      href={`https://wa.me/${p}${text ? `?text=${encodeURIComponent(text)}` : ''}`}
      target="_blank"
      rel="noreferrer"
      onClick={e => e.stopPropagation()}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#22c55e] font-semibold text-[#04210f] transition active:scale-95',
        size === 'sm' ? 'h-9 w-9' : 'h-10 px-3 text-sm',
        className
      )}
      aria-label="Escribir por WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.01c0-5.2 4.24-9.44 9.45-9.44a9.4 9.4 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44" />
      </svg>
      {children}
    </a>
  );
}
