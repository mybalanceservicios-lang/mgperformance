import { useMemo, useState } from 'react';
import { AlertTriangle, Camera, Minus, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { ConditionBadge, Empty, InfoTip, MediaView, PhoneMock, Segmented } from '@/components/ui';
import { STATUSES } from '@/config';
import { deleteProduct, saveProduct, setOwnerPrice } from '@/lib/store';
import { cn, formatPrice, getCondition } from '@/lib/utils';
import { PageHeader } from './kit';
import { stockSummary } from './metrics';
import ProductForm from './ProductForm';

function OwnerPriceInput({ product, value, notify }) {
  const [v, setV] = useState(value ?? '');
  const save = async () => {
    if (String(v) === String(value ?? '')) return;
    await setOwnerPrice(product.id, v);
    notify('Precio a rendir actualizado');
  };
  return (
    <input
      type="number"
      inputMode="numeric"
      min="0"
      value={v}
      onChange={e => setV(e.target.value)}
      onBlur={save}
      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
      placeholder="Definir"
      aria-label={`Precio a rendir de ${product.model}`}
      className={cn('field !min-h-[38px] !w-28 !py-1.5 !text-sm font-semibold', value == null && 'placeholder:text-ios-orange')}
    />
  );
}

export default function Inventory({ products, prices, isOwner, notify }) {
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('stock');

  const stock = stockSummary(products, prices);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter(p => {
      if (tab === 'stock' && !(p.stock > 0)) return false;
      if (tab === 'sin-stock' && p.stock > 0) return false;
      if (tab === 'sin-precio' && !(p.stock > 0 && prices[p.id] == null)) return false;
      return !s || [p.model, p.storage, p.color].join(' ').toLowerCase().includes(s);
    });
  }, [products, prices, q, tab]);

  if (editing)
    return (
      <ProductForm
        initial={editing}
        isOwner={isOwner}
        ownerPrice={editing.id ? prices[editing.id] : undefined}
        onClose={() => setEditing(null)}
        onSaved={(_, isNew) => {
          setEditing(null);
          notify(isNew ? 'Publicación creada' : 'Cambios guardados');
        }}
      />
    );

  const changeStock = async (p, d) => {
    await saveProduct({ ...p, stock: Math.max(0, (p.stock ?? 0) + d) });
  };
  const remove = async p => {
    if (!confirm(`¿Eliminar "${p.model} ${p.storage ?? ''}"? Se borran sus fotos y videos. Las ventas ya registradas se mantienen.`)) return;
    await deleteProduct(p);
    notify('Publicación eliminada');
  };

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle="Publicaciones de la tienda y su stock. Cada venta descuenta stock sola."
        action={
          <button type="button" onClick={() => setEditing({})} className="btn btn-primary !min-h-[46px]">
            <Plus size={19} /> Nueva publicación
          </button>
        }
      />

      <div className="neu-inset mb-5 grid grid-cols-3 rounded-[22px] p-4 text-sm">
        <div>
          <div className="text-xs text-muted">Unidades</div>
          <div className="text-lg font-bold tabular-nums">{stock.units}</div>
        </div>
        <div>
          <div className="text-xs text-muted">Valor publicado</div>
          <div className="text-lg font-bold tabular-nums">{formatPrice(stock.value)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs text-muted">
            Valor a rendir
            <InfoTip title="Valor a rendir" align="right">Lo que entraría para el dueño si se vende todo el stock.</InfoTip>
          </div>
          <div className="text-lg font-bold tabular-nums">{formatPrice(stock.ownerValue)}</div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
          <input type="search" className="field !pl-10" placeholder="Buscar en inventario…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Segmented
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'stock', label: 'Con stock' },
            { value: 'sin-stock', label: 'Sin stock' },
            ...(isOwner ? [{ value: 'sin-precio', label: `Sin precio (${stock.missingPrice.length})` }] : []),
            { value: 'all', label: 'Todo' }
          ]}
        />
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<Camera size={26} />}
          title={products.length ? 'Nada por acá' : 'Todavía no hay publicaciones'}
          text={products.length ? 'Probá con otro filtro.' : 'Creá la primera: subí fotos, completá los datos y listo.'}
          action={!products.length && <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Crear publicación</button>}
        />
      ) : (
        <ul className="space-y-3">
          {list.map(p => {
            const rend = prices[p.id];
            const commission = rend != null && p.price ? p.price - rend : null;
            return (
              <li key={p.id} className="neu flex flex-wrap items-center gap-3 p-3 md:flex-nowrap md:gap-4">
                <button type="button" onClick={() => setEditing(p)} className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[#0b0d12]">
                  {p.media?.[0] ? <MediaView item={p.media[0]} /> : <PhoneMock color={getCondition(p.condition).color} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{p.model}</span>
                    {p.featured && <Star size={14} className="shrink-0 fill-ios-orange text-ios-orange" />}
                  </div>
                  <div className="truncate text-sm text-muted">
                    {[p.storage, p.color, p.battery != null && `${p.battery}%`].filter(Boolean).join(' · ')}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <ConditionBadge condition={p.condition} />
                    {p.status !== 'disponible' && (
                      <span className={cn('chip', p.status === 'vendido' ? 'bg-ios-red/10 text-ios-red' : 'bg-ios-orange/10 text-ios-orange')}>
                        {STATUSES.find(s => s.id === p.status)?.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end md:gap-5">
                  <div className="text-left md:text-right">
                    <div className="text-[11px] text-muted">Publicado</div>
                    <div className="font-bold tabular-nums">{formatPrice(p.price)}</div>
                  </div>
                  <div>
                    <div className="mb-0.5 flex items-center gap-1 text-[11px] text-muted">
                      A rendir {rend == null && <AlertTriangle size={11} className="text-ios-orange" />}
                    </div>
                    {isOwner ? (
                      <OwnerPriceInput key={`${p.id}-${rend}`} product={p} value={rend} notify={notify} />
                    ) : (
                      <div className="font-bold tabular-nums">{rend != null ? formatPrice(rend) : '—'}</div>
                    )}
                    {commission != null && <div className="mt-0.5 text-[11px] text-ios-green">comisión +{formatPrice(commission)}</div>}
                  </div>
                  <div>
                    <div className="mb-0.5 text-center text-[11px] text-muted">Stock</div>
                    <div className="neu-inset flex items-center rounded-full p-1">
                      <button type="button" onClick={() => changeStock(p, -1)} disabled={!p.stock} className="grid h-8 w-8 place-items-center rounded-full text-muted disabled:opacity-30" aria-label="Restar stock">
                        <Minus size={14} />
                      </button>
                      <span className={cn('w-7 text-center font-bold tabular-nums', !p.stock && 'text-ios-red')}>{p.stock ?? 0}</span>
                      <button type="button" onClick={() => changeStock(p, 1)} className="grid h-8 w-8 place-items-center rounded-full text-muted" aria-label="Sumar stock">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditing(p)} className="icon-btn btn-neu !h-10 !w-10" aria-label="Editar">
                      <Pencil size={16} />
                    </button>
                    {isOwner && (
                      <button type="button" onClick={() => remove(p)} className="icon-btn btn-neu !h-10 !w-10 text-ios-red" aria-label="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
