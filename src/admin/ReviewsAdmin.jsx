import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Plus, Star, Trash2 } from 'lucide-react';
import { Empty, MediaView, Switch } from '@/components/ui';
import { deleteRow, saveRow, uploadMedia } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Card, PageHeader } from './kit';

export default function ReviewsAdmin({ reviews, notify }) {
  const [f, setF] = useState({ name: '', text: '', rating: 5, model: '', photo_url: '' });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const set = patch => setF(p => ({ ...p, ...patch }));

  const add = async e => {
    e.preventDefault();
    if (!f.name.trim() || !f.text.trim()) return notify('Poné el nombre y el comentario');
    setBusy(true);
    try {
      await saveRow('reviews', { ...f, name: f.name.trim(), text: f.text.trim(), active: true });
      setF({ name: '', text: '', rating: 5, model: '', photo_url: '' });
      notify('Reseña publicada');
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Reseñas" subtitle="Comentarios reales de clientes (por ejemplo, los que te etiquetan en Instagram). Se muestran en la tienda." />
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card title="Nueva reseña">
          <form onSubmit={add} className="space-y-4">
            <div>
              <label className="label" htmlFor="rv-name">Nombre del cliente *</label>
              <input id="rv-name" className="field" value={f.name} onChange={e => set({ name: e.target.value })} placeholder="Ej: Caro G." />
            </div>
            <div>
              <label className="label" htmlFor="rv-text">Qué dijo *</label>
              <textarea id="rv-text" rows={3} className="field resize-none" value={f.text} onChange={e => set({ text: e.target.value })} placeholder="Copiá el comentario tal cual" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="label">Estrellas</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => set({ rating: n })} aria-label={`${n} estrellas`}>
                      <Star size={22} className="text-amber-400" fill={n <= f.rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="rv-model">Qué compró</label>
                <input id="rv-model" className="field" value={f.model} onChange={e => set({ model: e.target.value })} placeholder="iPhone 14" />
              </div>
            </div>
            <div>
              <span className="label">Foto (opcional)</span>
              <button type="button" onClick={() => fileRef.current?.click()} className={cn('grid h-28 w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-white/15 text-sm text-muted', f.photo_url && 'border-solid')}>
                {uploading ? <Loader2 className="animate-spin" /> : f.photo_url ? <MediaView item={{ type: 'image', url: f.photo_url }} /> : <span className="flex items-center gap-2"><ImagePlus size={18} /> Subir captura o foto</span>}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={async e => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  setUploading(true);
                  try {
                    const item = await uploadMedia(file);
                    set({ photo_url: item.url });
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </div>
            <button className="btn btn-primary w-full" disabled={busy}>
              <Plus size={18} /> Publicar reseña
            </button>
          </form>
        </Card>

        <Card title={`Publicadas (${reviews.length})`}>
          {reviews.length === 0 ? (
            <Empty icon={<Star size={24} />} title="Todavía no hay reseñas" text="Mientras no cargues ninguna, la sección no aparece en la tienda." />
          ) : (
            <ul className="space-y-2.5">
              {reviews.map(r => (
                <li key={r.id} className="neu-sm flex items-start gap-3 p-3">
                  {r.photo_url ? (
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <MediaView item={{ type: 'image', url: r.photo_url }} />
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.name}</span>
                      <span className="flex text-amber-400">
                        {Array.from({ length: r.rating ?? 5 }).map((_, i) => (
                          <Star key={i} size={11} fill="currentColor" />
                        ))}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted">{r.text}</p>
                  </div>
                  <Switch checked={r.active !== false} onChange={async v => { await saveRow('reviews', { id: r.id, active: v }); notify(v ? 'Visible en la tienda' : 'Oculta'); }} label="Visible" />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('¿Borrar esta reseña?')) return;
                      await deleteRow('reviews', r);
                      notify('Reseña borrada');
                    }}
                    className="grid h-9 w-9 place-items-center rounded-xl text-faint hover:text-ios-red"
                    aria-label="Borrar"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
