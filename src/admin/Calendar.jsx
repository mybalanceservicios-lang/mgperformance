import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, Clock, Plus, Trash2 } from 'lucide-react';
import { Sheet } from '@/components/ui';
import { deleteRow, saveRow } from '@/lib/store';
import { cn } from '@/lib/utils';
import { STORE } from '@/config';
import { PageHeader, WhatsAppLink } from './kit';
import { ClientPicker } from './ClientSheet';
import { todayISO, toISODate } from './metrics';

const DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const longDate = iso => new Date(`${iso}T12:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

export function ReminderSheet({ open, onClose, initial, clients, notify }) {
  const [r, setR] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const key = open ? JSON.stringify(initial) : '';
  const [lastKey, setLastKey] = useState('');
  if (key !== lastKey) {
    setLastKey(key);
    if (open) {
      setR({ date: todayISO(), time: '', title: '', notes: '', client_id: null, ...initial });
      setError('');
    }
  }
  const set = patch => setR(prev => ({ ...prev, ...patch }));

  const submit = async () => {
    if (!r.title?.trim()) return setError('Escribí qué hay que hacer');
    setBusy(true);
    try {
      await saveRow('reminders', { id: r.id, date: r.date, time: r.time || null, title: r.title.trim(), notes: r.notes, client_id: r.client_id || null });
      notify(r.id ? 'Recordatorio actualizado' : 'Agendado ✓');
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
      title={r.id ? 'Editar recordatorio' : 'Agendar'}
      footer={
        <div className="space-y-2">
          {error && <p className="text-center text-sm text-ios-red">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy} onClick={submit}>
            <Check size={18} /> Guardar
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="r-title">¿Qué hay que hacer? *</label>
          <input id="r-title" className="field" value={r.title ?? ''} onChange={e => set({ title: e.target.value })} placeholder="Ej: Viene a ver el iPhone 15 Pro" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Viene a ver el equipo', 'Pasa a buscar', 'Recordarle la seña', 'Trae su usado para cotizar', 'Escribirle'].map(t => (
              <button key={t} type="button" onClick={() => set({ title: t })} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-muted hover:text-ink">
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="r-date">Día</label>
            <input id="r-date" type="date" className="field" value={r.date ?? ''} onChange={e => set({ date: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="r-time">Hora (opcional)</label>
            <input id="r-time" type="time" className="field" value={r.time?.slice(0, 5) ?? ''} onChange={e => set({ time: e.target.value })} />
          </div>
        </div>
        <div>
          <span className="label">Cliente</span>
          <ClientPicker clients={clients} value={r.client_id} onChange={id => set({ client_id: id })} />
        </div>
        <div>
          <label className="label" htmlFor="r-notes">Notas</label>
          <textarea id="r-notes" rows={2} className="field resize-none" value={r.notes ?? ''} onChange={e => set({ notes: e.target.value })} />
        </div>
      </div>
    </Sheet>
  );
}

function ReminderItem({ r, client, onEdit, notify }) {
  const when = `el ${longDate(r.date)}${r.time ? ` a las ${r.time.slice(0, 5)}` : ''}`;
  const msg = client ? `Hola ${client.name.split(' ')[0]}! Te escribo de ${STORE.name} para recordarte: ${r.title.toLowerCase()} ${when}. ¡Te esperamos!` : '';
  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="neu-sm flex items-center gap-3 p-3">
      <button
        type="button"
        onClick={async () => {
          await saveRow('reminders', { id: r.id, done: !r.done });
          notify(r.done ? 'Marcado pendiente' : 'Hecho ✓');
        }}
        className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition', r.done ? 'border-ios-green bg-ios-green text-black' : 'border-white/25')}
        aria-label={r.done ? 'Marcar pendiente' : 'Marcar hecho'}
      >
        {r.done && <Check size={15} strokeWidth={3} />}
      </button>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <div className={cn('truncate font-semibold', r.done && 'text-faint line-through')}>{r.title}</div>
        <div className="flex items-center gap-1.5 truncate text-xs text-muted">
          {r.time && (
            <>
              <Clock size={11} /> {r.time.slice(0, 5)} ·
            </>
          )}
          {client ? client.name : 'Sin cliente'}
          {r.notes && ` · ${r.notes}`}
        </div>
      </button>
      {client && <WhatsAppLink phone={client.phone} text={msg} size="sm" />}
      <button
        type="button"
        onClick={async () => {
          if (!confirm('¿Borrar este recordatorio?')) return;
          await deleteRow('reminders', r);
          notify('Recordatorio borrado');
        }}
        className="grid h-9 w-9 place-items-center rounded-xl text-faint hover:text-ios-red"
        aria-label="Borrar"
      >
        <Trash2 size={16} />
      </button>
    </motion.li>
  );
}

export default function Calendar({ reminders, clients, clientOf, notify, me }) {
  const [month, setMonth] = useState(() => todayISO().slice(0, 7));
  const [day, setDay] = useState(todayISO());
  const [sheet, setSheet] = useState(null);
  const mine = reminders.filter(r => r.employee_id === me.id);
  const myClients = clients.filter(c => c.employee_id === me.id);

  const byDay = useMemo(() => {
    const m = {};
    for (const r of mine) (m[r.date] ??= []).push(r);
    for (const k in m) m[k].sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'));
    return m;
  }, [mine]);

  const [y, mo] = month.split('-').map(Number);
  const first = new Date(y, mo - 1, 1);
  const pad = (first.getDay() + 6) % 7;
  const days = new Date(y, mo, 0).getDate();
  const shift = n => {
    const d = new Date(y, mo - 1 + n, 1);
    setMonth(toISODate(d).slice(0, 7));
  };
  const items = byDay[day] ?? [];

  return (
    <div>
      <PageHeader
        title="Calendario"
        subtitle="Agendá visitas y recordatorios. Tocá un día para ver lo que tenés."
        action={
          <button type="button" onClick={() => setSheet({ date: day })} className="btn btn-primary !min-h-[46px]">
            <Plus size={19} /> Agendar
          </button>
        }
      />
      <div className="neu p-3 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} className="icon-btn btn-neu !h-10 !w-10" aria-label="Mes anterior">
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <div className="text-lg font-bold capitalize">{first.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}</div>
            <button type="button" onClick={() => { setMonth(todayISO().slice(0, 7)); setDay(todayISO()); }} className="text-xs font-semibold text-violet-300">
              Ir a hoy
            </button>
          </div>
          <button type="button" onClick={() => shift(1)} className="icon-btn btn-neu !h-10 !w-10" aria-label="Mes siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-1.5">
          {DOW.map(d => (
            <div key={d} className="py-1 text-center text-[11px] font-semibold text-faint">{d}</div>
          ))}
          {Array.from({ length: pad }).map((_, i) => <div key={`p${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const iso = `${month}-${String(i + 1).padStart(2, '0')}`;
            const list = byDay[iso] ?? [];
            const pending = list.filter(r => !r.done).length;
            const isToday = iso === todayISO();
            const sel = iso === day;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setDay(iso)}
                className={cn(
                  'relative flex min-h-[54px] flex-col items-stretch rounded-xl p-1.5 text-left transition md:min-h-[92px] md:p-2',
                  sel ? 'bg-violet-500/20 ring-1 ring-violet-400' : 'hover:bg-white/5',
                  'bg-white/[0.025]'
                )}
              >
                <span className={cn('grid h-6 w-6 place-items-center rounded-full text-xs font-semibold', isToday ? 'bg-violet-500 text-white' : 'text-muted')}>{i + 1}</span>
                <span className="mt-auto hidden space-y-0.5 md:block">
                  {list.slice(0, 2).map(r => (
                    <span key={r.id} className={cn('block truncate rounded bg-violet-500/15 px-1 text-[10px] text-violet-100', r.done && 'opacity-40 line-through')}>
                      {r.time ? `${r.time.slice(0, 5)} ` : ''}
                      {clientOf(r.client_id)?.name ?? r.title}
                    </span>
                  ))}
                  {list.length > 2 && <span className="block text-[10px] text-faint">+{list.length - 2} más</span>}
                </span>
                {list.length > 0 && (
                  <span className="absolute right-1.5 bottom-1.5 flex gap-0.5 md:hidden">
                    {list.slice(0, 3).map(r => (
                      <span key={r.id} className={cn('h-1.5 w-1.5 rounded-full', r.done ? 'bg-white/25' : 'bg-violet-400')} />
                    ))}
                  </span>
                )}
                {pending > 0 && <span className="sr-only">{pending} pendientes</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* detalle del día elegido, debajo del calendario */}
      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold capitalize">{longDate(day)}</h2>
          <button type="button" onClick={() => setSheet({ date: day })} className="btn btn-ghost !text-sm">
            <Plus size={16} /> Agregar
          </button>
        </div>
        {items.length === 0 ? (
          <p className="neu-inset rounded-2xl p-4 text-sm text-muted">Nada agendado para este día.</p>
        ) : (
          <ul className="space-y-2.5">
            <AnimatePresence>
              {items.map(r => (
                <ReminderItem key={r.id} r={r} client={clientOf(r.client_id)} onEdit={() => setSheet(r)} notify={notify} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <ReminderSheet open={!!sheet} initial={sheet} onClose={() => setSheet(null)} clients={myClients} notify={notify} />
    </div>
  );
}
