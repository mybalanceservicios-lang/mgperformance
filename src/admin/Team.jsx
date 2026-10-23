import { useMemo, useState } from 'react';
import { Copy, UserPlus } from 'lucide-react';
import { Switch } from '@/components/ui';
import { isDemo } from '@/lib/supabase';
import { addDemoEmployee, updateProfile } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { Avatar, Card, PageHeader } from './kit';
import { inPeriod, summarize } from './metrics';

export default function Team({ me, profiles, sales, notify }) {
  const [name, setName] = useState('');
  const month = useMemo(() => inPeriod(sales, 'mes'), [sales]);
  const adminUrl = `${window.location.href.split('#')[0]}#/admin`;

  const toggle = async (p, active) => {
    await updateProfile(p.id, { active });
    notify(active ? `${p.name} ya puede entrar` : `${p.name} quedó sin acceso`);
  };

  return (
    <div>
      <PageHeader title="Equipo" subtitle="Quién puede entrar al sistema y cómo viene cada uno este mes." />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Personas">
          <ul className="space-y-2.5">
            {profiles.map(p => {
              const s = summarize(month.filter(x => x.employee_id === p.id));
              const pending = summarize(sales.filter(x => x.employee_id === p.id)).pending;
              const isMe = p.id === me.id;
              return (
                <li key={p.id} className="neu-sm flex items-center gap-3 p-3">
                  <Avatar name={p.name} owner={p.role === 'owner'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{p.name}</span>
                      <span className={`chip ${p.role === 'owner' ? 'bg-ios-orange/10 text-ios-orange' : 'bg-white/5 text-muted'}`}>
                        {p.role === 'owner' ? 'Dueño' : 'Empleado'}
                      </span>
                      {!p.active && <span className="chip bg-ios-red/10 text-ios-red">Sin acceso</span>}
                    </div>
                    <div className="truncate text-xs text-muted">
                      Este mes: {s.count} vend. · {formatPrice(s.total)} · comisión {formatPrice(s.commission)}
                      {pending > 0 && <span className="text-ios-orange"> · debe {formatPrice(pending)}</span>}
                    </div>
                  </div>
                  {!isMe && <Switch checked={!!p.active} onChange={v => toggle(p, v)} label={`Acceso de ${p.name}`} />}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Sumar un empleado">
          {isDemo ? (
            <form
              onSubmit={async e => {
                e.preventDefault();
                if (!name.trim()) return;
                await addDemoEmployee(name.trim());
                notify(`${name.trim()} agregado (contraseña 1234)`);
                setName('');
              }}
              className="space-y-3"
            >
              <p className="text-sm text-muted">En el modo demo lo agregás directo. Su contraseña es 1234.</p>
              <input className="field" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
              <button className="btn btn-primary w-full">
                <UserPlus size={18} /> Agregar
              </button>
            </form>
          ) : (
            <ol className="space-y-3 text-sm">
              {[
                <>Pasale este link: <button type="button" onClick={() => navigator.clipboard.writeText(adminUrl).then(() => notify('Link copiado'))} className="inline-flex items-center gap-1 font-semibold text-ios-blue"><Copy size={13} /> copiar link</button></>,
                <>Entra en <b>“Soy nuevo”</b> y crea su cuenta con su email.</>,
                <>Aparece acá como <b>“Sin acceso”</b>. Activale el switch y listo.</>
              ].map((t, i) => (
                <li key={i} className="neu-inset flex items-start gap-3 px-4 py-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ios-blue text-xs font-bold text-white">{i + 1}</span>
                  <span className="text-muted">{t}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 text-xs text-faint">
            Los empleados pueden cargar publicaciones y registrar sus ventas. Solo vos ves el resumen general, las ventas de todos y definís los precios a rendir.
          </p>
        </Card>
      </div>
    </div>
  );
}
