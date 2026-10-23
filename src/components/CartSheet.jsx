import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { Empty, MediaView, PhoneMock, Sheet } from './ui';
import { formatPrice, getCondition, productLine, productUrl, waLink } from '@/lib/utils';
import { STORE } from '@/config';
import WhatsAppIcon from './WhatsAppIcon';

export default function CartSheet({ products }) {
  const cart = useCart();
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  // Usamos los datos actuales del producto (por si cambió el precio o se vendió)
  const lines = useMemo(
    () =>
      cart.items.map(i => ({
        ...i,
        product: products.find(p => p.id === i.id) ?? i.snapshot
      })),
    [cart.items, products]
  );
  const total = lines.reduce((s, l) => s + (Number(l.product.price) || 0) * l.qty, 0);

  const message = [
    `Hola ${STORE.name}! ${name ? `Soy ${name}. ` : ''}Me interesan estos equipos:`,
    '',
    ...lines.map(l => `• ${productLine(l.product, l.qty)}\n  ${productUrl(l.product)}`),
    '',
    `Total estimado: ${formatPrice(total)}`,
    note ? `\nComentario: ${note}` : '',
    '¿Siguen disponibles?'
  ]
    .filter(s => s !== '')
    .join('\n');

  return (
    <Sheet
      open={cart.open}
      onClose={() => cart.setOpen(false)}
      title="Mi selección"
      footer={
        lines.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Total estimado</span>
              <span className="text-2xl font-extrabold">{formatPrice(total)}</span>
            </div>
            <a href={waLink(message)} target="_blank" rel="noreferrer" className="btn btn-wa w-full !min-h-[52px] text-base">
              <WhatsAppIcon className="h-5 w-5" /> Enviar selección por WhatsApp
            </a>
            <button type="button" onClick={() => cart.setOpen(false)} className="btn btn-ghost w-full">
              Seguir mirando
            </button>
          </div>
        )
      }
    >
      {lines.length === 0 ? (
        <Empty
          icon={<ShoppingBag size={26} />}
          title="Tu selección está vacía"
          text="Tocá el botón + en cualquier equipo para sumarlo. Después nos mandás todo junto por WhatsApp."
          action={
            <button className="btn btn-primary" onClick={() => cart.setOpen(false)}>
              Ver equipos
            </button>
          }
        />
      ) : (
        <>
          <p className="mb-4 rounded-2xl bg-ios-blue/10 p-3 text-[0.82rem] leading-relaxed text-[#9fc9ff]">
            Esto no es una compra: armás tu lista y nos la enviás por WhatsApp. Te confirmamos stock, forma de pago y entrega.
          </p>
          <ul className="space-y-3">
            {lines.map(({ id, qty, product }) => {
              const unavailable = product.status === 'vendido';
              return (
                <li key={id} className="neu-sm flex gap-3 p-2.5">
                  <Link
                    to={`/producto/${id}`}
                    onClick={() => cart.setOpen(false)}
                    className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[#0b0d12]"
                  >
                    {product.media?.[0] ? (
                      <MediaView item={product.media[0]} />
                    ) : (
                      <PhoneMock color={getCondition(product.condition).color} />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{product.model}</div>
                    <div className="truncate text-xs text-muted">
                      {[product.storage, getCondition(product.condition).short, product.battery != null && `${product.battery}%`]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    {unavailable && <div className="mt-0.5 text-xs font-semibold text-ios-red">Ya no está disponible</div>}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold">{formatPrice(product.price)}</span>
                      <div className="neu-inset flex items-center gap-1 rounded-full p-1">
                        <button
                          type="button"
                          className="grid h-7 w-7 place-items-center rounded-full text-muted hover:text-ink"
                          onClick={() => cart.setQty(id, qty - 1)}
                          aria-label={qty === 1 ? 'Quitar' : 'Restar uno'}
                        >
                          {qty === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                        </button>
                        <span className="w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
                        <button
                          type="button"
                          className="grid h-7 w-7 place-items-center rounded-full text-muted hover:text-ink disabled:opacity-30"
                          onClick={() => cart.setQty(id, qty + 1)}
                          disabled={qty >= (product.stock ?? 1)}
                          aria-label="Sumar uno"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 space-y-3">
            <div>
              <label className="label" htmlFor="cart-name">Tu nombre (opcional)</label>
              <input id="cart-name" className="field" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Martina" />
            </div>
            <div>
              <label className="label" htmlFor="cart-note">¿Algo más que quieras contarnos?</label>
              <textarea
                id="cart-note"
                rows={2}
                className="field resize-none"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Ej: ¿aceptan mi iPhone 11 como parte de pago?"
              />
            </div>
            <button type="button" onClick={cart.clear} className="btn btn-ghost !text-ios-red w-full">
              Vaciar selección
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
