import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { RotateCcw, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from './ProductCard';
import { Empty, InfoTip, Segmented, Sheet, Switch } from './ui';
import { BATTERY_FILTERS, CONDITIONS, STORAGE_OPTIONS } from '@/config';
import { cn, formatPrice, getCondition } from '@/lib/utils';

const SORTS = [
  { value: 'recientes', label: 'Más nuevos primero' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'bateria', label: 'Mejor batería' }
];

export const DEFAULT_FILTERS = {
  q: '',
  condition: 'all',
  battery: 0,
  storage: [],
  model: 'all',
  price: null, // [min, max] o null = sin límite
  sort: 'recientes',
  hideSold: true
};

// Agrupa "iPhone 15 Pro Max" → "iPhone 15" para el selector de modelo
const family = model => (model?.match(/iphone\s*\d+e?|iphone\s*se/i)?.[0] ?? model ?? '').replace(/\s+/g, ' ').replace(/^iphone/i, 'iPhone');

function numSort(a, b) {
  return (parseInt(b.replace(/\D/g, ''), 10) || 0) - (parseInt(a.replace(/\D/g, ''), 10) || 0) || a.localeCompare(b);
}

export function applyFilters(products, f) {
  const q = f.q.trim().toLowerCase();
  const list = products.filter(p => {
    if (f.hideSold && p.status === 'vendido') return false;
    if (f.condition !== 'all' && p.condition !== f.condition) return false;
    if (f.battery && (p.battery == null || Number(p.battery) < f.battery)) return false;
    if (f.storage.length && !f.storage.includes(p.storage)) return false;
    if (f.model !== 'all' && family(p.model) !== f.model) return false;
    if (f.price) {
      const price = Number(p.price);
      if (price < f.price[0] || price > f.price[1]) return false;
    }
    if (q) {
      const hay = [p.model, p.storage, p.color, getCondition(p.condition).label, p.description].join(' ').toLowerCase();
      if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const by = {
    recientes: (a, b) => (b.featured - a.featured) || new Date(b.created_at) - new Date(a.created_at),
    'precio-asc': (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
    'precio-desc': (a, b) => (b.price ?? 0) - (a.price ?? 0),
    bateria: (a, b) => (b.battery ?? 0) - (a.battery ?? 0)
  }[f.sort];
  return [...list].sort(by);
}

function PriceRange({ bounds, value, onChange }) {
  const [lo, hi] = value ?? bounds;
  const span = Math.max(1, bounds[1] - bounds[0]);
  const step = span > 2000 ? 50 : 10;
  const pct = v => ((v - bounds[0]) / span) * 100;
  const set = (a, b) => onChange(a <= bounds[0] && b >= bounds[1] ? null : [a, b]);
  return (
    <div>
      <div className="range-dual">
        <div className="track" />
        <div className="fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range"
          aria-label="Precio mínimo"
          min={bounds[0]}
          max={bounds[1]}
          step={step}
          value={lo}
          onChange={e => set(Math.min(Number(e.target.value), hi - step), hi)}
        />
        <input
          type="range"
          aria-label="Precio máximo"
          min={bounds[0]}
          max={bounds[1]}
          step={step}
          value={hi}
          onChange={e => set(lo, Math.max(Number(e.target.value), lo + step))}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
        <span className="neu-inset rounded-xl px-3 py-1.5 font-semibold tabular-nums">{formatPrice(lo)}</span>
        <span className="h-px flex-1 bg-white/10" />
        <span className="neu-inset rounded-xl px-3 py-1.5 font-semibold tabular-nums">{formatPrice(hi)}</span>
      </div>
    </div>
  );
}

function FilterPanel({ filters, set, products, bounds }) {
  const models = useMemo(() => [...new Set(products.map(p => family(p.model)).filter(Boolean))].sort(numSort), [products]);
  const storages = useMemo(() => {
    const present = new Set(products.map(p => p.storage));
    return STORAGE_OPTIONS.filter(s => present.has(s));
  }, [products]);

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <span className="label !mb-0">Batería mínima</span>
          <InfoTip title="¿Qué es la condición de batería?" align="right">
            Es el porcentaje de capacidad que conserva la batería respecto de cuando era nueva (Ajustes → Batería → Estado). Arriba de
            90% el rendimiento es prácticamente de equipo nuevo; 80–89% es muy bueno para el día a día.
          </InfoTip>
        </div>
        <Segmented
          size="sm"
          grid
          options={BATTERY_FILTERS.map(b => ({ value: b.value, label: b.label }))}
          value={filters.battery}
          onChange={v => set({ battery: v })}
        />
      </section>

      <section>
        <span className="label">Precio</span>
        <PriceRange bounds={bounds} value={filters.price} onChange={v => set({ price: v })} />
      </section>

      {storages.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className="label !mb-0">Almacenamiento</span>
            <InfoTip title="¿Cuánto espacio necesito?" align="right">
              128GB alcanza para uso normal. Si grabás mucho video o guardás todas tus fotos en el teléfono, apuntá a 256GB o más.
            </InfoTip>
          </div>
          <div className="flex flex-wrap gap-2">
            {storages.map(s => {
              const on = filters.storage.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ storage: on ? filters.storage.filter(x => x !== s) : [...filters.storage, s] })}
                  className={cn('btn btn-neu !min-h-[38px] !px-3.5 !text-sm', on && '!text-ios-blue')}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <label className="label" htmlFor="f-model">Modelo</label>
        <select id="f-model" className="field" value={filters.model} onChange={e => set({ model: e.target.value })}>
          <option value="all">Todos los modelos</option>
          {models.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </section>

      <section>
        <label className="label" htmlFor="f-sort">Ordenar por</label>
        <select id="f-sort" className="field" value={filters.sort} onChange={e => set({ sort: e.target.value })}>
          {SORTS.map(s => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </section>

      <section className="neu-inset flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Ocultar vendidos</div>
          <div className="text-xs text-muted">Mostrar solo lo que podés llevarte</div>
        </div>
        <Switch checked={filters.hideSold} onChange={v => set({ hideSold: v })} label="Ocultar vendidos" />
      </section>
    </div>
  );
}

export default function Catalog({ products, loading, filters, setFilters }) {
  const [sheet, setSheet] = useState(false);
  const set = patch => setFilters(f => ({ ...f, ...patch }));

  const bounds = useMemo(() => {
    const prices = products.map(p => Number(p.price)).filter(n => n > 0);
    if (!prices.length) return [0, 1000];
    const step = 50;
    return [Math.floor(Math.min(...prices) / step) * step, Math.ceil(Math.max(...prices) / step) * step];
  }, [products]);

  // si cambian los productos y el rango quedó afuera, lo reseteamos
  useEffect(() => {
    if (filters.price && (filters.price[0] < bounds[0] || filters.price[1] > bounds[1])) set({ price: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds]);

  const results = useMemo(() => applyFilters(products, filters), [products, filters]);

  const active = [
    filters.battery > 0 && { key: 'battery', label: `Batería +${filters.battery}%`, clear: { battery: 0 } },
    filters.price && { key: 'price', label: `${formatPrice(filters.price[0])} – ${formatPrice(filters.price[1])}`, clear: { price: null } },
    ...filters.storage.map(s => ({ key: s, label: s, clear: { storage: filters.storage.filter(x => x !== s) } })),
    filters.model !== 'all' && { key: 'model', label: filters.model, clear: { model: 'all' } },
    !filters.hideSold && { key: 'sold', label: 'Incluye vendidos', clear: { hideSold: true } }
  ].filter(Boolean);

  const reset = () => setFilters(f => ({ ...DEFAULT_FILTERS, sort: f.sort }));

  const conditionOptions = [
    { value: 'all', label: 'Todos' },
    ...CONDITIONS.map(c => ({ value: c.id, label: c.short }))
  ];

  return (
    <section id="catalogo" className="mx-auto max-w-6xl px-4 pt-20">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ios-blue">Catálogo</p>
          <h2 className="text-3xl font-bold md:text-4xl">Elegí tu equipo</h2>
        </div>
        <p className="text-sm text-muted">
          {loading ? 'Cargando…' : `${results.length} ${results.length === 1 ? 'equipo' : 'equipos'}`}
        </p>
      </div>

      {/* barra superior: buscador + condición */}
      <div className="sticky top-[76px] z-30 -mx-4 mb-5 px-4 py-2">
        <div className="glass flex flex-col gap-2.5 rounded-[22px] p-2.5 shadow-[0_14px_40px_rgba(0,0,0,0.4)] md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={filters.q}
              onChange={e => set({ q: e.target.value })}
              placeholder="Buscar: 15 Pro, 256GB, azul…"
              className="field !min-h-[44px] !pl-10"
              aria-label="Buscar equipos"
            />
          </div>
          <div className="flex gap-2.5">
            <Segmented
              className="min-w-0 flex-1 md:flex-none"
              options={conditionOptions}
              value={filters.condition}
              onChange={v => set({ condition: v })}
              size="sm"
            />
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="btn btn-neu relative !min-h-[44px] !px-3.5 lg:hidden"
              aria-label="Más filtros"
            >
              <SlidersHorizontal size={18} />
              {active.length > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-ios-blue text-[11px] font-bold text-white">
                  {active.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {filters.condition !== 'all' && (
        <p className="-mt-2 mb-4 flex items-center gap-2 px-1 text-sm text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: getCondition(filters.condition).color }} />
          <b className="text-ink">{getCondition(filters.condition).label}:</b> {getCondition(filters.condition).hint}
        </p>
      )}

      {active.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4">
          {active.map(a => (
            <button
              key={a.key}
              type="button"
              onClick={() => set(a.clear)}
              className="chip neu-sm shrink-0 !py-1.5 text-ink hover:text-ios-red"
              aria-label={`Quitar filtro ${a.label}`}
            >
              {a.label} <X size={13} />
            </button>
          ))}
          <button type="button" onClick={reset} className="chip shrink-0 !py-1.5 text-ios-blue">
            <RotateCcw size={13} /> Limpiar todo
          </button>
        </div>
      )}

      <div className="grid gap-7 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="neu sticky top-[160px] p-5">
            <h3 className="mb-5 flex items-center gap-2 font-bold">
              <SlidersHorizontal size={17} className="text-ios-blue" /> Filtros
            </h3>
            <FilterPanel filters={filters} set={set} products={products} bounds={bounds} />
          </div>
        </aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3.5 sm:gap-5 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="neu aspect-[3/4.4] animate-pulse" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <Empty
              icon={<SearchX size={26} />}
              title="No encontramos equipos con esos filtros"
              text="Probá bajar la batería mínima o ampliar el precio. También podés escribirnos: muchas veces tenemos ingresos que todavía no publicamos."
              action={
                <button className="btn btn-primary" onClick={reset}>
                  Limpiar filtros
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:gap-5 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {results.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filtros"
        footer={
          <div className="flex gap-3">
            <button className="btn btn-neu flex-1" onClick={reset}>
              Limpiar
            </button>
            <button className="btn btn-primary flex-[2]" onClick={() => setSheet(false)}>
              Ver {results.length} {results.length === 1 ? 'equipo' : 'equipos'}
            </button>
          </div>
        }
      >
        <FilterPanel filters={filters} set={set} products={products} bounds={bounds} />
      </Sheet>
    </section>
  );
}
