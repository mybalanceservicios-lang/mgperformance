import { Eye, Star } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useReviews } from '@/lib/reviews';
import { MediaView } from './ui';
import InstagramIcon from './InstagramIcon';
import { STORE } from '@/config';

function Stars({ n = 5 }) {
  return (
    <span className="flex gap-0.5 text-amber-400" aria-label={`${n} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} fill={i < n ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

// Reseñas de muestra SOLO para ver el diseño: aparecen únicamente entrando con ?vista=resenas
// (el público no las ve). Las reales se cargan desde el sistema: Inventario → Reseñas.
const PREVIEW = [
  { id: 'p1', name: 'Agustina R.', rating: 5, model: 'iPhone 15 Pro', text: 'Impecable el equipo, tal cual las fotos. Me tomaron mi 12 en parte de pago y me explicaron todo con mucha paciencia.' },
  { id: 'p2', name: 'Martín G.', rating: 5, model: 'iPhone 14', text: 'La batería estaba en 91% como decía la publicación. Rápidos para responder por WhatsApp y súper confiables.' },
  { id: 'p3', name: 'Lucía F.', rating: 5, model: 'iPhone 16 Pro Max', text: 'Nuevo sellado y con garantía. El precio en pesos estaba actualizado al blue del día, sin sorpresas.' },
  { id: 'p4', name: 'Nicolás P.', rating: 4, model: 'iPhone 13', text: 'Muy buena atención. Tenía un detalle mínimo en el marco pero estaba marcado en el diagnóstico 3D, así que sabía lo que compraba.' },
  { id: 'p5', name: 'Sofía M.', rating: 5, model: 'iPhone 15', text: 'Coordinamos la entrega en el día. Me ayudaron a pasar todo del celular viejo al nuevo.' },
  { id: 'p6', name: 'Joaquín L.', rating: 5, model: 'iPhone 14 Pro', text: 'Segunda vez que compro. Siempre equipos en excelente estado y te mandan videos antes de ir.' }
];

export default function Reviews() {
  const [params] = useSearchParams();
  const preview = params.get('vista') === 'resenas';
  const real = useReviews();
  const reviews = preview ? PREVIEW : real;
  if (!reviews.length) return null;
  const avg = reviews.reduce((s, r) => s + (r.rating ?? 5), 0) / reviews.length;

  return (
    <section id="resenas" className="mx-auto max-w-7xl px-4 pt-14">
      {preview && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-200">
          <Eye size={16} className="mt-0.5 shrink-0" />
          Vista previa con reseñas de muestra para ver el diseño. Solo se ven con este link; el público ve únicamente las reseñas reales cargadas en el sistema.
        </div>
      )}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Opiniones de clientes</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-white/60">
            <span className="text-lg font-semibold text-white">{avg.toFixed(1)}</span> <Stars n={Math.round(avg)} /> · {reviews.length} opiniones
          </p>
        </div>
        <a href={`https://instagram.com/${STORE.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200">
          <InstagramIcon size={16} /> Ver más en Instagram
        </a>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {reviews.map(r => (
          <article key={r.id} className="ml-card w-[290px] shrink-0 snap-start sm:w-[320px]">
            {r.photo_url && (
              <div className="aspect-[4/3] overflow-hidden bg-black/40">
                <MediaView item={{ type: 'image', url: r.photo_url }} />
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <Stars n={r.rating ?? 5} />
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-white/85">“{r.text}”</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-bold">
                  {r.name?.trim()[0]?.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{r.name}</div>
                  {r.model && <div className="truncate text-xs text-white/50">Compró {r.model}</div>}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
