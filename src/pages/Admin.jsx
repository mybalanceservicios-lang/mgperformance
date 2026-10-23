import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Eye,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  UploadCloud,
  X
} from 'lucide-react';
import { Logo } from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { BatteryIcon, batteryColor, ConditionBadge, Empty, InfoTip, MediaView, PhoneMock, Segmented, Switch } from '@/components/ui';
import { CONDITIONS, STATUSES, STORAGE_OPTIONS, STORE } from '@/config';
import { isDemo } from '@/lib/supabase';
import { deleteMedia, deleteProduct, getSession, resetDemo, saveProduct, signIn, signOut, uploadMedia } from '@/lib/store';
import { cn, formatPrice, getCondition } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

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
  media: []
};

/* ─────────────── Login ─────────────── */
function Login({ onDone }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <form onSubmit={submit} className="neu w-full max-w-sm p-7">
        <Logo />
        <h1 className="mt-7 text-2xl font-bold">Panel de carga</h1>
        <p className="mt-1 text-sm text-muted">Entrá para crear y editar publicaciones.</p>
        {isDemo && (
          <p className="mt-4 rounded-2xl bg-ios-orange/10 p-3 text-xs leading-relaxed text-ios-orange">
            Modo demo: la contraseña es <b>{STORE.demoAdminPassword}</b>. Lo que cargues se guarda solo en este navegador.
          </p>
        )}
        <div className="mt-6 space-y-4">
          {!isDemo && (
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" className="field" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="label" htmlFor="pass">Contraseña</label>
            <input id="pass" type="password" autoComplete="current-password" className="field" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-ios-red">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy && <Loader2 size={18} className="animate-spin" />} Entrar
          </button>
          <Link to="/" className="btn btn-ghost w-full">Volver a la tienda</Link>
        </div>
      </form>
    </main>
  );
}

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

function ProductForm({ initial, onClose, onSaved }) {
  const [p, setP] = useState(() => ({ ...EMPTY, ...initial }));
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

          <Step n={4} title="Publicación">
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

/* ─────────────── Listado ─────────────── */
export default function Admin({ products, reload }) {
  const [session, setSession] = useState(undefined);
  const [editing, setEditing] = useState(null); // null | {} | product
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [toast, setToast] = useState('');

  const refreshSession = useCallback(() => getSession().then(setSession), []);
  useEffect(() => {
    refreshSession();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [refreshSession]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter(
      p =>
        (tab === 'all' || p.status === tab) &&
        (!s || [p.model, p.storage, p.color].join(' ').toLowerCase().includes(s))
    );
  }, [products, q, tab]);

  if (session === undefined) return <div className="grid min-h-dvh place-items-center"><Loader2 className="animate-spin text-muted" /></div>;
  if (!session) return <Login onDone={refreshSession} />;

  if (editing)
    return (
      <div className="pt-6">
        <ProductForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(_, isNew) => {
            setEditing(null);
            reload();
            setToast(isNew ? 'Publicación creada' : 'Cambios guardados');
          }}
        />
      </div>
    );

  const quickStatus = async (p, status) => {
    await saveProduct({ ...p, status });
    reload();
  };
  const remove = async p => {
    if (!confirm(`¿Eliminar "${p.model} ${p.storage ?? ''}"? Se borran también sus fotos y videos.`)) return;
    await deleteProduct(p);
    reload();
    setToast('Publicación eliminada');
  };

  const counts = Object.fromEntries(STATUSES.map(s => [s.id, products.filter(p => p.status === s.id).length]));

  return (
    <main className="mx-auto max-w-6xl px-4 pt-6 pb-24">
      <header className="mb-8 flex items-center justify-between gap-3">
        <Logo />
        <div className="flex gap-2">
          <Link to="/" className="btn btn-neu !min-h-[42px] !px-3.5 !text-sm"><Eye size={16} /> <span className="hidden sm:inline">Ver tienda</span></Link>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              refreshSession();
            }}
            className="btn btn-neu !min-h-[42px] !px-3.5 !text-sm"
            aria-label="Salir"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {isDemo && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ios-orange/10 p-4 text-sm text-ios-orange">
          <span>
            <b>Modo demo.</b> Lo que cargues queda solo en este navegador. Conectá Supabase (ver README) para que lo vean todos.
          </span>
          <button type="button" onClick={() => confirm('¿Volver a los productos de ejemplo?') && resetDemo()} className="btn btn-ghost !text-ios-orange !text-sm">
            <RotateCcw size={15} /> Restaurar ejemplo
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Publicaciones</h1>
          <p className="text-sm text-muted">
            {counts.disponible} disponibles · {counts.reservado} reservados · {counts.vendido} vendidos
          </p>
        </div>
        <button type="button" onClick={() => setEditing({})} className="btn btn-primary !min-h-[50px] !px-5">
          <Plus size={20} /> Nueva publicación
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
          <input type="search" className="field !pl-10" placeholder="Buscar publicación…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <Segmented
          options={[{ value: 'all', label: 'Todas' }, ...STATUSES.map(s => ({ value: s.id, label: s.label }))]}
          value={tab}
          onChange={setTab}
          size="sm"
        />
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<Camera size={26} />}
          title={products.length ? 'No hay resultados' : 'Todavía no hay publicaciones'}
          text={products.length ? 'Probá con otra búsqueda.' : 'Creá la primera: subí fotos, completá los datos y listo.'}
          action={!products.length && <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={18} /> Crear publicación</button>}
        />
      ) : (
        <ul className="space-y-3">
          {list.map(p => (
            <li key={p.id} className="neu flex items-center gap-3 p-3 md:gap-4">
              <button type="button" onClick={() => setEditing(p)} className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[#0b0d12] md:h-24 md:w-20">
                {p.media?.[0] ? <MediaView item={p.media[0]} /> : <PhoneMock color={getCondition(p.condition).color} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{p.model}</span>
                  {p.featured && <Star size={14} className="shrink-0 fill-ios-orange text-ios-orange" />}
                </div>
                <div className="truncate text-sm text-muted">
                  {[p.storage, p.color, p.battery != null && `${p.battery}%`].filter(Boolean).join(' · ')}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="font-bold">{formatPrice(p.price)}</span>
                  <ConditionBadge condition={p.condition} className="hidden sm:inline-flex" />
                  <span className="text-xs text-faint">{p.media?.length ?? 0} archivos</span>
                </div>
              </div>
              <select
                value={p.status}
                onChange={e => quickStatus(p, e.target.value)}
                className="field !min-h-[40px] !w-auto !py-1.5 !text-sm hidden sm:block"
                aria-label="Cambiar estado"
                style={{ color: p.status === 'vendido' ? 'var(--red)' : p.status === 'reservado' ? 'var(--orange)' : 'var(--green)' }}
              >
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={() => setEditing(p)} className="icon-btn btn-neu !h-10 !w-10" aria-label="Editar"><Pencil size={16} /></button>
                <button type="button" onClick={() => remove(p)} className="icon-btn btn-neu !h-10 !w-10 text-ios-red" aria-label="Eliminar"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="glass fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
