import { useMemo, useState } from 'react';
import { KeyRound, Loader2, UserPlus } from 'lucide-react';
import { Segmented, Sheet, Switch } from '@/components/ui';
import { setPin, updateProfile, upsertStaff } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { Avatar, Card, PageHeader } from './kit';
import { inPeriod, summarize } from './metrics';

const ROLE = { owner: 'Dueño', employee: 'Vendedor', inventory: 'Inventario' };

function PinSheet({ person, onClose, notify }) {
  const [pin, setPinValue] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await setPin(person.slug, pin);
      notify(`Clave de ${person.name} cambiada`);
      setPinValue('');
      onClose();
    } catch (e) {
      notify(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open={!!person} onClose={onClose} title={`Clave de ${person?.name ?? ''}`}>
      <p className="mb-4 text-sm text-muted">Elegí 4 números. La persona entra tocando su nombre y escribiendo esta clave.</p>
      <input
        inputMode="numeric"
        maxLength={4}
        value={pin}
        onChange={e => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
        className="field text-center text-3xl font-bold tracking-[0.6em]"
        placeholder="••••"
        autoFocus
      />
      <button className="btn btn-primary mt-4 w-full" disabled={pin.length !== 4 || busy} onClick={save}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />} Guardar clave
      </button>
    </Sheet>
  );
}

export default function Team({ me, profiles, sales, notify }) {
  const [pinFor, setPinFor] = useState(null);
  const [form, setForm] = useState({ name: '', role: 'employee', pin: '' });
  const [busy, setBusy] = useState(false);
  const month = useMemo(() => inPeriod(sales, 'mes'), [sales]);
  const people = [...profiles].sort((a, b) => (a.sort ?? 50) - (b.sort ?? 50));

  const add = async e => {
    e.preventDefault();
    if (!form.name.trim() || form.pin.length !== 4) return notify('Poné nombre y una clave de 4 números');
    setBusy(true);
    try {
      await upsertStaff({ slug: form.name, name: form.name.trim(), role: form.role, pin: form.pin, sort: people.length + 1 });
      notify(`${form.name.trim()} ya puede entrar`);
      setForm({ name: '', role: 'employee', pin: '' });
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Equipo" subtitle="Quién entra al sistema, sus claves y cómo viene cada uno este mes." />
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Personas">
          <ul className="space-y-2.5">
            {people.map(p => {
              const s = summarize(month.filter(x => x.employee_id === p.id));
              const isMe = p.id === me.id;
              return (
                <li key={p.id} className="neu-sm flex items-center gap-3 p-3">
                  <Avatar name={p.name ?? '?'} owner={p.role === 'owner'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{p.name}</span>
                      <span className="chip bg-white/5 text-muted">{ROLE[p.role] ?? p.role}</span>
                      {!p.active && <span className="chip bg-ios-red/10 text-ios-red">Sin acceso</span>}
                    </div>
                    {p.role !== 'inventory' && (
                      <div className="truncate text-xs text-muted">
                        Este mes: {s.count} vend. · {formatPrice(s.total)} · comisión {formatPrice(s.commission)}
                      </div>
                    )}
                  </div>
                  {p.slug && (
                    <button type="button" onClick={() => setPinFor(p)} className="btn btn-neu !min-h-[38px] !px-3 !text-xs">
                      <KeyRound size={14} /> Clave
                    </button>
                  )}
                  {!isMe && <Switch checked={!!p.active} onChange={async v => { await updateProfile(p.id, { active: v }); notify(v ? `${p.name} puede entrar` : `${p.name} quedó sin acceso`); }} label={`Acceso de ${p.name}`} />}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Sumar a alguien">
          <form onSubmit={add} className="space-y-4">
            <div>
              <label className="label" htmlFor="t-name">Nombre</label>
              <input id="t-name" className="field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Fran" />
            </div>
            <div>
              <span className="label">Rol</span>
              <Segmented size="sm" options={[{ value: 'employee', label: 'Vendedor' }, { value: 'inventory', label: 'Inventario' }]} value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} />
            </div>
            <div>
              <label className="label" htmlFor="t-pin">Clave (4 números)</label>
              <input id="t-pin" inputMode="numeric" maxLength={4} className="field tracking-[0.4em]" value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="••••" />
            </div>
            <button className="btn btn-primary w-full" disabled={busy}>
              <UserPlus size={18} /> Agregar
            </button>
            <p className="text-xs text-faint">Aparece como un cuadradito más en la pantalla de ingreso.</p>
          </form>
        </Card>
      </div>
      <PinSheet person={pinFor} onClose={() => setPinFor(null)} notify={notify} />
    </div>
  );
}
