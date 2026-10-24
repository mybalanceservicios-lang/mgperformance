import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Hand, MapPin, X } from 'lucide-react';
import { CHECKS } from '@/config';
import { cn } from '@/lib/utils';
import { MediaView } from './ui';
import { phoneColor, phoneVariant } from './Phone3D';

const PhoneViewer = lazy(() => import('./Phone3D').then(m => ({ default: m.PhoneViewer })));

function MarkModal({ mark, media, onClose }) {
  useEffect(() => {
    if (!mark) return;
    const esc = e => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [mark, onClose]);
  return (
    <AnimatePresence>
      {mark && (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={mark.title}>
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="ml-panel relative w-full max-w-lg overflow-hidden !bg-[#0e0a1c]"
          >
            <button type="button" onClick={onClose} className="absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white" aria-label="Cerrar">
              <X size={18} />
            </button>
            {media && (
              <div className="aspect-square bg-black sm:aspect-video">
                <MediaView item={media} controls={media.type === 'video'} autoPlay cover={false} />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <MapPin size={14} /> Detalle en el {mark.side === 'back' ? 'dorso' : 'frente'}
              </div>
              <h3 className="mt-1 text-lg font-semibold">{mark.title}</h3>
              {mark.note && <p className="mt-1 text-sm text-white/65">{mark.note}</p>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function Diagnostic({ product }) {
  const viewer = useRef(null);
  const [active, setActive] = useState(null);
  const marks = product.diagnostics?.marks ?? [];
  const checks = product.diagnostics?.checks ?? {};
  const tested = CHECKS.filter(c => checks[c.id] != null);
  const isNew = product.condition === 'nuevo';
  const mark = marks.find(m => m.id === active);
  const media = mark ? product.media?.find(m => m.id === mark.media_id) ?? null : null;

  const open = m => {
    viewer.current?.show(m.side);
    setActive(m.id);
  };

  return (
    <section className="ml-panel mt-5 overflow-hidden">
      <div className="grid lg:grid-cols-[1.1fr_1fr]">
        <div className="relative h-[420px] bg-[radial-gradient(circle_at_50%_45%,#2a1858,#0b0818_70%)] sm:h-[480px]">
          <Suspense fallback={<div className="grid h-full place-items-center text-sm text-white/40">Cargando 3D…</div>}>
            <PhoneViewer
              ref={viewer}
              className="absolute inset-0"
              color={phoneColor(product.color)}
              variant={phoneVariant(product.model)}
              marks={marks}
              activeMark={active}
              onMark={m => setActive(m.id)}
            />
          </Suspense>
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs text-white/80 backdrop-blur">
              <Hand size={13} /> Arrastrá para girar{marks.length > 0 && ' · tocá los puntos naranjas'}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {['front', 'back'].map(s => (
              <button key={s} type="button" onClick={() => viewer.current?.show(s)} className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur hover:bg-white/20">
                {s === 'front' ? 'Frente' : 'Dorso'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 lg:border-l lg:border-white/6">
          <h2 className="text-xl font-semibold">Diagnóstico del equipo</h2>
          <p className="mt-1 text-sm text-white/55">
            {isNew ? 'Equipo nuevo en caja sellada.' : 'Lo revisamos antes de publicarlo. Así está este equipo.'}
          </p>

          {!isNew && (
            <>
              <h3 className="mt-6 mb-2 text-sm font-semibold">Detalles estéticos</h3>
              {marks.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-ml-green">
                  <Check size={16} /> Sin marcas visibles
                </p>
              ) : (
                <ul className="space-y-2">
                  {marks.map(m => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => open(m)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition',
                          active === m.id ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/8 hover:border-white/20'
                        )}
                      >
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">{m.title}</span>
                          <span className="block text-xs text-white/50">
                            {m.side === 'back' ? 'Dorso' : 'Frente'}
                            {m.media_id && ' · ver video'}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tested.length > 0 && (
            <>
              <h3 className="mt-6 mb-2 text-sm font-semibold">Funcionamiento</h3>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                {tested.map(c => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    {checks[c.id] ? (
                      <Check size={16} className="shrink-0 text-ml-green" />
                    ) : (
                      <X size={16} className="shrink-0 text-red-400" />
                    )}
                    <span className={checks[c.id] ? 'text-white/80' : 'text-red-300'}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
      <MarkModal mark={mark && media !== undefined ? mark : null} media={media} onClose={() => setActive(null)} />
    </section>
  );
}
