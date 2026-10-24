import { useMemo, useState } from 'react';
import { PiggyBank, Plus, Trash2 } from 'lucide-react';
import { Empty } from '@/components/ui';
import { deleteRow, saveRow } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { STORE } from '@/config';
import { Card, DateRange, PageHeader } from './kit';
import { inRange, presetRange, sumBy, todayISO } from './metrics';

export default function Purchases({ purchases, notify }) {
  const [range, setRange] = useState(() => presetRange('mes'));
  const [f, setF] = useState({ date: todayISO(), description: '', qty: 1, unit_cost: '', supplier: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const set = patch => setF(p => ({ ...p, ...patch }));
  const list = useMemo(() => inRange(purchases, ...range).sort((a, b) => (a.date < b.date ? 1 : -1)), [purchases, range]);
  const invested = sumBy(list, p => p.qty * p.unit_cost);
  const units = sumBy(list, p => p.qty);

  const add = async e => {
    e.preventDefault();
    if (!f.description.trim() || !(Number(f.unit_cost) >= 0) || f.unit_cost === '') return notify('Completá qué entró y cuánto costó');
    setBusy(true);
    try {
      await saveRow('purchases', { ...f, description: f.description.trim(), qty: Number(f.qty) || 1, unit_cost: Number(f.unit_cost) });
      set({ description: '', qty: 1, unit_cost: '', notes: '' });
      notify('Ingreso de equipos cargado');
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Inversión" subtitle="Cuánto invertís y cuántos equipos te entran." action={<DateRange value={range} onChange={setRange} />} />
      <div className="mb-5 grid grid-cols-2 gap-3.5">
        <div className="neu p-4">
          <div className="text-xs font-semibold text-muted">Invertido en el período</div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums">{formatPrice(invested)}</div>
        </div>
        <div className="neu p-4">
          <div className="text-xs font-semibold text-muted">Equipos que entraron</div>
          <div className="mt-1 text-2xl font-extrabold tabular-nums">{units}</div>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card title="Cargar ingreso de equipos">
          <form onSubmit={add} className="space-y-4">
            <div>
              <label className="label" htmlFor="pu-desc">¿Qué entró? *</label>
              <input id="pu-desc" className="field" value={f.description} onChange={e => set({ description: e.target.value })} placeholder="Ej: 3 iPhone 13 128GB" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="pu-qty">Cantidad</label>
                <input id="pu-qty" type="number" min="1" inputMode="numeric" className="field" value={f.qty} onChange={e => set({ qty: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="pu-cost">Costo c/u ({STORE.currency})</label>
                <input id="pu-cost" type="number" min="0" inputMode="decimal" className="field" value={f.unit_cost} onChange={e => set({ unit_cost: e.target.value })} placeholder="Ej: 380" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="pu-date">Fecha</label>
                <input id="pu-date" type="date" className="field" value={f.date} onChange={e => set({ date: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="pu-sup">Proveedor</label>
                <input id="pu-sup" className="field" value={f.supplier} onChange={e => set({ supplier: e.target.value })} placeholder="Opcional" />
              </div>
            </div>
            {Number(f.qty) > 0 && Number(f.unit_cost) > 0 && (
              <p className="rounded-2xl bg-white/5 p-3 text-sm text-muted">Total: <b className="text-ink">{formatPrice(f.qty * f.unit_cost)}</b></p>
            )}
            <button className="btn btn-primary w-full" disabled={busy}>
              <Plus size={18} /> Cargar
            </button>
          </form>
        </Card>
        <Card title="Ingresos del período">
          {list.length === 0 ? (
            <Empty icon={<PiggyBank size={24} />} title="Sin ingresos en este período" text="Cada vez que comprás equipos, cargalo acá." />
          ) : (
            <ul className="space-y-2">
              {list.map(p => (
                <li key={p.id} className="neu-sm flex items-center gap-3 p-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ios-teal/15 font-bold text-ios-teal">{p.qty}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.description}</div>
                    <div className="truncate text-xs text-muted">
                      {new Date(`${p.date}T12:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · {formatPrice(p.unit_cost)} c/u{p.supplier ? ` · ${p.supplier}` : ''}
                    </div>
                  </div>
                  <b className="tabular-nums">{formatPrice(p.qty * p.unit_cost)}</b>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('¿Borrar este ingreso?')) return;
                      await deleteRow('purchases', p);
                      notify('Ingreso borrado');
                    }}
                    className="grid h-9 w-9 place-items-center rounded-xl text-faint hover:text-ios-red"
                    aria-label="Borrar"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
