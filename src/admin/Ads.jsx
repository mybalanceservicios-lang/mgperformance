import { useMemo, useState } from 'react';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { Empty, Segmented } from '@/components/ui';
import { deleteRow, saveRow } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { STORE } from '@/config';
import { Card, DateRange, PageHeader } from './kit';
import { inRange, presetRange, sumBy, todayISO } from './metrics';

const PLATFORMS = ['Instagram', 'Facebook', 'TikTok', 'Google', 'Otro'];
const RATE_KEY = 'mg_last_rate';

export default function Ads({ ads, notify }) {
  const [range, setRange] = useState(() => presetRange('mes'));
  const [form, setForm] = useState(() => ({ date: todayISO(), platform: 'Instagram', currency: 'ARS', amount: '', rate: localStorage.getItem(RATE_KEY) ?? '', notes: '' }));
  const [busy, setBusy] = useState(false);
  const set = patch => setForm(f => ({ ...f, ...patch }));

  const list = useMemo(() => inRange(ads, ...range).sort((a, b) => (a.date < b.date ? 1 : -1)), [ads, range]);
  const total = sumBy(list, a => a.amount);
  const usd = form.currency === 'ARS' ? (Number(form.amount) || 0) / (Number(form.rate) || 1) : Number(form.amount) || 0;

  const add = async e => {
    e.preventDefault();
    if (!(Number(form.amount) > 0)) return notify('Poné el monto');
    if (form.currency === 'ARS' && !(Number(form.rate) > 0)) return notify('Poné la cotización del dólar');
    setBusy(true);
    try {
      if (form.currency === 'ARS') localStorage.setItem(RATE_KEY, form.rate);
      await saveRow('ads', {
        date: form.date,
        platform: form.platform,
        amount: Math.round(usd * 100) / 100,
        original_amount: form.currency === 'ARS' ? Number(form.amount) : null,
        original_currency: form.currency === 'ARS' ? 'ARS' : null,
        rate: form.currency === 'ARS' ? Number(form.rate) : null,
        notes: form.notes
      });
      set({ amount: '', notes: '' });
      notify('Gasto de publicidad cargado');
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Publicidad" subtitle="Cargá lo que vas gastando en anuncios para ver cuánto te cuesta vender." action={<DateRange value={range} onChange={setRange} />} />

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card title="Cargar gasto">
          <form onSubmit={add} className="space-y-4">
            <div>
              <span className="label">Plataforma</span>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button key={p} type="button" onClick={() => set({ platform: p })} className={form.platform === p ? 'chip bg-violet-500 !py-1.5 text-white' : 'chip bg-white/5 !py-1.5 text-muted'}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="label">¿En qué moneda pagaste?</span>
              <Segmented size="sm" options={[{ value: 'ARS', label: 'Pesos' }, { value: 'USD', label: 'Dólares' }]} value={form.currency} onChange={v => set({ currency: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="ad-amount">Monto ({form.currency === 'ARS' ? '$' : 'US$'})</label>
                <input id="ad-amount" type="number" inputMode="decimal" min="0" className="field" value={form.amount} onChange={e => set({ amount: e.target.value })} placeholder={form.currency === 'ARS' ? 'Ej: 35000' : 'Ej: 30'} />
              </div>
              {form.currency === 'ARS' ? (
                <div>
                  <label className="label" htmlFor="ad-rate">Dólar del día</label>
                  <input id="ad-rate" type="number" inputMode="decimal" min="0" className="field" value={form.rate} onChange={e => set({ rate: e.target.value })} placeholder="Ej: 1200" />
                </div>
              ) : (
                <div>
                  <label className="label" htmlFor="ad-date">Fecha</label>
                  <input id="ad-date" type="date" className="field" value={form.date} onChange={e => set({ date: e.target.value })} />
                </div>
              )}
            </div>
            {form.currency === 'ARS' && (
              <div>
                <label className="label" htmlFor="ad-date2">Fecha</label>
                <input id="ad-date2" type="date" className="field" value={form.date} onChange={e => set({ date: e.target.value })} />
              </div>
            )}
            {form.currency === 'ARS' && Number(form.amount) > 0 && Number(form.rate) > 0 && (
              <p className="rounded-2xl bg-white/5 p-3 text-sm text-muted">
                Se guarda como <b className="text-ink">{formatPrice(usd)}</b> para comparar con las ventas.
              </p>
            )}
            <div>
              <label className="label" htmlFor="ad-notes">Nota (opcional)</label>
              <input id="ad-notes" className="field" value={form.notes} onChange={e => set({ notes: e.target.value })} placeholder="Ej: campaña iPhone 15" />
            </div>
            <button className="btn btn-primary w-full" disabled={busy}>
              <Plus size={18} /> Cargar gasto
            </button>
          </form>
        </Card>

        <Card title={`Gastos del período · ${formatPrice(total)}`}>
          {list.length === 0 ? (
            <Empty icon={<Megaphone size={24} />} title="Sin gastos en este período" text="Cargá cada pago de anuncios a medida que lo hacés." />
          ) : (
            <ul className="space-y-2">
              {list.map(a => (
                <li key={a.id} className="neu-sm flex items-center gap-3 p-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ff375f]/15 text-[#ff6b8a]">
                    <Megaphone size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{a.platform}</div>
                    <div className="truncate text-xs text-muted">
                      {new Date(`${a.date}T12:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                      {a.original_amount ? ` · pagado $ ${Number(a.original_amount).toLocaleString('es-AR')} (dólar ${a.rate})` : ''}
                      {a.notes ? ` · ${a.notes}` : ''}
                    </div>
                  </div>
                  <b className="tabular-nums">{formatPrice(a.amount, STORE.currency)}</b>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('¿Borrar este gasto?')) return;
                      await deleteRow('ads', a);
                      notify('Gasto borrado');
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
