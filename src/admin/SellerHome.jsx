import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, ChevronRight, Crown, HandCoins, Percent, Plus, Receipt, UserPlus } from 'lucide-react';
import ShinyText from '@/components/reactbits/ShinyText';
import { STORE } from '@/config';
import { Card, Kpi, WhatsAppLink } from './kit';
import { inPeriod, summarize, todayISO } from './metrics';
import { SaleRow } from './Sales';

function greeting() {
  const h = new Date().getHours();
  return h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}

export default function SellerHome({ me, sales, reminders, clients, clientOf, nameOf, openSale, openReminder, openClient, isOwner, setOwnerMode }) {
  const mySales = useMemo(() => sales.filter(s => s.employee_id === me.id), [sales, me.id]);
  const month = summarize(inPeriod(mySales, 'mes'));
  const pending = summarize(mySales).pending;
  const today = reminders.filter(r => r.employee_id === me.id && r.date === todayISO()).sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
  const myClients = clients.filter(c => c.employee_id === me.id).length;

  return (
    <div>
      <p className="text-sm text-muted capitalize">{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">
        {greeting()}, <ShinyText text={me.name} color="#c4b5fd" shineColor="#ffffff" speed={3} />
      </h1>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: Plus, label: 'Nueva venta', onClick: () => openSale(), primary: true },
          { icon: UserPlus, label: 'Cliente nuevo', onClick: () => openClient() },
          { icon: CalendarPlus, label: 'Agendar', onClick: () => openReminder() }
        ].map(a => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className={a.primary ? 'flex flex-col items-center gap-2 rounded-[22px] bg-gradient-to-br from-[#8b5cf6] to-[#4f46e5] p-4 text-white shadow-[0_16px_34px_-14px_rgba(124,58,237,.9)] active:scale-[0.98]' : 'neu flex flex-col items-center gap-2 p-4 active:scale-[0.98]'}
          >
            <a.icon size={24} />
            <span className="text-xs font-semibold sm:text-sm">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3.5 md:gap-5 xl:grid-cols-4">
        <Kpi label="Mi comisión del mes" value={month.commission} icon={<Percent size={16} />} color="var(--green)" sub={`${month.count} equipos vendidos`} big />
        <Kpi label="Vendí este mes" value={month.total} icon={<Receipt size={16} />} color="var(--purple)" sub="Facturado" />
        <Kpi label="Tengo que rendir" value={pending} icon={<HandCoins size={16} />} color="var(--orange)" hint={`Lo que todavía no le entregaste a ${isOwner ? 'la caja' : 'Matías'}.`} sub="Pendiente total" />
        <Kpi label="Mis clientes" value={myClients} money={false} icon={<UserPlus size={16} />} color="var(--teal)" sub="Cargados" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card
          title="Hoy en el calendario"
          action={
            <Link to="/admin/calendario" className="flex items-center text-sm font-semibold text-violet-300">
              Ver mes <ChevronRight size={16} />
            </Link>
          }
        >
          {today.length === 0 ? (
            <p className="text-sm text-muted">No tenés nada agendado para hoy.</p>
          ) : (
            <ul className="space-y-2.5">
              {today.map(r => {
                const c = clientOf(r.client_id);
                return (
                  <li key={r.id} className="neu-sm flex items-center gap-3 p-3">
                    <span className="w-12 shrink-0 text-center text-sm font-bold text-violet-300">{r.time ? r.time.slice(0, 5) : '—'}</span>
                    <div className="min-w-0 flex-1">
                      <div className={r.done ? 'truncate text-faint line-through' : 'truncate font-semibold'}>{r.title}</div>
                      <div className="truncate text-xs text-muted">{c?.name ?? 'Sin cliente'}</div>
                    </div>
                    {c && <WhatsAppLink phone={c.phone} text={`Hola ${c.name.split(' ')[0]}! Te escribo de ${STORE.name} para recordarte: ${r.title.toLowerCase()} hoy${r.time ? ` a las ${r.time.slice(0, 5)}` : ''}.`} size="sm" />}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card
          title="Mis últimas ventas"
          action={
            <Link to="/admin/ventas" className="flex items-center text-sm font-semibold text-violet-300">
              Ver todas <ChevronRight size={16} />
            </Link>
          }
        >
          {mySales.length === 0 ? (
            <p className="text-sm text-muted">Todavía no registraste ventas.</p>
          ) : (
            <ul className="space-y-2.5">
              {mySales.slice(0, 4).map(s => (
                <SaleRow key={s.id} sale={s} nameOf={nameOf} showSeller={false} />
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-faint">Tu comisión = precio de venta − precio a rendir de cada equipo.</p>
        </Card>
      </div>

      {isOwner && (
        <button
          type="button"
          onClick={() => setOwnerMode(true)}
          className="mt-8 flex w-full items-center gap-4 rounded-[24px] border border-ios-orange/30 bg-gradient-to-r from-ios-orange/15 to-transparent p-5 text-left transition hover:border-ios-orange/60"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ios-orange/20 text-ios-orange">
            <Crown size={24} />
          </span>
          <span className="flex-1">
            <span className="block text-lg font-bold">Modo dueño</span>
            <span className="block text-sm text-muted">Dashboard completo: ventas, comisiones, publicidad, inversión y equipo.</span>
          </span>
          <ChevronRight className="text-ios-orange" />
        </button>
      )}
    </div>
  );
}
