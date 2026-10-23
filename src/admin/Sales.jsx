import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Download, Plus, Receipt, Trash2 } from 'lucide-react';
import { Empty, InfoTip, Segmented } from '@/components/ui';
import { deleteSale, setSettled } from '@/lib/store';
import { cn, formatPrice } from '@/lib/utils';
import { Avatar, PageHeader } from './kit';
import { inPeriod, PERIODS, saleCommission, saleOwner, saleTotal, summarize, timeAgo } from './metrics';

export function SaleRow({ sale, nameOf, isOwner, showSeller = true, onChanged }) {
  const commission = saleCommission(sale);
  const toggle = async () => {
    await setSettled([sale.id], !sale.settled);
    onChanged?.(sale.settled ? 'Marcada como pendiente' : 'Marcada como rendida');
  };
  const remove = async () => {
    if (!confirm(`¿Anular esta venta? El stock de "${sale.product_label}" vuelve a sumarse.`)) return;
    await deleteSale(sale);
    onChanged?.('Venta anulada · stock repuesto');
  };
  return (
    <li className="neu-sm flex items-center gap-3 p-3">
      {showSeller && <Avatar name={nameOf(sale.employee_id)} size={36} />}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">
          {sale.qty > 1 && <span className="text-ios-blue">{sale.qty}× </span>}
          {sale.product_label ?? 'Producto eliminado'}
        </div>
        <div className="truncate text-xs text-muted">
          {[showSeller && nameOf(sale.employee_id), timeAgo(sale.created_at), sale.payment_method, sale.customer].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold tabular-nums">{formatPrice(saleTotal(sale))}</div>
        <div className="text-[11px] tabular-nums">
          <span className="text-faint">rinde {formatPrice(saleOwner(sale))} · </span>
          <span className={commission < 0 ? 'text-ios-red' : 'text-ios-green'}>+{formatPrice(commission)}</span>
        </div>
      </div>
      {isOwner ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggle}
            title={sale.settled ? 'Rendida (tocar para desmarcar)' : 'Pendiente de rendir (tocar para marcar rendida)'}
            className={cn('grid h-9 w-9 place-items-center rounded-xl', sale.settled ? 'text-ios-green' : 'text-ios-orange')}
            aria-label={sale.settled ? 'Desmarcar rendida' : 'Marcar rendida'}
          >
            {sale.settled ? <CheckCircle2 size={20} /> : <Circle size={20} />}
          </button>
          <button type="button" onClick={remove} className="grid h-9 w-9 place-items-center rounded-xl text-faint hover:text-ios-red" aria-label="Anular venta">
            <Trash2 size={17} />
          </button>
        </div>
      ) : (
        <span className={cn('chip shrink-0', sale.settled ? 'bg-ios-green/10 text-ios-green' : 'bg-ios-orange/10 text-ios-orange')}>
          {sale.settled ? 'Rendida' : 'A rendir'}
        </span>
      )}
    </li>
  );
}

function toCsv(rows, nameOf) {
  const head = ['Fecha', 'Vendedor', 'Producto', 'Cantidad', 'Precio unitario', 'Total', 'A rendir', 'Comisión', 'Pago', 'Cliente', 'Rendida'];
  const lines = rows.map(s => [
    new Date(s.created_at).toLocaleString('es-AR'),
    nameOf(s.employee_id),
    s.product_label,
    s.qty,
    s.unit_price,
    saleTotal(s),
    saleOwner(s),
    saleCommission(s),
    s.payment_method ?? '',
    s.customer ?? '',
    s.settled ? 'Sí' : 'No'
  ]);
  return [head, ...lines].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
}

export default function Sales({ sales, isOwner, profiles, nameOf, notify, openSale }) {
  const [period, setPeriod] = useState('mes');
  const [seller, setSeller] = useState('all');
  const [state, setState] = useState('all');

  const list = useMemo(
    () =>
      inPeriod(sales, period).filter(
        s => (seller === 'all' || s.employee_id === seller) && (state === 'all' || (state === 'pendiente' ? !s.settled : s.settled))
      ),
    [sales, period, seller, state]
  );
  const sum = summarize(list);

  const download = () => {
    const blob = new Blob(['﻿' + toCsv(list, nameOf)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ventas-${period}.csv`;
    a.click();
  };

  return (
    <div>
      <PageHeader
        title={isOwner ? 'Ventas' : 'Mis ventas'}
        subtitle={isOwner ? 'Todas las ventas del equipo. Tocá el círculo para marcar una venta como rendida.' : 'Tus ventas y su estado de rendición.'}
        action={
          <div className="flex gap-2">
            {isOwner && (
              <button type="button" onClick={download} className="btn btn-neu !min-h-[44px] !px-3.5 !text-sm" disabled={!list.length}>
                <Download size={16} /> Excel
              </button>
            )}
            <button type="button" onClick={openSale} className="btn btn-primary !min-h-[44px] !text-sm">
              <Plus size={18} /> Registrar venta
            </button>
          </div>
        }
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <Segmented size="sm" options={PERIODS} value={period} onChange={setPeriod} />
        <Segmented
          size="sm"
          options={[{ value: 'all', label: 'Todas' }, { value: 'pendiente', label: 'A rendir' }, { value: 'rendida', label: 'Rendidas' }]}
          value={state}
          onChange={setState}
        />
        {isOwner && (
          <select className="field !min-h-[44px] md:!w-52" value={seller} onChange={e => setSeller(e.target.value)} aria-label="Filtrar por vendedor">
            <option value="all">Todo el equipo</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="neu-inset mb-5 grid grid-cols-2 gap-y-3 rounded-[22px] p-4 text-sm md:grid-cols-4">
        <div>
          <div className="text-xs text-muted">Equipos</div>
          <div className="text-lg font-bold tabular-nums">{sum.count}</div>
        </div>
        <div>
          <div className="text-xs text-muted">Facturado</div>
          <div className="text-lg font-bold tabular-nums">{formatPrice(sum.total)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs text-muted">
            Rendición
            <InfoTip title="Rendición">Suma de los precios a rendir: lo que le corresponde al dueño.</InfoTip>
          </div>
          <div className="text-lg font-bold tabular-nums">{formatPrice(sum.owner)}</div>
        </div>
        <div>
          <div className="text-xs text-muted">Comisiones</div>
          <div className="text-lg font-bold text-ios-green tabular-nums">{formatPrice(sum.commission)}</div>
        </div>
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<Receipt size={26} />}
          title="No hay ventas en este período"
          text="Cuando registres una venta aparece acá, con su comisión calculada."
          action={<button className="btn btn-primary" onClick={openSale}><Plus size={18} /> Registrar venta</button>}
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map(s => (
            <SaleRow key={s.id} sale={s} nameOf={nameOf} isOwner={isOwner} showSeller={isOwner} onChanged={notify} />
          ))}
        </ul>
      )}
    </div>
  );
}
