import { lazy, Suspense, useRef, useState } from 'react';
import { Box, Check, Loader2, MapPin, Trash2, Upload, X } from 'lucide-react';
import { MediaView, Segmented } from '@/components/ui';
import { CHECKS } from '@/config';
import { uploadMedia } from '@/lib/store';
import { cn, uid } from '@/lib/utils';
import { phoneColor, phoneVariant } from '@/components/Phone3D';

const PhoneViewer = lazy(() => import('@/components/Phone3D').then(m => ({ default: m.PhoneViewer })));

// Los puntos se guardan normalizados (-1..1) igual que los usa el iPhone 3D
const SX = 0.86;
const SY = 0.92;

function PhoneSketch({ side, variant, marks, active, onPlace, onSelect }) {
  const ref = useRef(null);
  const click = e => {
    const r = ref.current.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (((e.clientX - r.left) / r.width) * 2 - 1) / SX));
    const y = Math.max(-1, Math.min(1, (1 - ((e.clientY - r.top) / r.height) * 2) / SY));
    onPlace({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  };
  return (
    <div
      ref={ref}
      onClick={click}
      role="button"
      tabIndex={0}
      aria-label="Tocá donde está el detalle"
      className="relative mx-auto aspect-[1/2.06] w-full max-w-[210px] cursor-crosshair rounded-[16%/7.8%] border-[3px] border-white/25 bg-gradient-to-b from-[#1b1530] to-[#0d0a1a] shadow-[inset_0_0_0_6px_#05040a]"
    >
      {side === 'front' ? (
        <span className="absolute top-[3.5%] left-1/2 h-[3.6%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
      ) : variant === 'pro' ? (
        <span className="absolute top-[6%] left-[8%] h-[22%] w-[46%] rounded-[22%] border border-white/15 bg-white/5" />
      ) : (
        <span className="absolute top-[6%] left-[8%] h-[20%] w-[20%] rounded-full border border-white/15 bg-white/5" />
      )}
      {marks
        .filter(m => m.side === side)
        .map(m => (
          <button
            key={m.id}
            type="button"
            onClick={e => {
              e.stopPropagation();
              onSelect(m.id);
            }}
            className={cn(
              'absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_12px_#fbbf24]',
              active === m.id ? 'bg-white' : 'bg-amber-400'
            )}
            style={{ left: `${50 + m.x * SX * 50}%`, top: `${50 - m.y * SY * 50}%` }}
            aria-label={m.title || 'Marca'}
          />
        ))}
      <span className="pointer-events-none absolute inset-x-0 bottom-[4%] text-center text-[10px] text-white/40">{side === 'front' ? 'FRENTE' : 'DORSO'}</span>
    </div>
  );
}

export default function DiagnosticEditor({ value, onChange, product, onAddMedia }) {
  const diag = { checks: {}, marks: [], ...(value ?? {}) };
  const [side, setSide] = useState('back');
  const [active, setActive] = useState(null);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = patch => onChange({ ...diag, ...patch });
  const mark = diag.marks.find(m => m.id === active);
  const updateMark = patch => set({ marks: diag.marks.map(m => (m.id === active ? { ...m, ...patch } : m)) });

  const cycle = id => {
    const cur = diag.checks[id];
    const next = cur === true ? false : cur === false ? undefined : true;
    const checks = { ...diag.checks };
    if (next === undefined) delete checks[id];
    else checks[id] = next;
    set({ checks });
  };

  const upload = async file => {
    if (!file) return;
    setUploading(true);
    try {
      const item = await uploadMedia(file);
      onAddMedia(item);
      updateMark({ media_id: item.id });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="label !mb-0">Funcionamiento (tocá para cambiar: ✓ OK · ✕ falla · — sin revisar)</span>
          <button type="button" className="btn btn-ghost !min-h-[30px] !px-2 !text-xs" onClick={() => set({ checks: Object.fromEntries(CHECKS.map(c => [c.id, true])) })}>
            Todo OK
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CHECKS.map(c => {
            const v = diag.checks[c.id];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => cycle(c.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition',
                  v === true ? 'border-ios-green/40 bg-ios-green/10' : v === false ? 'border-ios-red/40 bg-ios-red/10' : 'border-white/8 text-muted'
                )}
              >
                {v === true ? <Check size={15} className="text-ios-green" /> : v === false ? <X size={15} className="text-ios-red" /> : <span className="w-[15px] text-center">—</span>}
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="label">Rayones, golpes o detalles</span>
        <p className="mb-3 pl-1 text-xs text-muted">Elegí frente o dorso y tocá el dibujo donde está el detalle. En la web aparece un punto naranja que abre el video o la foto que le asignes.</p>
        <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
          <div>
            <Segmented size="sm" className="mb-3" options={[{ value: 'front', label: 'Frente' }, { value: 'back', label: 'Dorso' }]} value={side} onChange={setSide} />
            <PhoneSketch
              side={side}
              variant={phoneVariant(product.model)}
              marks={diag.marks}
              active={active}
              onSelect={setActive}
              onPlace={pos => {
                const m = { id: uid(), side, ...pos, title: '', note: '', media_id: null };
                set({ marks: [...diag.marks, m] });
                setActive(m.id);
              }}
            />
          </div>

          <div className="space-y-3">
            {diag.marks.length === 0 && <p className="neu-inset rounded-2xl p-4 text-sm text-muted">Sin detalles marcados. Si el equipo está impecable, dejalo así.</p>}
            {diag.marks.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActive(m.id);
                  setSide(m.side);
                }}
                className={cn('flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm', active === m.id ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/8')}
              >
                <MapPin size={15} className="text-amber-400" /> {i + 1}. {m.title || 'Sin título'} <span className="ml-auto text-xs text-muted">{m.side === 'back' ? 'Dorso' : 'Frente'}</span>
              </button>
            ))}

            {mark && (
              <div className="neu-inset space-y-3 rounded-2xl p-4">
                <div>
                  <label className="label" htmlFor="mk-title">¿Qué es?</label>
                  <input id="mk-title" className="field" value={mark.title} onChange={e => updateMark({ title: e.target.value })} placeholder="Ej: Rayón leve en el marco" autoFocus />
                </div>
                <div>
                  <label className="label" htmlFor="mk-note">Detalle (opcional)</label>
                  <input id="mk-note" className="field" value={mark.note ?? ''} onChange={e => updateMark({ note: e.target.value })} placeholder="Ej: solo se ve con luz directa" />
                </div>
                <div>
                  <span className="label">Video o foto del detalle</span>
                  <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                    {(product.media ?? []).map(md => (
                      <button
                        key={md.id ?? md.url}
                        type="button"
                        onClick={() => updateMark({ media_id: md.id })}
                        className={cn('relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2', mark.media_id === md.id ? 'border-amber-400' : 'border-transparent opacity-70')}
                      >
                        <MediaView item={md} />
                        {md.type === 'video' && <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-[9px]">VIDEO</span>}
                      </button>
                    ))}
                    <button type="button" onClick={() => fileRef.current?.click()} className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border-2 border-dashed border-white/20 text-muted" aria-label="Subir video o foto">
                      {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    </button>
                    <input ref={fileRef} type="file" accept="video/*,image/*" hidden onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
                  </div>
                </div>
                <div className="flex justify-between gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost !text-ios-red"
                    onClick={() => {
                      set({ marks: diag.marks.filter(m => m.id !== active) });
                      setActive(null);
                    }}
                  >
                    <Trash2 size={16} /> Quitar
                  </button>
                  <button type="button" className="btn btn-neu" onClick={() => setActive(null)}>
                    Listo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <button type="button" onClick={() => setPreview(p => !p)} className="btn btn-neu !text-sm">
          <Box size={16} /> {preview ? 'Ocultar vista 3D' : 'Ver cómo queda en 3D'}
        </button>
        {preview && (
          <div className="relative mt-3 h-[380px] overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_45%,#2a1858,#0b0818_70%)]">
            <Suspense fallback={<div className="grid h-full place-items-center text-sm text-muted">Cargando 3D…</div>}>
              <PhoneViewer className="absolute inset-0" color={phoneColor(product.color)} variant={phoneVariant(product.model)} marks={diag.marks} activeMark={active} onMark={m => setActive(m.id)} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
