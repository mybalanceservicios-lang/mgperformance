import { formatARS, rateValue, toPesos, useDolar } from '@/lib/dolar';
import { STORE } from '@/config';
import { cn } from '@/lib/utils';

// Muestra el equivalente en pesos al dólar blue del día (no muestra nada si no hay cotización)
export default function Pesos({ usd, className, prefix = '' }) {
  const rate = useDolar();
  const ars = toPesos(usd, rate);
  if (ars == null) return null;
  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {formatARS(ars)}
    </span>
  );
}

export function DolarChip({ className }) {
  const rate = useDolar();
  const v = rateValue(rate);
  if (!v) return null;
  const at = new Date(rate.updated);
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap', className)} title={`Dólar blue ${STORE.dolarField} · ${rate.source} · actualizado ${at.toLocaleString('es-AR')}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
      Dólar blue {formatARS(v)}
    </span>
  );
}
