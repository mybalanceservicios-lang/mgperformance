import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Eye, Loader2, Minus, Plus, UploadCloud, X } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { BatteryIcon, batteryColor, InfoTip, MediaView, Segmented, Switch } from '@/components/ui';
import { CONDITIONS, STATUSES, STORAGE_OPTIONS, STORE } from '@/config';
import { deleteMedia, saveProduct, setOwnerPrice, uploadMedia } from '@/lib/store';
import { cn, formatPrice } from '@/lib/utils';

const MODELS = [
  'iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone Air', 'iPhone 17',
  'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16', 'iPhone 16e',
  'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
  'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
  'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
  'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
  'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11', 'iPhone SE (3.ª gen)'
];
const INCLUDES = ['Caja', 'Cable', 'Cargador', 'Funda', 'Vidrio templado'];
const WARRANTIES = ['12 meses oficial Apple', '6 meses', '3 meses', '1 mes', 'Sin garantía'];
const MAX_VIDEO_MB = 50;

const EMPTY = {
  model: '',
  storage: '128GB',
  color: '',
  condition: 'usado-premium',
  battery: 90,
  price: '',
  compare_price: '',
  description: '',
  includes: [],
  warranty: '3 meses',
  status: 'disponible',
  featured: false,
  media: [],
  stock: 1
};

/* ─────────────── Carga de fotos y videos ─────────────── */
function MediaUploader({ media, onChange }) {
  const input = useRef(null);
  const [uploading, setUploading] = useState([]); // [{key, name}]
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const mediaRef = useRef(media);
  mediaRef.current = media;

  const handleFiles = async files => {
    setError('');
    const list = [...files].filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    const tooBig = list.filter(f => f.type.startsWith('video/') && f.size > MAX_VIDEO_MB * 1024 * 1024);
    if (tooBig.length) setError(`Algunos videos pesan más de ${MAX_VIDEO_MB}MB. Recortalos o exportalos en 1080p.`);
    const ok = list.filter(f => !tooBig.includes(f));
    const jobs = ok.map(f => ({ key: `${f.name}-${f.size}-${Math.random()}`, name: f.name, video: f.type.startsWith('video/') }));
    setUploading(u => [...u, ...jobs]);
    await Promise.all(
      ok.map(async (file, n) => {
        try {
          const item = await uploadMedia(file);
          onChange([...mediaRef.current, item]);
          mediaRef.current = [...mediaRef.current, item];
        } catch (e) {
          setError(`No se pudo subir ${file.name}: ${e.message}`);
        } finally {
          setUploading(u => u.filter(j => j.key !== jobs[n].key));
        }
      })
    );
  };

  const move = (i, d) => {
    const next = [...media];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = async i => {
    const item = media[i];
    onChange(media.filter((_, n) => n !== i));
    deleteMedia(item).catch(() => {});
  };

  return (
    <div>
      <div
        onDragOver={e => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        className={cn(
          'neu-inset flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed px-6 py-9 text-center transition',
          drag ? 'border-ios-blue bg-ios-blue/5' : 'border-white/10 hover:border-white/20'
        )}
      >
        <span className="neu-sm grid h-14 w-14 place-items-center rounded-2xl text-ios-blue">
          <UploadCloud size={26} />
        </span>
        <div className="font-semibold">Tocá para elegir o arrastrá acá</div>
        <div className="text-xs text-muted">
          Fotos (se optimizan solas) y videos de hasta {MAX_VIDEO_MB}MB. Desde el celu podés sacar la foto en el momento.
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={e => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {error && <p className="mt-2 text-sm text-ios-red">{error}</p>}

      {(media.length > 0 || uploading.length > 0) && (
        <>
          <p className="mt-4 mb-2 text-xs text-muted">
            La <b className="text-ink">primera</b> es la portada. Usá las flechas para cambiar el orden.
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            <AnimatePresence>
              {media.map((m, i) => (
                <motion.div
                  layout
                  key={m.id ?? m.url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="neu-sm group relative aspect-square overflow-hidden !rounded-2xl"
                >
                  <MediaView item={m} />
                  {i === 0 && <span className="chip absolute top-1.5 left-1.5 bg-ios-blue text-white">Portada</span>}
                  {m.type === 'video' && <span className="chip glass absolute bottom-1.5 left-1.5 text-ink">Video</span>}
                  <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="glass grid h-7 w-7 place-items-center rounded-full disabled:opacity-30" aria-label="Mover antes">
                      <ArrowLeft size={14} />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === media.length - 1} className="glass grid h-7 w-7 place-items-center rounded-full disabled:opacity-30" aria-label="Mover después">
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <button type="button" onClick={() => remove(i)} className="glass absolute top-1.5 right-1.5 grid h-7 w-7 place-items-center rounded-full text-ios-red" aria-label="Quitar">
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
              {uploading.map(u => (
                <motion.div
                  key={u.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="neu-inset grid aspect-square place-items-center !rounded-2xl text-center"
                >
                  <div>
                    <Loader2 size={22} className="mx-auto animate-spin text-ios-blue" />
                    <div className="mt-1.5 px-2 text-[10px] text-muted">{u.video ? 'Subiendo video…' : 'Optimizando…'}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────── Formulario ─────────────── */
function Step({ n, title, hint, children }) {
  return (
    <section className="neu p-5 md:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ios-blue text-sm font-bold text-white shadow-[0_6px_16px_-6px_var(--blue)]">
          {n}
        </span>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {hint && <p className="text-sm text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ProductForm({ initial, onClose, onSaved, isOwner, ownerPrice }) {
  const [p, setP] = useState(() => ({ ...EMPTY, ...initial }));
  const [rend, setRend] = useState(ownerPrice ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = patch => setP(prev => ({ ...prev, ...patch }));
  const isNew = !initial?.id;

  useEffect(() => {
    if (p.condition === 'nuevo' && p.battery !== 100) set({ battery: 100 });
  }, [p.condition]); // eslint-disable-line react-hooks/exhaustive-deps

  const missing = [!p.model && 'modelo', !p.price && 'precio'].filter(Boolean);

  const submit = async e => {
    e.preventDefault();
    if (missing.length) return setError(`Falta completar: ${missing.join(' y ')}.`);
    setBusy(true);
    setError('');
    try {
      const saved = await saveProduct(p);
      if (isOwner && String(rend) !== String(ownerPrice ?? '')) await setOwnerPrice(saved.id, rend);
      onSaved(saved, isNew);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const preview = { ...p, id: p.id ?? 'preview', price: p.price || null };

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl px-4 pb-32">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button type="button" onClick={onClose} className="btn btn-ghost !px-2">
          <ArrowLeft size={18} /> Publicaciones
        </button>
        <h1 className="text-xl font-bold">{isNew ? 'Nueva publicación' : 'Editar publicación'}</h1>
        <span className="w-24" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Step n={1} title="Fotos y videos" hint="Subí lo que sacaste del equipo: frente, dorso, bordes, pantalla encendida y la captura de batería.">
            <MediaUploader media={p.media} onChange={media => set({ media })} />
          </Step>

          <Step n={2} title="Datos del equipo">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="model">Modelo *</label>
                <input id="model" list="models" className="field" value={p.model} onChange={e => set({ model: e.target.value })} placeholder="Empezá a escribir: iPhone 15 Pro…" />
                <datalist id="models">{MODELS.map(m => <option key={m} value={m} />)}</datalist>
              </div>
              <div className="sm:col-span-2">
                <span className="label">Capacidad</span>
                <Segmented options={STORAGE_OPTIONS.map(s => ({ value: s, label: s }))} value={p.storage} onChange={v => set({ storage: v })} size="sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="color">Color</label>
                <input id="color" className="field" value={p.color} onChange={e => set({ color: e.target.value })} placeholder="Ej: Titanio natural" />
              </div>
            </div>

            <div className="mt-6">
              <span className="label">Condición — ¿en qué categoría va?</span>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {CONDITIONS.map(c => {
                  const on = p.condition === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set({ condition: c.id })}
                      className={cn(
                        'flex items-start gap-3 rounded-2xl p-3.5 text-left transition',
                        on ? 'shadow-[var(--neu-in)]' : 'neu-sm'
                      )}
                      style={on ? { background: `color-mix(in srgb, ${c.color} 10%, #0b0d12)` } : undefined}
                    >
                      <span
                        className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2"
                        style={{ borderColor: c.color }}
                      >
                        {on && <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold" style={{ color: on ? c.color : undefined }}>{c.label}</span>
                        <span className="block text-xs text-muted">{c.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="label !mb-0 flex items-center gap-1">
                  Condición de batería
                  <InfoTip title="¿Dónde la veo?">En el iPhone: Ajustes → Batería → Estado y carga → Capacidad máxima.</InfoTip>
                </span>
                <span className="flex items-center gap-2 text-lg font-bold" style={{ color: batteryColor(p.battery) }}>
                  <BatteryIcon value={p.battery} className="text-ink" /> {p.battery}%
                </span>
              </div>
              <input
                type="range"
                min={70}
                max={100}
                value={p.battery ?? 100}
                disabled={p.condition === 'nuevo'}
                onChange={e => set({ battery: Number(e.target.value) })}
                className="w-full accent-[var(--blue)]"
                aria-label="Condición de batería"
              />
              {p.condition === 'nuevo' && <p className="text-xs text-muted">Los equipos nuevos se publican con 100%.</p>}
            </div>
          </Step>

          <Step n={3} title="Precio y detalles" hint="El precio se muestra tal cual. El “precio anterior” aparece tachado (opcional, para ofertas).">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="price">Precio ({STORE.currency}) *</label>
                <input id="price" type="number" inputMode="numeric" min="0" className="field" value={p.price ?? ''} onChange={e => set({ price: e.target.value })} placeholder="Ej: 850" />
              </div>
              <div>
                <label className="label" htmlFor="cprice">Precio anterior (opcional)</label>
                <input id="cprice" type="number" inputMode="numeric" min="0" className="field" value={p.compare_price ?? ''} onChange={e => set({ compare_price: e.target.value })} placeholder="Ej: 920" />
              </div>
              <div>
                <span className="label flex items-center gap-1">
                  Unidades en stock
                  <InfoTip title="Stock">Cuántos equipos iguales tenés. Cada venta registrada descuenta uno; al llegar a 0 la publicación pasa sola a “Vendido”.</InfoTip>
                </span>
                <div className="neu-inset flex items-center justify-between rounded-2xl p-1.5">
                  <button type="button" className="icon-btn btn-neu !h-10 !w-10" onClick={() => set({ stock: Math.max(0, (Number(p.stock) || 0) - 1) })} aria-label="Restar unidad">
                    <Minus size={16} />
                  </button>
                  <span className="text-xl font-bold tabular-nums">{p.stock ?? 0}</span>
                  <button type="button" className="icon-btn btn-neu !h-10 !w-10" onClick={() => set({ stock: (Number(p.stock) || 0) + 1 })} aria-label="Sumar unidad">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {isOwner ? (
                <div>
                  <label className="label flex items-center gap-1" htmlFor="rend">
                    Precio a rendir ({STORE.currency})
                    <InfoTip title="Precio a rendir" align="right">Lo que el empleado te tiene que entregar por este equipo. Lo que venda por encima es su comisión. Solo lo ve el equipo, nunca el público.</InfoTip>
                  </label>
                  <input id="rend" type="number" inputMode="numeric" min="0" className="field" value={rend} onChange={e => setRend(e.target.value)} placeholder="Ej: 780" />
                </div>
              ) : (
                <div>
                  <span className="label">Precio a rendir</span>
                  <div className="neu-inset flex min-h-[46px] items-center rounded-2xl px-4 text-sm text-muted">
                    {ownerPrice != null ? formatPrice(ownerPrice) : 'Lo define el dueño'}
                  </div>
                </div>
              )}
              {isOwner && Number(rend) > 0 && Number(p.price) > 0 && (
                <div className="sm:col-span-2 rounded-2xl bg-ios-green/10 px-4 py-3 text-sm text-ios-green">
                  Si se vende al precio publicado, la comisión del empleado es <b>{formatPrice(Number(p.price) - Number(rend))}</b>.
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="label" htmlFor="warranty">Garantía</label>
                <input id="warranty" list="warranties" className="field" value={p.warranty ?? ''} onChange={e => set({ warranty: e.target.value })} />
                <datalist id="warranties">{WARRANTIES.map(w => <option key={w} value={w} />)}</datalist>
              </div>
              <div className="sm:col-span-2">
                <span className="label">¿Qué incluye?</span>
                <div className="flex flex-wrap gap-2">
                  {INCLUDES.map(x => {
                    const on = p.includes?.includes(x);
                    return (
                      <button
                        key={x}
                        type="button"
                        aria-pressed={on}
                        onClick={() => set({ includes: on ? p.includes.filter(i => i !== x) : [...(p.includes ?? []), x] })}
                        className={cn('btn btn-neu !min-h-[38px] !px-3.5 !text-sm', on && '!text-ios-green')}
                      >
                        {x}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="desc">Descripción (opcional)</label>
                <textarea id="desc" rows={3} className="field resize-y" value={p.description ?? ''} onChange={e => set({ description: e.target.value })} placeholder="Ej: Face ID perfecto, pantalla original, sin reparaciones. Leve marca en el borde inferior." />
              </div>
            </div>
          </Step>

          <Step n={4} title="Publicación" hint="El estado se actualiza solo con las ventas, pero podés cambiarlo a mano (ej: reservado).">
            <span className="label">Estado</span>
            <Segmented options={STATUSES.map(s => ({ value: s.id, label: s.label }))} value={p.status} onChange={v => set({ status: v })} />
            <p className="mt-2 text-xs text-muted">“Reservado” se sigue viendo con etiqueta. “Vendido” se oculta del catálogo (salvo que el cliente lo pida).</p>
            <div className="neu-inset mt-5 flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Destacado</div>
                <div className="text-xs text-muted">Aparece primero en el catálogo</div>
              </div>
              <Switch checked={!!p.featured} onChange={v => set({ featured: v })} label="Destacado" />
            </div>
          </Step>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <p className="label flex items-center gap-1.5"><Eye size={14} /> Así se va a ver</p>
            <div className="pointer-events-none">
              <ProductCard product={preview} />
            </div>
          </div>
        </aside>
      </div>

      <div className="glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <p className="hidden flex-1 text-sm text-muted sm:block">
            {error ? <span className="text-ios-red">{error}</span> : missing.length ? `Falta: ${missing.join(', ')}` : 'Todo listo para publicar ✓'}
          </p>
          <button type="button" onClick={onClose} className="btn btn-neu">Cancelar</button>
          <button className="btn btn-primary flex-1 sm:flex-none sm:px-8" disabled={busy}>
            {busy && <Loader2 size={18} className="animate-spin" />}
            {isNew ? 'Publicar' : 'Guardar cambios'}
          </button>
        </div>
        {error && <p className="mt-2 text-center text-sm text-ios-red sm:hidden">{error}</p>}
      </div>
    </form>
  );
}

