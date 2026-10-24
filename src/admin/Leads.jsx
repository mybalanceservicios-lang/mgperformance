import { useMemo, useState } from 'react';
import { BellRing, Check, RefreshCcw, Sparkles, Trash2, UserPlus } from 'lucide-react';
import { Empty } from '@/components/ui';
import { family } from '@/components/Listing';
import { STORE } from '@/config';
import { deleteRow, saveRow } from '@/lib/store';
import { cn, formatPrice, productUrl } from '@/lib/utils';
import { Avatar, PageHeader, WhatsAppLink } from './kit';
import { timeAgo } from './metrics';

const STATUS = [
  { id: 'nuevo', label: 'Nuevos' },
  { id: 'contactado', label: 'Contactados' },
  { id: 'cerrado', label: 'Cerrados' },
  { id: 'all', label: 'Todos' }
];

// ¿Hay en stock algo de lo que pidió? (mismo modelo y, si eligió, misma capacidad)
function matches(lead, products) {
  if (lead.kind !== 'aviso' || !lead.model) return [];
  const want = lead.model.toLowerCase().replace(/\s+/g, ' ').trim();
  return products.filter(p => {
    if (!(p.stock > 0) || p.status === 'vendido') return false;
    const m = p.model.toLowerCase();
    const sameModel = m === want || m === `iphone ${want}` || (want.length > 8 && m.includes(want)) || family(p.model).toLowerCase() === want;
    return sameModel && (!lead.storage || p.storage === lead.storage);
  });
}

function message(lead, found) {
  const first = lead.name.split(' ')[0];
  if (lead.kind === 'cotizacion') {
    const range = lead.estimate_min ? ` En la web te dio entre ${formatPrice(lead.estimate_min)} y ${formatPrice(lead.estimate_max)}.` : '';
    return `Hola ${first}! Te escribo de ${STORE.name} por tu ${lead.model}${lead.storage ? ` ${lead.storage}` : ''} para entregar en parte de pago.${range} ¿Cuándo podés pasar para revisarlo?`;
  }
  if (found.length) {
    const p = found[0];
    return `Hola ${first}! Te escribo de ${STORE.name}: entró el ${p.model} ${p.storage ?? ''} que estabas buscando, a ${formatPrice(p.price)}. Miralo acá: ${productUrl(p)}`;
  }
  return `Hola ${first}! Te escribo de ${STORE.name} por el ${lead.model} que estás buscando.`;
}

export default function Leads({ leads, products, me, notify }) {
  const [status, setStatus] = useState('nuevo');
  const [kind, setKind] = useState('all');

  const enriched = useMemo(() => leads.map(l => ({ ...l, found: matches(l, products) })), [leads, products]);
  const list = enriched.filter(l => (status === 'all' || l.status === status) && (kind === 'all' || l.kind === kind));
  const count = s => enriched.filter(l => l.status === s).length;
  const ready = enriched.filter(l => l.found.length && l.status !== 'cerrado').length;

  const setLeadStatus = async (l, s) => {
    await saveRow('leads', { id: l.id, status: s, contacted_at: s === 'contactado' ? new Date().toISOString() : l.contacted_at ?? null });
    notify(s === 'contactado' ? 'Marcado como contactado' : s === 'cerrado' ? 'Cerrado' : 'Volvió a nuevos');
  };
  const toClient = async l => {
    await saveRow('clients', {
      name: l.name,
      phone: l.phone,
      interest: l.kind === 'cotizacion' ? `Entrega ${l.model} ${l.storage ?? ''}`.trim() : `Busca ${l.model} ${l.storage ?? ''}`.trim(),
      notes: l.kind === 'cotizacion' && l.estimate_min ? `Cotización web: ${formatPrice(l.estimate_min)} a ${formatPrice(l.estimate_max)}` : null,
      employee_id: me.id
    });
    notify(`${l.name} pasó a tus clientes`);
  };

  return (
    <div>
      <PageHeader title="Interesados" subtitle="Lo que llega desde la web: cotizaciones de usados y pedidos de “avisame cuando entre”." />

      {ready > 0 && (
        <button type="button" onClick={() => { setKind('aviso'); setStatus('all'); }} className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-ios-green/30 bg-ios-green/10 p-4 text-left text-sm">
          <Sparkles size={20} className="shrink-0 text-ios-green" />
          <span>
            <b className="text-ios-green">{ready} {ready === 1 ? 'persona espera' : 'personas esperan'} un equipo que ya tenés en stock.</b> Escribiles ahora.
          </span>
        </button>
      )}

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {STATUS.map(s => (
            <button key={s.id} type="button" onClick={() => setStatus(s.id)} className={cn('shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold', status === s.id ? 'bg-violet-500 text-white' : 'bg-white/5 text-muted')}>
              {s.label}
              {s.id !== 'all' && <span className="ml-1.5 opacity-70">{count(s.id)}</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {[
            { id: 'all', label: 'Todo' },
            { id: 'cotizacion', label: 'Cotizaciones' },
            { id: 'aviso', label: 'Avisos' }
          ].map(k => (
            <button key={k.id} type="button" onClick={() => setKind(k.id)} className={cn('rounded-full px-3 py-1.5 text-xs font-semibold', kind === k.id ? 'bg-white/15 text-ink' : 'text-muted')}>
              {k.label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <Empty icon={<BellRing size={26} />} title="No hay interesados acá" text="Cuando alguien cotice su usado o pida que le avisen, aparece en esta lista." />
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {list.map(l => {
            const d = l.details ?? {};
            return (
              <li key={l.id} className={cn('neu p-4', l.found.length && l.status !== 'cerrado' && 'ring-1 ring-ios-green/50')}>
                <div className="flex items-start gap-3">
                  <Avatar name={l.name} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{l.name}</span>
                      <span className={cn('chip', l.kind === 'cotizacion' ? 'bg-ios-orange/15 text-ios-orange' : 'bg-violet-500/15 text-violet-300')}>
                        {l.kind === 'cotizacion' ? <RefreshCcw size={11} /> : <BellRing size={11} />}
                        {l.kind === 'cotizacion' ? 'Entrega su usado' : 'Avisame cuando entre'}
                      </span>
                      {l.status !== 'nuevo' && <span className="chip bg-white/5 text-muted">{l.status === 'contactado' ? 'Contactado' : 'Cerrado'}</span>}
                    </div>
                    <div className="text-xs text-muted">
                      {l.phone} · {timeAgo(l.created_at)}
                    </div>
                  </div>
                  <WhatsAppLink
                    phone={l.phone}
                    text={message(l, l.found)}
                    className="!h-10"
                    onClick={() => l.status === 'nuevo' && setLeadStatus(l, 'contactado')}
                  >
                    Escribir
                  </WhatsAppLink>
                </div>

                <div className="mt-3 rounded-xl bg-white/[0.04] p-3 text-sm">
                  <div className="font-semibold">
                    {l.kind === 'cotizacion' ? 'Tiene' : 'Busca'}: {l.model} {l.storage}
                  </div>
                  {l.kind === 'cotizacion' ? (
                    <div className="mt-0.5 text-xs text-muted">
                      {[d.battery && `Batería ${d.battery}`, d.condition, d.fault === true ? 'con alguna falla' : d.fault === false ? 'funciona todo' : null].filter(Boolean).join(' · ')}
                      {l.estimate_min && (
                        <div className="mt-1 text-sm text-ink">
                          Cotización web: <b>{formatPrice(l.estimate_min)} a {formatPrice(l.estimate_max)}</b>
                        </div>
                      )}
                      {d.para && <div className="mt-1">Quiere llevarse: {d.para}</div>}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-xs text-muted">{d.budget ? `Presupuesto: hasta ${formatPrice(d.budget)}` : 'Sin presupuesto indicado'}</div>
                  )}
                  {l.found.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-ios-green">
                      <Sparkles size={13} /> ¡Ya entró! {l.found.length === 1 ? `${l.found[0].model} ${l.found[0].storage ?? ''} a ${formatPrice(l.found[0].price)}` : `${l.found.length} equipos en stock`}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {l.status === 'nuevo' && (
                    <button type="button" className="btn btn-neu !min-h-[36px] !px-3 !text-xs" onClick={() => setLeadStatus(l, 'contactado')}>
                      <Check size={14} /> Contactado
                    </button>
                  )}
                  {l.status !== 'cerrado' ? (
                    <button type="button" className="btn btn-neu !min-h-[36px] !px-3 !text-xs" onClick={() => setLeadStatus(l, 'cerrado')}>
                      Cerrar
                    </button>
                  ) : (
                    <button type="button" className="btn btn-neu !min-h-[36px] !px-3 !text-xs" onClick={() => setLeadStatus(l, 'nuevo')}>
                      Reabrir
                    </button>
                  )}
                  <button type="button" className="btn btn-neu !min-h-[36px] !px-3 !text-xs" onClick={() => toClient(l)}>
                    <UserPlus size={14} /> Pasar a mis clientes
                  </button>
                  <button
                    type="button"
                    className="btn !min-h-[36px] !px-2 !text-xs text-faint hover:text-ios-red"
                    onClick={async () => {
                      if (!confirm(`¿Borrar a ${l.name} de interesados?`)) return;
                      await deleteRow('leads', l);
                      notify('Borrado');
                    }}
                    aria-label="Borrar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
