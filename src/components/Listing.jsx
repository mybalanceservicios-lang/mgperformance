import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import ListingCard from './ListingCard';
import { Sheet } from './ui';
import { CONDITIONS, STORAGE_OPTIONS } from '@/config';
import { formatPrice, getCondition } from '@/lib/utils';

const BATTERY = [95, 90, 85, 80];
const SORTS = [
  { value: '', label: 'Más relevantes' },
  { value: 'menor', label: 'Menor precio' },
  { value: 'mayor', label: 'Mayor precio' },
  { value: 'bateria', label: 'Mejor batería' }
];

// "iPhone 15 Pro Max" → "iPhone 15"
export const family = model => {
  const m = model?.match(/iphone\s*(\d+e?|air|se)/i);
  if (!m) return model ?? '';
  const k = m[1].toLowerCase();
  return `iPhone ${k === 'air' ? 'Air' : k === 'se' ? 'SE' : k}`;
};

function priceRanges(products) {
  const prices = products.map(p => Number(p.price)).filter(Boolean).sort((a, b) => a - b);
  if (prices.length < 3) return [];
  const round = n => Math.round(n / 50) * 50;
  const a = round(prices[Math.floor(prices.length / 3)]);
  const b = round(prices[Math.floor((prices.length * 2) / 3)]);
  return [
    { label: `Hasta ${formatPrice(a)}`, min: '', max: String(a) },
    { label: `${formatPrice(a)} a ${formatPrice(b)}`, min: String(a), max: String(b) },
    { label: `Más de ${formatPrice(b)}`, min: String(b), max: '' }
  ];
}

export function useFilters() {
  const [params, setParams] = useSearchParams();
  const get = k => params.get(k) ?? '';
  const set = patch => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === '' || v == null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const f = { q: get('q'), condicion: get('condicion'), modelo: get('modelo'), cap: get('cap'), bat: get('bat'), min: get('min'), max: get('max'), orden: get('orden') };
  return { f, set, clear: () => setParams(new URLSearchParams(), { replace: true, preventScrollReset: true }) };
}

function apply(products, f, skip) {
  const q = f.q.trim().toLowerCase();
  return products.filter(p => {
    if (skip !== 'condicion' && f.condicion && p.condition !== f.condicion) return false;
    if (skip !== 'modelo' && f.modelo && family(p.model) !== f.modelo) return false;
    if (skip !== 'cap' && f.cap && p.storage !== f.cap) return false;
    if (skip !== 'bat' && f.bat && !(Number(p.battery) >= Number(f.bat))) return false;
    if (skip !== 'precio') {
      if (f.min && Number(p.price) < Number(f.min)) return false;
      if (f.max && Number(p.price) > Number(f.max)) return false;
    }
    if (q) {
      const hay = [p.model, p.storage, p.color, getCondition(p.condition).label].join(' ').toLowerCase().replace(/\s+/g, ' ');
      if (!q.split(/\s+/).every(w => hay.includes(w) || hay.replace(/ gb/g, 'gb').includes(w))) return false;
    }
    return true;
  });
}

function sortList(list, orden) {
  const by = {
    menor: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
    mayor: (a, b) => (b.price ?? 0) - (a.price ?? 0),
    bateria: (a, b) => (b.battery ?? 0) - (a.battery ?? 0)
  }[orden] ?? ((a, b) => b.featured - a.featured || new Date(b.created_at) - new Date(a.created_at));
  return [...list].sort(by);
}

function Group({ title, options, current, onPick }) {
  if (!options.length) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
      <ul className="space-y-1.5">
        {options.map(o => (
          <li key={o.value}>
            <button type="button" className="ml-link text-left" aria-current={current === o.value} onClick={() => onPick(current === o.value ? '' : o.value)}>
              {o.label} <span className="text-white/35">({o.count})</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Filters({ products, f, set }) {
  const [min, setMin] = useState(f.min);
  const [max, setMax] = useState(f.max);
  const count = (key, test) => apply(products, f, key).filter(test).length;

  const conditions = CONDITIONS.map(c => ({ value: c.id, label: c.label, count: count('condicion', p => p.condition === c.id) })).filter(o => o.count);
  const models = [...new Set(products.map(p => family(p.model)))]
    .sort((a, b) => (parseInt(b.replace(/\D/g, '')) || 99) - (parseInt(a.replace(/\D/g, '')) || 99))
    .map(m => ({ value: m, label: m, count: count('modelo', p => family(p.model) === m) }))
    .filter(o => o.count);
  const caps = STORAGE_OPTIONS.map(s => ({ value: s, label: s.replace('GB', ' GB').replace('TB', ' TB'), count: count('cap', p => p.storage === s) })).filter(o => o.count);
  const bats = BATTERY.map(b => ({ value: String(b), label: `${b}% o más`, count: count('bat', p => Number(p.battery) >= b) })).filter(o => o.count);
  const ranges = priceRanges(products);

  return (
    <div className="space-y-6">
      <Group title="Condición" options={conditions} current={f.condicion} onPick={v => set({ condicion: v })} />
      <Group title="Modelo" options={models} current={f.modelo} onPick={v => set({ modelo: v })} />
      <Group title="Batería" options={bats} current={f.bat} onPick={v => set({ bat: v })} />
      <Group title="Almacenamiento" options={caps} current={f.cap} onPick={v => set({ cap: v })} />
      <div>
        <h3 className="mb-2 text-sm font-semibold text-white">Precio</h3>
        <ul className="mb-3 space-y-1.5">
          {ranges.map(r => (
            <li key={r.label}>
              <button
                type="button"
                className="ml-link"
                aria-current={f.min === r.min && f.max === r.max}
                onClick={() => {
                  setMin(r.min);
                  setMax(r.max);
                  set({ min: r.min, max: r.max });
                }}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
        <form
          className="flex items-center gap-2"
          onSubmit={e => {
            e.preventDefault();
            set({ min, max });
          }}
        >
          <input value={min} onChange={e => setMin(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Mínimo" aria-label="Precio mínimo" className="h-9 w-full min-w-0 rounded-md border border-white/10 bg-white/5 px-2.5 text-sm outline-none focus:border-violet-400/60" />
          <span className="text-white/30">–</span>
          <input value={max} onChange={e => setMax(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Máximo" aria-label="Precio máximo" className="h-9 w-full min-w-0 rounded-md border border-white/10 bg-white/5 px-2.5 text-sm outline-none focus:border-violet-400/60" />
          <button className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-violet-500/40" aria-label="Aplicar precio">›</button>
        </form>
      </div>
    </div>
  );
}

export default function Listing({ products, loading }) {
  const { f, set, clear } = useFilters();
  const [sheet, setSheet] = useState(false);
  const results = useMemo(() => sortList(apply(products, f), f.orden), [products, f]);

  const chips = [
    f.q && { k: 'q', label: `"${f.q}"` },
    f.condicion && { k: 'condicion', label: getCondition(f.condicion).label },
    f.modelo && { k: 'modelo', label: f.modelo },
    f.bat && { k: 'bat', label: `Batería ${f.bat}%+` },
    f.cap && { k: 'cap', label: f.cap },
    (f.min || f.max) && { k: 'precio', label: `${f.min ? formatPrice(f.min) : '0'} – ${f.max ? formatPrice(f.max) : '∞'}` }
  ].filter(Boolean);
  const removeChip = k => set(k === 'precio' ? { min: '', max: '' } : { [k]: '' });

  return (
    <section id="publicaciones" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-10 pb-6">
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        {/* columna izquierda (escritorio) */}
        <aside className="hidden lg:block">
          <h2 className="text-2xl font-semibold">{f.q ? f.q : 'iPhones'}</h2>
          <p className="mt-1 mb-5 text-sm text-white/50">{results.length} resultados</p>
          {chips.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {chips.map(c => (
                <button key={c.k} type="button" onClick={() => removeChip(c.k)} className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs text-white/85 hover:bg-white/15">
                  {c.label} <X size={12} />
                </button>
              ))}
            </div>
          )}
          <Filters key={`${f.min}-${f.max}`} products={products} f={f} set={set} />
        </aside>

        <div>
          {/* barra superior */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="lg:hidden">
              <h2 className="text-xl font-semibold">{f.q ? f.q : 'iPhones'}</h2>
              <p className="text-xs text-white/50">{results.length} resultados</p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <button type="button" onClick={() => setSheet(true)} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 font-medium lg:hidden">
                <SlidersHorizontal size={15} /> Filtrar {chips.length > 0 && `(${chips.length})`}
              </button>
              <label className="flex items-center gap-2 text-white/60">
                <span className="hidden sm:inline">Ordenar por</span>
                <select value={f.orden} onChange={e => set({ orden: e.target.value })} className="cursor-pointer bg-transparent font-semibold text-violet-300 outline-none">
                  {SORTS.map(s => (
                    <option key={s.value} value={s.value} className="bg-[#0e0a1c] text-white">
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
              {chips.map(c => (
                <button key={c.k} type="button" onClick={() => removeChip(c.k)} className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs">
                  {c.label} <X size={12} />
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="ml-card aspect-[3/4.6] animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="ml-panel flex flex-col items-center px-6 py-16 text-center">
              <SearchX size={34} className="text-white/40" />
              <h3 className="mt-4 text-lg font-semibold">No hay publicaciones que coincidan</h3>
              <p className="mt-1 max-w-sm text-sm text-white/55">Revisá la búsqueda o sacá algún filtro. También podés escribirnos: entran equipos todas las semanas.</p>
              <button className="btn btn-ml mt-5" onClick={clear}>Ver todos los iPhones</button>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-2 gap-4 md:grid md:grid-cols-3 xl:grid-cols-4">
                {results.map(p => (
                  <ListingCard key={p.id} product={p} />
                ))}
              </div>
              <div className="space-y-3 md:hidden">
                {results.map(p => (
                  <ListingCard key={p.id} product={p} layout="row" />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filtrar"
        footer={
          <div className="flex gap-3">
            <button className="btn btn-neu flex-1" onClick={clear}>Limpiar</button>
            <button className="btn btn-ml flex-[2]" onClick={() => setSheet(false)}>Ver {results.length} resultados</button>
          </div>
        }
      >
        <Filters key={`${f.min}-${f.max}`} products={products} f={f} set={set} />
      </Sheet>
    </section>
  );
}
