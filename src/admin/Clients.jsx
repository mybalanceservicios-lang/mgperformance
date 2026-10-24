import { useMemo, useState } from 'react';
import { CalendarPlus, Pencil, Plus, Receipt, Search, Trash2, Users } from 'lucide-react';
import { Empty, Sheet } from '@/components/ui';
import { deleteRow } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { Avatar, PageHeader, WhatsAppLink } from './kit';
import { ClientRow, ClientSheet } from './ClientSheet';
import { saleTotal, timeAgo } from './metrics';

export default function Clients({ clients, sales, reminders, notify, openSale, openReminder, me }) {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const mine = clients.filter(c => c.employee_id === me.id);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return mine.filter(c => !s || `${c.name} ${c.phone ?? ''} ${c.interest ?? ''}`.toLowerCase().includes(s)).sort((a, b) => a.name.localeCompare(b.name));
  }, [mine, q]);

  const d = detail && mine.find(c => c.id === detail.id);
  const dSales = d ? sales.filter(s => s.client_id === d.id) : [];
  const dRem = d ? reminders.filter(r => r.client_id === d.id).sort((a, b) => (a.date < b.date ? 1 : -1)) : [];

  return (
    <div>
      <PageHeader
        title="Mis clientes"
        subtitle={`${mine.length} clientes. Tocá uno para ver su historial.`}
        action={
          <button type="button" onClick={() => setEditing({})} className="btn btn-primary !min-h-[46px]">
            <Plus size={19} /> Cliente nuevo
          </button>
        }
      />
      <div className="relative mb-5">
        <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
        <input type="search" className="field !pl-10" placeholder="Buscar por nombre, teléfono o lo que busca…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<Users size={26} />}
          title={mine.length ? 'No hay coincidencias' : 'Todavía no cargaste clientes'}
          text={mine.length ? 'Probá con otra búsqueda.' : 'Cargá a cada persona que te escribe: después la agendás y le escribís por WhatsApp con un toque.'}
          action={!mine.length && <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Cargar el primero</button>}
        />
      ) : (
        <ul className="grid gap-2.5 md:grid-cols-2">
          {list.map(c => (
            <ClientRow key={c.id} client={c} onOpen={() => setDetail(c)} />
          ))}
        </ul>
      )}

      <ClientSheet open={!!editing} initial={editing} onClose={() => setEditing(null)} notify={notify} />

      <Sheet open={!!d} onClose={() => setDetail(null)} title={d?.name ?? ''}>
        {d && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={d.name} size={56} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-muted">{d.phone || 'Sin teléfono'}</div>
                {d.interest && <div className="text-sm">Busca: <b>{d.interest}</b></div>}
              </div>
              <WhatsAppLink phone={d.phone} text={`Hola ${d.name.split(' ')[0]}! `}>WhatsApp</WhatsAppLink>
            </div>
            {d.notes && <p className="neu-inset rounded-2xl p-3 text-sm text-muted">{d.notes}</p>}
            <div className="grid grid-cols-2 gap-2.5">
              <button type="button" className="btn btn-neu" onClick={() => { setDetail(null); openReminder({ client_id: d.id }); }}>
                <CalendarPlus size={17} /> Agendar
              </button>
              <button type="button" className="btn btn-neu" onClick={() => { setDetail(null); openSale({ client_id: d.id }); }}>
                <Receipt size={17} /> Venta
              </button>
            </div>

            <div>
              <h3 className="label">Compras ({dSales.length})</h3>
              {dSales.length ? (
                <ul className="space-y-2">
                  {dSales.map(s => (
                    <li key={s.id} className="neu-inset flex justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm">
                      <span className="truncate">{s.product_label}</span>
                      <span className="shrink-0 font-semibold">{formatPrice(saleTotal(s))}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pl-1 text-sm text-faint">Todavía no compró.</p>
              )}
            </div>
            <div>
              <h3 className="label">En el calendario ({dRem.length})</h3>
              {dRem.length ? (
                <ul className="space-y-2">
                  {dRem.slice(0, 8).map(r => (
                    <li key={r.id} className="neu-inset flex justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm">
                      <span className={r.done ? 'text-faint line-through' : ''}>{r.title}</span>
                      <span className="shrink-0 text-muted">{new Date(`${r.date}T12:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="pl-1 text-sm text-faint">Sin recordatorios.</p>
              )}
            </div>
            <p className="text-xs text-faint">Cliente desde {timeAgo(d.created_at)}</p>
            <div className="flex gap-2">
              <button type="button" className="btn btn-neu flex-1" onClick={() => { setDetail(null); setEditing(d); }}>
                <Pencil size={16} /> Editar
              </button>
              <button
                type="button"
                className="btn btn-neu flex-1 !text-ios-red"
                onClick={async () => {
                  if (!confirm(`¿Borrar a ${d.name}? Sus ventas quedan guardadas.`)) return;
                  await deleteRow('clients', d);
                  setDetail(null);
                  notify('Cliente borrado');
                }}
              >
                <Trash2 size={16} /> Borrar
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
