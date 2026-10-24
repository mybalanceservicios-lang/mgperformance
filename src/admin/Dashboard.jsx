import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Boxes, ChevronRight, Crown, HandCoins, Megaphone, Percent, PiggyBank, Scale, Wallet } from 'lucide-react';
import { setSettled } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { Avatar, BarChart, Card, DateRange, Kpi } from './kit';
import { byDay, byMonth, inRange, presetRange, saleCommission, saleOwner, saleTotal, stockSummary, sumBy, summarize } from './metrics';

export default function Dashboard({ me, sales, products, prices, profiles, ads, purchases, notify }) {
  const [range, setRange] = useState(() => presetRange('mes'));
  const [from, to] = range;

  const scoped = useMemo(() => inRange(sales, from, to), [sales, from, to]);
  const sum = summarize(scoped);
  const own = summarize(scoped.filter(s => s.employee_id === me.id));
  const teamCommission = sum.commission - own.commission;
  const adsTotal = sumBy(inRange(ads, from, to), a => a.amount);
  const scopedPurchases = inRange(purchases, from, to);
  const invested = sumBy(scopedPurchases, p => p.qty * p.unit_cost);
  const unitsIn = sumBy(scopedPurchases, p => p.qty);
  const balance = sum.owner + own.commission - adsTotal - invested;
  const pendingAll = summarize(sales).pending;
  const stock = stockSummary(products, prices);
  const months = useMemo(() => byMonth(sales, 6), [sales]);
  const days = useMemo(() => byDay(sales, 14), [sales]);

  const team = useMemo(
    () =>
      profiles
        .filter(p => p.role !== 'inventory')
        .map(p => {
          const mine = scoped.filter(s => s.employee_id === p.id);
          const unsettled = sales.filter(s => s.employee_id === p.id && !s.settled);
          return { ...p, ...summarize(mine), pendingAll: unsettled.reduce((n, s) => n + saleOwner(s), 0), unsettled };
        })
        .sort((a, b) => b.total - a.total),
    [profiles, scoped, sales]
  );

  const adsByPlatform = useMemo(() => {
    const m = {};
    for (const a of inRange(ads, from, to)) m[a.platform] = (m[a.platform] ?? 0) + Number(a.amount);
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [ads, from, to]);
  const adsMax = Math.max(1, ...adsByPlatform.map(([, v]) => v));

  const collect = async p => {
    if (!confirm(`¿${p.name} te entregó ${formatPrice(p.pendingAll)}? Se marcan ${p.unsettled.length} ventas como rendidas.`)) return;
    await setSettled(p.unsettled.map(s => s.id));
    notify(`Rendición de ${p.name} registrada`);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="chip mb-2 bg-ios-orange/15 text-ios-orange">
            <Crown size={12} /> Modo dueño
          </span>
          <h1 className="text-2xl font-bold md:text-3xl">Panel general</h1>
        </div>
        <DateRange value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 gap-3.5 md:gap-4 xl:grid-cols-4">
        <Kpi label="Ventas" value={sum.total} icon={<Wallet size={16} />} color="var(--blue)" sub={`${sum.count} equipos vendidos`} big />
        <Kpi label="Te rinden" value={sum.owner} icon={<HandCoins size={16} />} color="var(--purple)" hint="Suma de los precios a rendir (tu lista) de lo vendido en el período." sub="Según tu lista de precios" />
        <Kpi label="Comisión de los chicos" value={teamCommission} icon={<Percent size={16} />} color="var(--green)" hint="Lo que ganaron los vendedores: precio de venta − precio a rendir." sub="Vendedores" />
        <Kpi label="Tu comisión como vendedor" value={own.commission} icon={<Crown size={16} />} color="var(--orange)" sub={`${own.count} ventas tuyas`} />
        <Kpi label="Publicidad" value={adsTotal} icon={<Megaphone size={16} />} color="#ff375f" sub="Gastado en el período" />
        <Kpi label="Inversión" value={invested} icon={<PiggyBank size={16} />} color="var(--teal)" sub={`${unitsIn} equipos ingresados`} />
        <Kpi label="Balance" value={balance} icon={<Scale size={16} />} color={balance >= 0 ? 'var(--green)' : 'var(--red)'} hint="Te rinden + tu comisión − publicidad − inversión del período." sub="Estimado del período" />
        <Kpi label="Pendiente de cobrar" value={pendingAll} icon={<AlertTriangle size={16} />} color="var(--orange)" hint="Rendiciones que los vendedores todavía no te entregaron (todas las fechas)." sub="Total histórico" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card title="Ventas mensuales" action={<span className="text-xs text-muted">Últimos 6 meses</span>}>
          <BarChart data={months} height={170} />
        </Card>
        <Card title="Ventas por día" action={<span className="text-xs text-muted">Últimos 14 días</span>}>
          <BarChart data={days} height={170} />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card title="Vendedores" action={<span className="text-xs text-muted">En el período</span>}>
          <ul className="space-y-2.5">
            {team.map((p, i) => (
              <li key={p.id} className="neu-sm flex items-center gap-3 p-3">
                <span className="w-4 text-center text-xs font-bold text-faint">{i + 1}</span>
                <Avatar name={p.name} owner={p.role === 'owner'} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className="truncate text-xs text-muted">
                    {p.count} vend. · {formatPrice(p.total)} · comisión <span className="text-ios-green">{formatPrice(p.commission)}</span>
                  </div>
                </div>
                {p.role !== 'owner' &&
                  (p.pendingAll > 0 ? (
                    <button type="button" onClick={() => collect(p)} className="btn btn-neu !min-h-[42px] !px-3 !text-xs" title="Marcar lo pendiente como rendido">
                      <span className="text-right leading-tight">
                        <span className="block text-[10px] font-medium text-muted">Te debe</span>
                        <span className="text-ios-orange">{formatPrice(p.pendingAll)}</span>
                      </span>
                    </button>
                  ) : (
                    <span className="chip bg-ios-green/10 text-ios-green">Al día</span>
                  ))}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-faint">Tocá “Te debe” cuando el vendedor te entregue la plata y queda saldado.</p>
        </Card>

        <div className="space-y-5">
          <Card
            title="Publicidad por plataforma"
            action={
              <Link to="/admin/publicidad" className="flex items-center text-sm font-semibold text-violet-300">
                Cargar <ChevronRight size={16} />
              </Link>
            }
          >
            {adsByPlatform.length === 0 ? (
              <p className="text-sm text-muted">Sin gastos cargados en el período.</p>
            ) : (
              <ul className="space-y-3">
                {adsByPlatform.map(([name, v]) => (
                  <li key={name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{name}</span>
                      <b className="tabular-nums">{formatPrice(v)}</b>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#ff375f] to-[#bf5af2]" style={{ width: `${(v / adsMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Stock"
            action={
              <span className="flex items-center gap-1 text-xs text-muted">
                <Boxes size={13} /> {stock.units} unidades
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="neu-inset p-3.5">
                <div className="text-xs text-muted">Valor publicado</div>
                <div className="mt-1 text-lg font-extrabold tabular-nums">{formatPrice(stock.value)}</div>
              </div>
              <div className="neu-inset p-3.5">
                <div className="text-xs text-muted">A tu lista</div>
                <div className="mt-1 text-lg font-extrabold tabular-nums">{formatPrice(stock.ownerValue)}</div>
              </div>
            </div>
            {stock.missingPrice.length > 0 && (
              <p className="mt-3 flex items-start gap-2 rounded-2xl bg-ios-orange/10 p-3 text-sm text-ios-orange">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                {stock.missingPrice.length} {stock.missingPrice.length === 1 ? 'equipo no tiene' : 'equipos no tienen'} precio a rendir cargado (lo carga Inventario).
              </p>
            )}
          </Card>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-faint">
        {scoped.length} ventas entre el {new Date(`${from}T12:00`).toLocaleDateString('es-AR')} y el {new Date(`${to}T12:00`).toLocaleDateString('es-AR')} · facturación promedio {formatPrice(scoped.length ? sumBy(scoped, saleTotal) / scoped.length : 0)} · comisión promedio {formatPrice(scoped.length ? sumBy(scoped, saleCommission) / scoped.length : 0)}
      </p>
    </div>
  );
}
