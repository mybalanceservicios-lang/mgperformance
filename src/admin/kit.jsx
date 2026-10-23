import { motion } from 'motion/react';
import { Crown } from 'lucide-react';
import CountUp from '@/components/reactbits/CountUp';
import { InfoTip } from '@/components/ui';
import { cn, formatPrice } from '@/lib/utils';
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
      <div className={cn('mt-2 font-extrabold tracking-tight tabular-nums', big ? 'text-3xl md:text-4xl' : 'text-2xl md:text-[1.7rem]')}>
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
