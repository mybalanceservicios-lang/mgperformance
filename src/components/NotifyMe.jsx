import { useState } from 'react';
import { BellRing, Check, Loader2 } from 'lucide-react';
import { STORAGE_OPTIONS } from '@/config';
import { createLead } from '@/lib/store';
import { cn } from '@/lib/utils';

// "Avisame cuando entre": deja sus datos y le llega a Matías en Interesados
export default function NotifyMe({ defaultModel = '', compact, className }) {
  const [f, setF] = useState({ name: '', phone: '', model: defaultModel, storage: '', budget: '', website: '' });
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const set = patch => setF(p => ({ ...p, ...patch }));

  const submit = async e => {
    e.preventDefault();
    if (f.website) return; // trampa para robots
    setError('');
    if (!f.model.trim()) return setError('Contanos qué modelo buscás');
    setState('busy');
    try {
      await createLead({ kind: 'aviso', name: f.name, phone: f.phone, model: f.model.trim(), storage: f.storage, details: f.budget ? { budget: f.budget } : {} });
      setState('done');
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  };

  if (state === 'done')
    return (
      <div className={cn('ml-panel flex items-center gap-3 p-5', className)}>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
          <Check size={20} />
        </span>
        <div>
          <div className="font-semibold">¡Listo, {f.name.split(' ')[0]}!</div>
          <div className="text-sm text-white/60">Cuando entre un {f.model} te escribimos por WhatsApp.</div>
        </div>
      </div>
    );

  const field = 'h-11 w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 text-[15px] outline-none focus:border-violet-400/60';
  return (
    <form onSubmit={submit} className={cn('ml-panel p-5 md:p-6', className)}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-500/20 text-violet-300">
          <BellRing size={19} />
        </span>
        <div>
          <h3 className="text-lg font-semibold">¿No encontrás el que buscás?</h3>
          <p className="text-sm text-white/60">Dejanos qué querés y te avisamos apenas entre. Nos llegan equipos todas las semanas.</p>
        </div>
      </div>
      <div className={cn('mt-4 grid gap-2.5', compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-5')}>
        <input className={cn(field, !compact && 'lg:col-span-2')} placeholder="Modelo (ej: iPhone 15 Pro)" value={f.model} onChange={e => set({ model: e.target.value })} />
        <select className={field} value={f.storage} onChange={e => set({ storage: e.target.value })} aria-label="Capacidad">
          <option value="" className="bg-[#0e0a1c]">Cualquier capacidad</option>
          {STORAGE_OPTIONS.map(s => (
            <option key={s} value={s} className="bg-[#0e0a1c]">
              {s}
            </option>
          ))}
        </select>
        <input className={field} inputMode="numeric" placeholder="Presupuesto US$ (opcional)" value={f.budget} onChange={e => set({ budget: e.target.value.replace(/\D/g, '') })} />
        <input className={field} placeholder="Tu nombre" value={f.name} onChange={e => set({ name: e.target.value })} />
        <input className={field} type="tel" inputMode="tel" placeholder="Tu WhatsApp" value={f.phone} onChange={e => set({ phone: e.target.value })} />
        <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={e => set({ website: e.target.value })} aria-hidden="true" />
        <button className={cn('btn btn-ml', !compact && 'lg:col-span-3')} disabled={state === 'busy'}>
          {state === 'busy' ? <Loader2 size={18} className="animate-spin" /> : <BellRing size={18} />} Avisame cuando entre
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </form>
  );
}
