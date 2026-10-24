import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Search, UserPlus } from 'lucide-react';
import { Sheet } from '@/components/ui';
import { saveRow } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Avatar, WhatsAppLink } from './kit';

const EMPTY = { name: '', phone: '', interest: '', notes: '' };

// Formulario de cliente: nombre obligatorio, el resto opcional
export function ClientForm({ initial, onSaved, onCancel, compact }) {
  const [c, setC] = useState({ ...EMPTY, ...initial });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = patch => setC(prev => ({ ...prev, ...patch }));

  const submit = async e => {
    e?.preventDefault();
    if (!c.name.trim()) return setError('Poné al menos el nombre');
    setBusy(true);
    setError('');
    try {
      const saved = await saveRow('clients', { id: c.id, name: c.name.trim(), phone: c.phone.trim(), interest: c.interest, notes: c.notes });
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <div>
        <label className="label" htmlFor="c-name">Nombre *</label>
        <input id="c-name" className="field" value={c.name} onChange={e => set({ name: e.target.value })} placeholder="Ej: Juan Pérez" autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="c-phone">WhatsApp</label>
        <input id="c-phone" type="tel" inputMode="tel" className="field" value={c.phone} onChange={e => set({ phone: e.target.value })} placeholder="Ej: 11 2345 6789" />
        <p className="mt-1 pl-1 text-[11px] text-faint">Con código de área, sin 0 ni 15. Ej: 11 2345 6789</p>
      </div>
      {!compact && (
        <>
          <div>
            <label className="label" htmlFor="c-int">¿Qué busca?</label>
            <input id="c-int" className="field" value={c.interest ?? ''} onChange={e => set({ interest: e.target.value })} placeholder="Ej: iPhone 15 Pro, entrega su 12" />
          </div>
          <div>
            <label className="label" htmlFor="c-notes">Notas</label>
            <textarea id="c-notes" rows={2} className="field resize-none" value={c.notes ?? ''} onChange={e => set({ notes: e.target.value })} />
          </div>
        </>
      )}
      {error && <p className="text-sm text-ios-red">{error}</p>}
      <div className="flex gap-2">
        {onCancel && (
          <button type="button" className="btn btn-neu flex-1" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button className="btn btn-primary flex-[2]" disabled={busy}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} {c.id ? 'Guardar' : 'Crear cliente'}
        </button>
      </div>
    </form>
  );
}

export function ClientSheet({ open, onClose, initial, onSaved, notify }) {
  return (
    <Sheet open={open} onClose={onClose} title={initial?.id ? 'Editar cliente' : 'Cliente nuevo'}>
      <ClientForm
        initial={initial}
        onCancel={onClose}
        onSaved={c => {
          notify?.(initial?.id ? 'Cliente actualizado' : 'Cliente creado');
          onSaved?.(c);
          onClose();
        }}
      />
    </Sheet>
  );
}

// Elegir un cliente existente o crear uno en el momento
export function ClientPicker({ clients, value, onChange }) {
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null); // recién creado (antes de que se recargue la lista)
  const selected = clients.find(c => c.id === value) ?? (created?.id === value ? created : null);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return clients.filter(c => !s || `${c.name} ${c.phone ?? ''}`.toLowerCase().includes(s)).slice(0, 6);
  }, [clients, q]);

  useEffect(() => {
    if (value) setCreating(false);
  }, [value]);

  if (selected)
    return (
      <div className="neu-inset flex items-center gap-3 rounded-2xl p-2.5">
        <Avatar name={selected.name} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{selected.name}</div>
          <div className="truncate text-xs text-muted">{selected.phone || 'Sin teléfono'}</div>
        </div>
        <button type="button" className="btn btn-ghost !min-h-[34px] !text-sm" onClick={() => onChange(null)}>
          Cambiar
        </button>
      </div>
    );

  if (creating)
    return (
      <div className="neu-inset rounded-2xl p-3.5">
        <ClientForm
          compact
          onCancel={() => setCreating(false)}
          onSaved={c => {
            setCreated(c);
            onChange(c.id, c);
          }}
        />
      </div>
    );

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
          <input className="field !pl-10" placeholder="Buscar cliente…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <button type="button" onClick={() => setCreating(true)} className="btn btn-neu shrink-0 !px-3.5 !text-sm" title="Cliente nuevo">
          <Plus size={17} /> Nuevo
        </button>
      </div>
      {list.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {list.map(c => (
            <button key={c.id} type="button" onClick={() => onChange(c.id, c)} className={cn('neu-sm flex items-center gap-2 !rounded-full py-1 pr-3 pl-1 text-sm')}>
              <Avatar name={c.name} size={26} /> {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ClientRow({ client, onOpen, extra }) {
  return (
    <li className="neu-sm flex items-center gap-3 p-3">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <Avatar name={client.name} />
        <span className="min-w-0">
          <span className="block truncate font-semibold">{client.name}</span>
          <span className="block truncate text-xs text-muted">{[client.phone, client.interest].filter(Boolean).join(' · ') || 'Sin datos'}</span>
        </span>
      </button>
      {extra}
      <WhatsAppLink phone={client.phone} text={`Hola ${client.name.split(' ')[0]}! `} size="sm" />
    </li>
  );
}
