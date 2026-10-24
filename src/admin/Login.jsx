import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Boxes, ChevronLeft, Crown, Delete, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Header';
import { isDemo } from '@/lib/supabase';
import { listStaff, signInPin } from '@/lib/store';
import { friendlyError } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Avatar } from './kit';
import RtWatermark from '@/components/RtWatermark';

function PinPad({ person, onBack, onDone }) {
  const [pin, setPin] = useState('');
  const [state, setState] = useState('idle'); // idle | busy | error

  const press = useCallback(
    async k => {
      if (state === 'busy') return;
      if (k === 'del') return setPin(p => p.slice(0, -1));
      if (k === 'clear') return setPin('');
      const next = (pin + k).slice(0, 4);
      setPin(next);
      setState('idle');
      if (next.length === 4) {
        setState('busy');
        try {
          await signInPin(person.slug, next);
          onDone();
        } catch {
          setState('error');
          setTimeout(() => {
            setPin('');
            setState('idle');
          }, 650);
        }
      }
    },
    [pin, state, person.slug, onDone]
  );

  useEffect(() => {
    const onKey = e => {
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, onBack]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="neu w-full max-w-[340px] p-7 text-center">
      <div className="flex justify-center">
        <Avatar name={person.name} owner={person.role === 'owner'} size={64} />
      </div>
      <h2 className="mt-4 text-xl font-bold">Hola, {person.name}</h2>
      <p className="mt-1 text-sm text-muted">Ingresá tu clave de 4 números</p>
      <motion.div animate={state === 'error' ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.35 }} className="my-6 flex justify-center gap-4">
        {[0, 1, 2, 3].map(i => (
          <span
            key={i}
            className={cn(
              'h-4 w-4 rounded-full border-2 transition',
              state === 'error' ? 'border-ios-red bg-ios-red' : i < pin.length ? 'border-violet-400 bg-violet-400' : 'border-white/20 bg-transparent'
            )}
          />
        ))}
      </motion.div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} type="button" onClick={() => press(String(n))} className="btn btn-neu !h-14 !rounded-2xl text-xl font-semibold">
            {n}
          </button>
        ))}
        <button type="button" onClick={() => press('clear')} className="btn !h-14 text-sm text-muted">Borrar</button>
        <button type="button" onClick={() => press('0')} className="btn btn-neu !h-14 !rounded-2xl text-xl font-semibold">0</button>
        <button type="button" onClick={() => press('del')} className="btn !h-14 text-muted" aria-label="Borrar último">
          <Delete size={20} />
        </button>
      </div>
      <p className="mt-4 h-5 text-sm font-semibold text-ios-red">{state === 'error' ? 'Clave incorrecta' : state === 'busy' ? <Loader2 size={16} className="mx-auto animate-spin text-muted" /> : ''}</p>
      <button type="button" onClick={onBack} className="btn btn-ghost mt-1 !text-sm">
        <ChevronLeft size={16} /> Volver
      </button>
    </motion.div>
  );
}

export default function Login({ onDone }) {
  const [staff, setStaff] = useState(null);
  const [error, setError] = useState('');
  const [person, setPerson] = useState(null);

  useEffect(() => {
    listStaff()
      .then(setStaff)
      .catch(e => setError(friendlyError(e)));
  }, []);

  const sellers = (staff ?? []).filter(p => p.role !== 'inventory');
  const inventory = (staff ?? []).find(p => p.role === 'inventory');

  return (
    <main className="relative grid min-h-dvh place-items-center px-4 py-10">
      <AnimatePresence mode="wait">
        {person ? (
          <PinPad key="pin" person={person} onBack={() => setPerson(null)} onDone={onDone} />
        ) : (
          <motion.div key="who" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="w-full max-w-2xl text-center">
            <div className="flex justify-center">
              <Logo />
            </div>
            <h1 className="mt-8 text-2xl font-bold md:text-3xl">¿Quién está usando el sistema?</h1>
            <p className="mt-2 text-muted">Tocá tu nombre para entrar.</p>
            {error && <p className="mx-auto mt-6 max-w-md rounded-2xl bg-ios-red/10 p-3 text-sm text-ios-red">{error}</p>}
            {!staff && !error && <Loader2 className="mx-auto mt-10 animate-spin text-muted" />}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {sellers.map((p, i) => {
                const owner = p.role === 'owner';
                return (
                  <motion.button
                    key={p.slug}
                    type="button"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setPerson(p)}
                    className={cn('neu flex flex-col items-center gap-3 px-4 py-6 transition hover:-translate-y-1', owner && 'ring-1 ring-ios-orange/40')}
                  >
                    <Avatar name={p.name} owner={owner} size={60} />
                    <span className="text-base font-bold">{p.name}</span>
                    <span className={cn('flex items-center gap-1 text-xs', owner ? 'text-ios-orange' : 'text-muted')}>
                      {owner && <Crown size={12} />} {owner ? 'Dueño' : 'Vendedor'}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            {isDemo && <p className="mt-6 text-xs text-ios-orange">Modo demo · claves: Alte 1111 · Tito 2222 · Tomás 3333 · Matías 7777 · Inventario 9999</p>}
            <Link to="/" className="btn btn-ghost mt-6 !text-sm">Volver a la tienda</Link>
          </motion.div>
        )}
      </AnimatePresence>

      <RtWatermark always className="opacity-70" />

      {/* acceso a Inventario, abajo a la derecha */}
      {!person && inventory && (
        <button
          type="button"
          onClick={() => setPerson(inventory)}
          className="neu-sm fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] flex items-center gap-2.5 !rounded-2xl px-4 py-3 text-sm font-semibold text-muted transition hover:text-ink"
        >
          <Boxes size={18} className="text-violet-400" /> Inventario
        </button>
      )}
    </main>
  );
}
