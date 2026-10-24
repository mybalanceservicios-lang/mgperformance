import { useEffect, useMemo, useState } from 'react';
import { Info, Loader2, Percent, Plus, Save, Trash2 } from 'lucide-react';
import { STORAGE_OPTIONS } from '@/config';
import { deleteRow, saveRow, setSetting } from '@/lib/store';
import { toSaved, useTradeInRules } from '@/lib/tradeInRules';
import { formatPrice } from '@/lib/utils';
import { Card, PageHeader } from './kit';

const pct = f => Math.round(f * 100);

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
        notify(`${row.model} ${row.storage}: máximo ${formatPrice(v)}`);
      }}
      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
      className="field !min-h-[38px] !w-24 !py-1.5 text-right !text-sm font-semibold"
      aria-label={`Máximo de ${row.model} ${row.storage}`}
    />
  );
}

function PctInput({ value, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          max="100"
          value={pct(value)}
          onChange={e => onChange(Math.max(0, Math.min(100, Number(e.target.value) || 0)) / 100)}
          className="field !min-h-[34px] !w-20 !py-1 text-right !text-sm font-semibold"
        />
        <span className="text-xs text-muted">%</span>
      </span>
    </label>
  );
}

export default function TradeInAdmin({ tradein, products, notify }) {
  const saved = useTradeInRules();
  const [rules, setRules] = useState(saved);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ model: '', storage: '128GB', value: '' });
  const [q, setQ] = useState('');
  const [bulk, setBulk] = useState('');

  useEffect(() => {
    if (!dirty) setRules(saved);
  }, [saved, dirty]);

  const edit = fn => {
    setRules(r => fn(structuredClone(r)));
    setDirty(true);
  };

  const list = useMemo(
    () =>
      [...tradein]
        .filter(r => !q || r.model.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => (parseInt(b.model.replace(/\D/g, '')) || 0) - (parseInt(a.model.replace(/\D/g, '')) || 0) || a.model.localeCompare(b.model) || parseInt(a.storage) - parseInt(b.storage)),
    [tradein, q]
  );

  // referencia: a cuánto vendés ese mismo modelo hoy
  const salePrice = r => {
    const same = products.filter(p => p.model === r.model && p.storage === r.storage && p.price);
    return same.length ? Math.min(...same.map(p => p.price)) : null;
  };

  const saveRules = async () => {
    setBusy(true);
    try {
      await setSetting('trade_in', toSaved(rules));
      setDirty(false);
      notify('Parámetros del cotizador guardados');
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };

  const applyBulk = async () => {
    const p = Number(bulk);
    if (!p) return;
    if (!confirm(`¿${p > 0 ? 'Subir' : 'Bajar'} un ${Math.abs(p)}% todos los máximos (${tradein.length} modelos)?`)) return;
    setBusy(true);
    try {
      for (const r of tradein) await saveRow('tradein', { id: r.id, value: Math.round((r.value * (1 + p / 100)) / 5) * 5, updated_at: new Date().toISOString() });
      notify(`Todos los máximos ${p > 0 ? 'subieron' : 'bajaron'} ${Math.abs(p)}%`);
      setBulk('');
    } finally {
      setBusy(false);
    }
  };

  const add = async e => {
    e.preventDefault();
    if (!f.model.trim() || !(Number(f.value) > 0)) return notify('Completá modelo y máximo');
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

  const example = 400;
  const exCond = rules.conditions[1];
  const exBat = rules.battery[1];
  const exValue = example * exCond.factor * exBat.factor;

  return (
    <div>
      <PageHeader title="Cotizador de usados" subtitle="Vos ponés cuánto pagás como máximo por cada modelo impecable. La web descuenta según cómo está el equipo." />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4 text-sm">
        <Info size={18} className="mt-0.5 shrink-0 text-violet-300" />
        <div>
          <b>¿Cómo se calcula lo que ve el cliente?</b>
          <p className="mt-1 text-muted">
            Máximo del modelo × % del estado × % de la batería (× % de falla si tiene alguna). Se muestra un rango de ±{pct(rules.spread)}%. Ejemplo: máximo {formatPrice(example)}, “{exCond.label}” ({pct(exCond.factor)}%) y batería {exBat.label} ({pct(exBat.factor)}%) → {formatPrice(exValue)}, la web muestra {formatPrice(Math.floor((exValue * (1 - rules.spread)) / 5) * 5)} a {formatPrice(Math.ceil((exValue * (1 + rules.spread)) / 5) * 5)}.
          </p>
          <p className="mt-1 text-xs text-faint">Los máximos que vienen cargados son de referencia: reemplazalos por los tuyos.</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card
          title={`Máximo por modelo, impecable y batería 90%+ (${tradein.length})`}
          action={<input className="field !min-h-[36px] !w-40 !py-1 !text-sm" placeholder="Buscar…" value={q} onChange={e => setQ(e.target.value)} />}
        >
          <ul className="divide-y divide-white/5">
            {list.map(r => {
              const sale = salePrice(r);
              return (
                <li key={r.id} className="flex items-center gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">
                      {r.model} <span className="font-normal text-muted">{r.storage}</span>
                    </div>
                    {sale && <div className="text-xs text-faint">Lo vendés a {formatPrice(sale)} · tomás el {Math.round((r.value / sale) * 100)}%</div>}
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
              );
            })}
          </ul>
          <form onSubmit={add} className="mt-4 grid grid-cols-[1fr_110px_100px_auto] gap-2 border-t border-white/5 pt-4">
            <input className="field !min-h-[40px]" placeholder="Modelo nuevo (ej: iPhone 15 Pro)" value={f.model} onChange={e => setF(p => ({ ...p, model: e.target.value }))} />
            <select className="field !min-h-[40px]" value={f.storage} onChange={e => setF(p => ({ ...p, storage: e.target.value }))}>
              {STORAGE_OPTIONS.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <input className="field !min-h-[40px]" type="number" inputMode="numeric" placeholder="US$" value={f.value} onChange={e => setF(p => ({ ...p, value: e.target.value }))} />
            <button className="btn btn-primary !min-h-[40px] !px-3" aria-label="Agregar">
              <Plus size={18} />
            </button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card title="Parámetros (descuentos)">
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-faint uppercase">Estado por fuera</h3>
            {rules.conditions.map((c, i) => (
              <PctInput key={c.id} label={c.label} value={c.factor} onChange={v => edit(r => ((r.conditions[i].factor = v), r))} />
            ))}
            <h3 className="mt-3 mb-1 text-xs font-semibold tracking-wide text-faint uppercase">Batería</h3>
            {rules.battery.map((b, i) => (
              <PctInput key={b.id} label={b.label} value={b.factor} onChange={v => edit(r => ((r.battery[i].factor = v), r))} />
            ))}
            <h3 className="mt-3 mb-1 text-xs font-semibold tracking-wide text-faint uppercase">Otros</h3>
            <PctInput label="Si tiene alguna falla" value={rules.faultFactor} onChange={v => edit(r => ((r.faultFactor = v), r))} />
            <PctInput label="Rango que se muestra (±)" value={rules.spread} onChange={v => edit(r => ((r.spread = v), r))} />
            <button type="button" onClick={saveRules} disabled={!dirty || busy} className="btn btn-primary mt-4 w-full">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {dirty ? 'Guardar parámetros' : 'Guardado'}
            </button>
          </Card>

          <Card title="Ajustar todos los máximos">
            <p className="mb-3 text-sm text-muted">Útil cuando cambia el mercado: sube o baja todos los modelos de una.</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="number" inputMode="numeric" className="field !pr-8" placeholder="Ej: 5 o -10" value={bulk} onChange={e => setBulk(e.target.value)} />
                <Percent size={14} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
              </div>
              <button type="button" onClick={applyBulk} disabled={!Number(bulk) || busy} className="btn btn-neu">
                Aplicar
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
