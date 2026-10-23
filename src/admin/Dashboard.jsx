import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Boxes, ChevronRight, HandCoins, Percent, Plus, Receipt, Smartphone, Wallet } from 'lucide-react';
import ShinyText from '@/components/reactbits/ShinyText';
import { InfoTip, Segmented } from '@/components/ui';
import { setSettled } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { Avatar, BarChart, Card, Kpi } from './kit';
import { byDay, inPeriod, PERIODS, saleOwner, stockSummary, summarize } from './metrics';
import { SaleRow } from './Sales';

function greeting() {
  const h = new Date().getHours();
  return h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}

function Hello({ me, period, setPeriod }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm text-muted capitalize">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-2xl font-bold md:text-3xl">
          {greeting()}, <ShinyText text={me.name} color="#9fc9ff" shineColor="#ffffff" speed={3} />
        </h1>
      </div>
      <Segmented size="sm" options={PERIODS} value={period} onChange={setPeriod} />
    </div>
  );
}

function OwnerDashboard({ me, sales, products, prices, profiles, nameOf, notify }) {
  const [period, setPeriod] = useState('mes');
  const scoped = useMemo(() => inPeriod(sales, period), [sales, period]);
  const sum = summarize(scoped);
  const pendingAll = summarize(sales).pending;
  const stock = stockSummary(products, prices);
  const chart = useMemo(() => byDay(sales, 14), [sales]);

  const team = useMemo(
    () =>
      profiles
        .map(p => {
          const mine = scoped.filter(s => s.employee_id === p.id);
          const unsettled = sales.filter(s => s.employee_id === p.id && !s.settled);
          return { ...p, ...summarize(mine), pendingAll: unsettled.reduce((n, s) => n + saleOwner(s), 0), unsettled };
        })
        .filter(p => p.count || p.pendingAll || (p.role === 'employee' && p.active))
        .sort((a, b) => b.total - a.total),
    [profiles, scoped, sales]
  );

  const collect = async p => {
    if (!confirm(`¿${p.name} te entregó ${formatPrice(p.pendingAll)}? Se marcan ${p.unsettled.length} ventas como rendidas.`)) return;
    await setSettled(p.unsettled.map(s => s.id));
    notify(`Rendición de ${p.name} registrada`);
  };

  return (
    <div>
      <Hello me={me} period={period} setPeriod={setPeriod} />

      <div className="grid grid-cols-2 gap-3.5 md:gap-5 xl:grid-cols-4">
        <Kpi label="Facturación" value={sum.total} icon={<Wallet size={16} />} color="var(--blue)" sub={`${sum.count} equipos vendidos`} big />
        <Kpi
          label="Para vos"
          value={sum.owner}
          icon={<HandCoins size={16} />}
          color="var(--purple)"
          hint="Suma de los precios a rendir de las ventas del período: lo que te corresponde."
          sub="Rendiciones del período"
        />
        <Kpi
          label="Comisiones"
          value={sum.commission}
          icon={<Percent size={16} />}
          color="var(--green)"
          hint="Lo que ganaron los vendedores: precio de venta − precio a rendir."
          sub="Del equipo"
        />
        <Kpi
          label="Pendiente de cobrar"
          value={pendingAll}
          icon={<AlertTriangle size={16} />}
          color="var(--orange)"
          hint="Rendiciones que los empleados todavía no te entregaron (de todas las fechas)."
          sub="Total histórico"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card title="Facturación · últimos 14 días" action={<span className="text-xs text-muted">Hoy en azul</span>}>
          <BarChart data={chart} />
        </Card>

        <Card
          title="Stock"
          action={
            <Link to="/admin/inventario" className="flex items-center text-sm font-semibold text-ios-blue">
              Inventario <ChevronRight size={16} />
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="neu-inset p-3.5">
              <div className="text-xs text-muted">Unidades</div>
              <div className="mt-1 text-2xl font-extrabold tabular-nums">{stock.units}</div>
            </div>
            <div className="neu-inset p-3.5">
              <div className="flex items-center gap-1 text-xs text-muted">
                Valor publicado
                <InfoTip title="Valor publicado" align="right">Unidades en stock × precio publicado.</InfoTip>
              </div>
              <div className="mt-1 text-lg font-extrabold tabular-nums">{formatPrice(stock.value)}</div>
            </div>
          </div>
          {stock.missingPrice.length > 0 ? (
            <Link to="/admin/inventario" className="mt-3 flex items-start gap-3 rounded-2xl bg-ios-orange/10 p-3 text-sm text-ios-orange">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>
                <b>{stock.missingPrice.length}</b> {stock.missingPrice.length === 1 ? 'equipo no tiene' : 'equipos no tienen'} precio a rendir. Sin eso no se
                puede calcular la comisión.
              </span>
            </Link>
          ) : (
            <p className="mt-3 rounded-2xl bg-ios-green/10 p-3 text-sm text-ios-green">Todos los equipos tienen precio a rendir ✓</p>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card title="Equipo de ventas" action={<span className="text-xs text-muted">{PERIODS.find(p => p.value === period).label}</span>}>
          {team.length === 0 ? (
            <p className="text-sm text-muted">Todavía no hay ventas en este período.</p>
          ) : (
            <ul className="space-y-2.5">
              {team.map((p, i) => (
                <li key={p.id} className="neu-sm flex items-center gap-3 p-3">
                  <span className="w-4 text-center text-xs font-bold text-faint">{i + 1}</span>
                  <Avatar name={p.name} owner={p.role === 'owner'} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.name}</div>
                    <div className="text-xs text-muted">
                      {p.count} vend. · {formatPrice(p.total)} · <span className="text-ios-green">+{formatPrice(p.commission)}</span>
                    </div>
                  </div>
                  {p.pendingAll > 0 ? (
                    <button type="button" onClick={() => collect(p)} className="btn btn-neu !min-h-[40px] !px-3 !text-xs" title="Marcar todo lo pendiente como rendido">
                      <span className="text-right leading-tight">
                        <span className="block text-[10px] font-medium text-muted">Debe rendir</span>
                        <span className="text-ios-orange">{formatPrice(p.pendingAll)}</span>
                      </span>
                    </button>
                  ) : (
                    <span className="chip bg-ios-green/10 text-ios-green">Al día</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-faint">Tocá “Debe rendir” cuando el empleado te entregue la plata y queda saldado.</p>
        </Card>

        <Card
          title="Últimas ventas"
          action={
            <Link to="/admin/ventas" className="flex items-center text-sm font-semibold text-ios-blue">
              Ver todas <ChevronRight size={16} />
            </Link>
          }
        >
          {sales.length === 0 ? (
            <p className="text-sm text-muted">Sin ventas todavía.</p>
          ) : (
            <ul className="space-y-2.5">
              {sales.slice(0, 5).map(s => (
                <SaleRow key={s.id} sale={s} nameOf={nameOf} isOwner onChanged={notify} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function EmployeeDashboard({ me, sales, products, nameOf, openSale }) {
  const [period, setPeriod] = useState('mes');
  const scoped = useMemo(() => inPeriod(sales, period), [sales, period]);
  const sum = summarize(scoped);
  const pendingAll = summarize(sales).pending;
  const chart = useMemo(() => byDay(sales, 14), [sales]);
  const inStock = products.filter(p => (p.stock ?? 0) > 0).length;

  return (
    <div>
      <Hello me={me} period={period} setPeriod={setPeriod} />

      <button
        type="button"
        onClick={openSale}
        className="group mb-5 flex w-full items-center gap-4 rounded-[24px] bg-gradient-to-br from-[#2a95ff] to-[#0a6ad8] p-5 text-left text-white shadow-[0_18px_40px_-16px_rgba(10,132,255,0.9),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-[0.99]"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
          <Plus size={28} />
        </span>
        <span className="flex-1">
          <span className="block text-lg font-bold">Registrar una venta</span>
          <span className="block text-sm text-white/75">Elegís el equipo, ponés el precio y tu comisión se calcula sola.</span>
        </span>
        <ChevronRight className="transition group-hover:translate-x-1" />
      </button>

      <div className="grid grid-cols-2 gap-3.5 md:gap-5 xl:grid-cols-4">
        <Kpi label="Mi comisión" value={sum.commission} icon={<Percent size={16} />} color="var(--green)" sub={`${sum.count} equipos vendidos`} big />
        <Kpi label="Vendí" value={sum.total} icon={<Receipt size={16} />} color="var(--blue)" sub="Total facturado" />
        <Kpi
          label="Tengo que rendir"
          value={pendingAll}
          icon={<HandCoins size={16} />}
          color="var(--orange)"
          hint="Lo que todavía no le entregaste al dueño. Cuando lo hagas, él lo marca como rendido."
          sub="Pendiente total"
        />
        <Kpi label="Equipos con stock" value={inStock} money={false} icon={<Smartphone size={16} />} color="var(--purple)" sub="Para vender ahora" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Mis ventas · últimos 14 días">
          <BarChart data={chart} />
        </Card>
        <Card title="¿Cómo se calcula mi comisión?">
          <div className="space-y-2.5 text-sm">
            <div className="neu-inset flex items-center justify-between px-4 py-3">
              <span className="text-muted">Precio al que vendés</span>
              <b className="tabular-nums">{formatPrice(900)}</b>
            </div>
            <div className="neu-inset flex items-center justify-between px-4 py-3">
              <span className="text-muted">− Precio a rendir (lo fija el dueño)</span>
              <b className="tabular-nums">{formatPrice(800)}</b>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-ios-green/10 px-4 py-3 text-ios-green">
              <span>= Tu comisión</span>
              <b className="tabular-nums">{formatPrice(100)}</b>
            </div>
          </div>
          <p className="mt-3 text-xs text-faint">Ejemplo. El precio a rendir de cada equipo lo ves al registrar la venta y en Inventario.</p>
        </Card>
      </div>

      <Card
        className="mt-5"
        title="Mis últimas ventas"
        action={
          <Link to="/admin/ventas" className="flex items-center text-sm font-semibold text-ios-blue">
            Ver todas <ChevronRight size={16} />
          </Link>
        }
      >
        {sales.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Boxes size={16} /> Todavía no registraste ventas.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {sales.slice(0, 5).map(s => (
              <SaleRow key={s.id} sale={s} nameOf={nameOf} showSeller={false} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function Dashboard(props) {
  return props.isOwner ? <OwnerDashboard {...props} /> : <EmployeeDashboard {...props} />;
}
