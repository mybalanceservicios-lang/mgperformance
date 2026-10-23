// Cálculos del sistema de gestión.
// Comisión de una venta = (precio de venta − precio a rendir) × cantidad.

export const saleTotal = s => Number(s.unit_price) * s.qty;
export const saleOwner = s => Number(s.owner_price || 0) * s.qty;
export const saleCommission = s => saleTotal(s) - saleOwner(s);

export const PERIODS = [
  { value: 'hoy', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: 'mes', label: 'Este mes' },
  { value: 'todo', label: 'Todo' }
];

export function periodStart(period) {
  const now = new Date();
  if (period === 'hoy') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === '7d') return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  if (period === 'mes') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(0);
}

export const inPeriod = (sales, period) => {
  const from = periodStart(period);
  return sales.filter(s => new Date(s.created_at) >= from);
};

export function summarize(sales) {
  return sales.reduce(
    (a, s) => {
      a.count += s.qty;
      a.total += saleTotal(s);
      a.owner += saleOwner(s);
      a.commission += saleCommission(s);
      if (!s.settled) a.pending += saleOwner(s);
      return a;
    },
    { count: 0, total: 0, owner: 0, commission: 0, pending: 0 }
  );
}

// Ventas por día de los últimos N días: [{ date, label, total, count }]
export function byDay(sales, days = 14) {
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    out.push({ key: d.toDateString(), date: d, label: d.toLocaleDateString('es-AR', { weekday: 'narrow' }), day: d.getDate(), total: 0, count: 0 });
  }
  const map = Object.fromEntries(out.map(o => [o.key, o]));
  for (const s of sales) {
    const o = map[new Date(s.created_at).toDateString()];
    if (o) {
      o.total += saleTotal(s);
      o.count += s.qty;
    }
  }
  return out;
}

export function stockSummary(products, prices) {
  return products.reduce(
    (a, p) => {
      const units = Number(p.stock) || 0;
      a.units += units;
      a.value += units * (Number(p.price) || 0);
      a.ownerValue += units * (Number(prices[p.id]) || 0);
      if (units > 0 && prices[p.id] == null) a.missingPrice.push(p);
      return a;
    },
    { units: 0, value: 0, ownerValue: 0, missingPrice: [] }
  );
}

export function timeAgo(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d) / 60000;
  if (diff < 1) return 'recién';
  if (diff < 60) return `hace ${Math.round(diff)} min`;
  if (diff < 60 * 24 && d.getDate() === new Date().getDate()) return `hoy ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) + ` ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
}
