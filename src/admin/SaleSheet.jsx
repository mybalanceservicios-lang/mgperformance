import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronLeft, Loader2, Minus, PackageX, Plus, Search } from 'lucide-react';
import { ConditionBadge, Empty, MediaView, PhoneMock, Segmented, Sheet } from '@/components/ui';
import { createSale } from '@/lib/store';
import { cn, formatPrice, getCondition } from '@/lib/utils';
import { STORE } from '@/config';
import { Avatar } from './kit';

const METHODS = ['Efectivo', 'Transferencia', 'Dólares', 'Tarjeta'];

export default function SaleSheet({ open, onClose, products, prices, isOwner, profiles, me, notify }) {
  const [step, setStep] = useState(1);
  const [q, setQ] = useState('');
  const [productId, setProductId] = useState(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState('');
  const [method, setMethod] = useState('Efectivo');
  const [customer, setCustomer] = useState('');
  const [notes, setNotes] = useState('');
  const [seller, setSeller] = useState(me.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setStep(1);
      setQ('');
      setProductId(null);
      setQty(1);
      setCustomer('');
      setNotes('');
      setError('');
      setSeller(me.id);
    }
  }, [open, me.id]);

  const available = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products
      .filter(p => (p.stock ?? 0) > 0)
      .filter(p => !s || [p.model, p.storage, p.color].join(' ').toLowerCase().includes(s));
  }, [products, q]);

  const product = products.find(p => p.id === productId);
  const rend = product ? Number(prices[product.id] ?? 0) : 0;
  const unit = Number(price) || 0;
  const commission = (unit - rend) * qty;
  const employees = (profiles ?? []).filter(p => p.active);

  const pick = p => {
    setProductId(p.id);
    setPrice(p.price ?? '');
    setQty(1);
    setStep(2);
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await createSale({
        product_id: product.id,
        qty,
        unit_price: unit,
        payment_method: method,
        customer,
        notes,
        employee_id: isOwner && seller !== me.id ? seller : undefined
      });
      notify(`Venta registrada · ${formatPrice(unit * qty)}`);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={step === 1 ? 'Registrar venta' : 'Detalle de la venta'}
      footer={
        step === 2 &&
        product && (
          <div className="space-y-2">
            {error && <p className="text-center text-sm text-ios-red">{error}</p>}
            <button className="btn btn-primary w-full !min-h-[54px] text-base" disabled={busy || unit <= 0} onClick={submit}>
              {busy ? <Loader2 size={19} className="animate-spin" /> : <Check size={19} />} Confirmar venta · {formatPrice(unit * qty)}
            </button>
          </div>
        )
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {step === 1 ? (
          <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <p className="mb-4 text-sm text-muted">
              <b className="text-ink">Paso 1 de 2.</b> Elegí el equipo que vendiste. Solo aparecen los que tienen stock.
            </p>
            <div className="relative mb-4">
              <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
              <input className="field !pl-10" placeholder="Buscar modelo, capacidad, color…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
            </div>
            {available.length === 0 ? (
              <Empty icon={<PackageX size={26} />} title="Sin equipos con stock" text="Cargá stock desde Inventario." />
            ) : (
              <ul className="space-y-2.5">
                {available.map(p => (
                  <li key={p.id}>
                    <button type="button" onClick={() => pick(p)} className="neu-sm flex w-full items-center gap-3 p-2.5 text-left transition active:shadow-[var(--neu-in)]">
                      <span className="h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-[#0b0d12]">
                        {p.media?.[0] ? <MediaView item={p.media[0]} /> : <PhoneMock color={getCondition(p.condition).color} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{p.model}</span>
                        <span className="block truncate text-xs text-muted">
                          {[p.storage, p.color, p.battery != null && `${p.battery}%`].filter(Boolean).join(' · ')}
                        </span>
                        <span className="mt-0.5 block text-xs">
                          <span className="text-ink">{formatPrice(p.price)}</span>
                          <span className="text-faint"> · rendir {prices[p.id] != null ? formatPrice(prices[p.id]) : '—'}</span>
                        </span>
                      </span>
                      <span className="chip neu-inset shrink-0 text-muted">{p.stock} u.</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        ) : (
          product && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
              <button type="button" onClick={() => setStep(1)} className="btn btn-ghost -ml-2 !px-2 !text-sm">
                <ChevronLeft size={18} /> Cambiar equipo
              </button>

              <div className="neu-sm flex items-center gap-3 p-3">
                <span className="h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-[#0b0d12]">
                  {product.media?.[0] ? <MediaView item={product.media[0]} /> : <PhoneMock color={getCondition(product.condition).color} />}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{product.model}</div>
                  <div className="truncate text-xs text-muted">{[product.storage, product.color].filter(Boolean).join(' · ')}</div>
                  <ConditionBadge condition={product.condition} className="mt-1" />
                </div>
              </div>

              {/* Resultado en vivo: lo más importante arriba */}
              <div className="grid grid-cols-2 gap-3">
                <div className="neu-inset p-3.5">
                  <div className="text-[11px] font-semibold text-muted">Rendís al dueño</div>
                  <div className="mt-1 text-xl font-extrabold tabular-nums">{formatPrice(rend * qty)}</div>
                </div>
                <div className={cn('neu-inset p-3.5', commission < 0 && 'ring-1 ring-ios-red/50')}>
                  <div className="text-[11px] font-semibold text-muted">{isOwner && seller === me.id ? 'Diferencia' : 'Comisión'}</div>
                  <div className={cn('mt-1 text-xl font-extrabold tabular-nums', commission < 0 ? 'text-ios-red' : 'text-ios-green')}>
                    {formatPrice(commission)}
                  </div>
                </div>
              </div>
              {prices[product.id] == null && (
                <p className="-mt-2 text-xs text-ios-orange">Este equipo todavía no tiene precio a rendir cargado; se toma como 0 hasta que el dueño lo defina.</p>
              )}
              {commission < 0 && <p className="-mt-2 text-xs text-ios-red">Ojo: el precio de venta es menor al precio a rendir.</p>}

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div>
                  <label className="label" htmlFor="sale-price">Precio de venta c/u ({STORE.currency})</label>
                  <input id="sale-price" type="number" inputMode="numeric" min="0" className="field text-lg font-bold" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
                <div>
                  <span className="label">Cantidad</span>
                  <div className="neu-inset flex h-[46px] items-center gap-1 rounded-2xl px-1">
                    <button type="button" className="grid h-9 w-9 place-items-center rounded-xl text-muted disabled:opacity-30" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Menos">
                      <Minus size={16} />
                    </button>
                    <span className="w-6 text-center font-bold tabular-nums">{qty}</span>
                    <button type="button" className="grid h-9 w-9 place-items-center rounded-xl text-muted disabled:opacity-30" onClick={() => setQty(q => Math.min(product.stock, q + 1))} disabled={qty >= product.stock} aria-label="Más">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <span className="label">Forma de pago</span>
                <Segmented size="sm" options={METHODS.map(m => ({ value: m, label: m }))} value={method} onChange={setMethod} />
              </div>

              {isOwner && employees.length > 1 && (
                <div>
                  <span className="label">¿Quién vendió?</span>
                  <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                    {employees.map(e => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSeller(e.id)}
                        aria-pressed={seller === e.id}
                        className={cn('flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-sm font-semibold', seller === e.id ? 'shadow-[var(--neu-in)] ring-1 ring-ios-blue/60' : 'neu-sm')}
                      >
                        <Avatar name={e.name} owner={e.role === 'owner'} size={28} /> {e.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="sale-customer">Cliente (opcional)</label>
                  <input id="sale-customer" className="field" value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Nombre o teléfono" />
                </div>
                <div>
                  <label className="label" htmlFor="sale-notes">Nota (opcional)</label>
                  <input id="sale-notes" className="field" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: entregó iPhone 11 en parte de pago" />
                </div>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </Sheet>
  );
}
