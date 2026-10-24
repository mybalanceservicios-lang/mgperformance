import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { STORAGE_OPTIONS, TRADE_IN } from '@/config';
import { deleteRow, saveRow } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { Card, PageHeader } from './kit';

function ValueInput({ row, notify }) {
  const [v, setV] = useState(row.value);
  return (
    <input
      type="number"
      inputMode="numeric"
      min="0"
      value={v}
      onChange={e => setV(e.target.value)}
      onBlur={async () => {
        if (String(v) === String(row.value) || v === '') return;
        await saveRow('tradein', { id: row.id, value: Number(v), updated_at: new Date().toISOString() });
        notify(`${row.model} ${row.storage} actualizado`);
      }}
      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
      className="field !min-h-[38px] !w-28 !py-1.5 text-right !text-sm font-semibold"
      aria-label={`Valor de ${row.model} ${row.storage}`}
    />
  );
}

export default function TradeInAdmin({ tradein, notify }) {
  const [f, setF] = useState({ model: '', storage: '128GB', value: '' });
  const [q, setQ] = useState('');
  const list = useMemo(
    () =>
      [...tradein]
        .filter(r => !q || r.model.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => (parseInt(b.model.replace(/\D/g, '')) || 0) - (parseInt(a.model.replace(/\D/g, '')) || 0) || a.model.localeCompare(b.model) || parseInt(a.storage) - parseInt(b.storage)),
    [tradein, q]
  );

  const add = async e => {
    e.preventDefault();
    if (!f.model.trim() || !(Number(f.value) > 0)) return notify('Completá modelo y valor');
    let model = f.model.trim().replace(/\s+/g, ' ');
    if (!/^iphone/i.test(model)) model = `iPhone ${model}`;
    model = model.replace(/^iphone/i, 'iPhone').replace(/pro max/i, 'Pro Max').replace(/\bpro\b/i, 'Pro').replace(/\bplus\b/i, 'Plus');
    try {
      await saveRow('tradein', { model, storage: f.storage, value: Number(f.value) });
      setF({ model: '', storage: f.storage, value: '' });
      notify(`${model} ${f.storage} agregado`);
    } catch (err) {
      notify(/duplicate|unique/i.test(err.message) ? 'Ese modelo y capacidad ya está cargado' : err.message);
    }
  };

  return (
    <div>
      <PageHeader title="Cotizador de usados" subtitle="Cuánto tomás cada modelo en estado impecable y batería 90% o más. La web calcula el resto sola." />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card title={`Valores (${tradein.length})`} action={<input className="field !min-h-[36px] !w-44 !py-1 !text-sm" placeholder="Buscar modelo…" value={q} onChange={e => setQ(e.target.value)} />}>
          <ul className="divide-y divide-white/5">
            {list.map(r => (
              <li key={r.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{r.model}</div>
                  <div className="text-xs text-muted">{r.storage}</div>
                </div>
                <span className="text-xs text-muted">US$</span>
                <ValueInput key={`${r.id}-${r.value}`} row={r} notify={notify} />
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`¿Sacar ${r.model} ${r.storage} del cotizador?`)) return;
                    await deleteRow('tradein', r);
                    notify('Quitado del cotizador');
                  }}
                  className="grid h-9 w-9 place-items-center rounded-xl text-faint hover:text-ios-red"
                  aria-label="Quitar"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-5">
          <Card title="Agregar modelo">
            <form onSubmit={add} className="space-y-3">
              <input className="field" placeholder="Modelo (ej: iPhone 15 Pro)" value={f.model} onChange={e => setF(p => ({ ...p, model: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <select className="field" value={f.storage} onChange={e => setF(p => ({ ...p, storage: e.target.value }))}>
                  {STORAGE_OPTIONS.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <input className="field" type="number" inputMode="numeric" placeholder="US$" value={f.value} onChange={e => setF(p => ({ ...p, value: e.target.value }))} />
              </div>
              <button className="btn btn-primary w-full">
                <Plus size={18} /> Agregar
              </button>
            </form>
          </Card>
          <Card title="Cómo calcula">
            <ul className="space-y-1.5 text-sm text-muted">
              {TRADE_IN.conditions.map(c => (
                <li key={c.id} className="flex justify-between">
                  <span>{c.label}</span> <b className="text-ink">{Math.round(c.factor * 100)}%</b>
                </li>
              ))}
              <li className="my-2 border-t border-white/5" />
              {TRADE_IN.battery.map(b => (
                <li key={b.id} className="flex justify-between">
                  <span>Batería {b.label}</span> <b className="text-ink">{Math.round(b.factor * 100)}%</b>
                </li>
              ))}
              <li className="flex justify-between">
                <span>Con alguna falla</span> <b className="text-ink">{Math.round(TRADE_IN.faultFactor * 100)}%</b>
              </li>
            </ul>
            <p className="mt-3 text-xs text-faint">
              Ej: valor {formatPrice(400)}, “Muy bueno” y batería 85–89% → {formatPrice(400 * 0.9 * 0.95)}. La web muestra un rango de ±{Math.round(TRADE_IN.spread * 100)}%.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
