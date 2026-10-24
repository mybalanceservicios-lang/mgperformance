import { useMemo, useState } from 'react';
import { AlertTriangle, Check, ClipboardCopy, Loader2, Upload } from 'lucide-react';
import { CONDITIONS, STORE } from '@/config';
import { saveProduct, setOwnerPrice } from '@/lib/store';
import { cn, formatPrice, getCondition } from '@/lib/utils';
import { Card, PageHeader } from './kit';

const COLUMNS = ['Modelo', 'Capacidad', 'Color', 'Condición', 'Batería', 'Precio', 'Precio a rendir', 'Stock', 'Garantía', 'Detalles'];
const TEMPLATE = `${COLUMNS.join(' | ')}
iPhone 15 Pro | 256 | Titanio natural | Usado premium | 92 | 950 | 850 | 1 | 3 meses | Marco con un detalle mínimo
iPhone 14 | 128 | Azul | Usado | 86 | 520 | 460 | 1 | 3 meses |
iPhone 16 Pro Max | 256 | Titanio desierto | Nuevo | 100 | 1450 | 1320 | 2 | 12 meses oficial Apple | Caja sellada`;

function condition(text = '') {
  const t = text.toLowerCase();
  if (/sellad|nuevo(?!.*como)/.test(t) && !/como/.test(t)) return 'nuevo';
  if (/como nuevo|exhib|caja abierta/.test(t)) return 'como-nuevo';
  if (/premium|excelente|impecable|\ba\b/.test(t)) return 'usado-premium';
  if (/usado|\bb\b/.test(t)) return 'usado';
  return CONDITIONS.find(c => c.label.toLowerCase() === t || c.id === t)?.id ?? null;
}
function storage(text = '') {
  const n = text.toLowerCase().replace(/\s/g, '');
  if (/^1t/.test(n) || n === '1024' || n === '1024gb') return '1TB';
  const m = n.match(/\d+/);
  return m ? `${m[0]}GB` : '';
}
const num = t => {
  const n = Number(String(t ?? '').replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'));
  return Number.isFinite(n) && String(t ?? '').trim() !== '' ? n : null;
};

export function parseList(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const sep = lines[0].includes('\t') ? '\t' : lines[0].includes('|') ? '|' : ';';
  const rows = lines.map(l => l.split(sep).map(c => c.trim()));
  if (/modelo/i.test(rows[0][0])) rows.shift();
  return rows.map((c, i) => {
    let model = c[0] ?? '';
    if (model && !/^iphone/i.test(model)) model = `iPhone ${model}`;
    const p = {
      line: i + 1,
      model: model.replace(/\s+/g, ' ').replace(/^iphone/i, 'iPhone').replace(/pro max/i, 'Pro Max').replace(/\bpro\b/i, 'Pro').replace(/\bplus\b/i, 'Plus'),
      storage: storage(c[1]),
      color: c[2] ?? '',
      condition: condition(c[3]),
      battery: num(c[4]),
      price: num(c[5]),
      rend: num(c[6]),
      stock: num(c[7]) ?? 1,
      warranty: c[8] || '',
      description: c[9] || ''
    };
    if (p.condition === 'nuevo' && p.battery == null) p.battery = 100;
    p.errors = [!p.model && 'falta modelo', !p.storage && 'falta capacidad', !p.condition && 'condición no reconocida', !p.price && 'falta precio'].filter(Boolean);
    return p;
  });
}

export default function Import({ notify }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const rows = useMemo(() => parseList(text), [text]);
  const valid = rows.filter(r => !r.errors.length);

  const load = async () => {
    if (!valid.length) return;
    if (!confirm(`¿Cargar ${valid.length} equipos al inventario? Quedan publicados en la tienda (después les agregás fotos y videos).`)) return;
    setBusy(true);
    setDone(0);
    try {
      for (const r of valid) {
        const saved = await saveProduct({
          model: r.model,
          storage: r.storage,
          color: r.color,
          condition: r.condition,
          battery: r.battery,
          price: r.price,
          stock: r.stock,
          warranty: r.warranty,
          description: r.description,
          includes: r.condition === 'nuevo' ? ['Caja', 'Cable USB-C'] : [],
          status: 'disponible',
          featured: false,
          media: [],
          diagnostics: { checks: {}, marks: [] }
        });
        if (r.rend != null) await setOwnerPrice(saved.id, r.rend);
        setDone(n => n + 1);
      }
      notify(`${valid.length} equipos cargados ✓`);
      setText('');
    } catch (e) {
      notify(`Se cortó: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Cargar lista" subtitle="Pegá varios equipos juntos y se cargan de una. Después les sumás fotos, videos y el diagnóstico desde Inventario." />
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card
          title="1. Pegá la lista"
          action={
            <button
              type="button"
              className="btn btn-ghost !min-h-[32px] !text-xs"
              onClick={() => navigator.clipboard.writeText(TEMPLATE).then(() => notify('Plantilla copiada: pasásela a los chicos'))}
            >
              <ClipboardCopy size={14} /> Copiar plantilla
            </button>
          }
        >
          <p className="mb-3 text-sm text-muted">
            Una línea por equipo, en este orden (separado por <b>|</b>, punto y coma o columnas de Excel):
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {COLUMNS.map((c, i) => (
              <span key={c} className={cn('chip', i < 7 ? 'bg-violet-500/15 text-violet-200' : 'bg-white/5 text-muted')}>
                {i + 1}. {c}
                {i < 7 && ' *'}
              </span>
            ))}
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={12}
            className="field resize-y font-mono !text-[13px]"
            placeholder={TEMPLATE}
          />
          <p className="mt-2 text-xs text-faint">
            * obligatorios (el precio a rendir es tu lista de precios: con él se calculan las comisiones). Condición: Nuevo, Como nuevo, Usado premium o Usado. Precios en {STORE.currency}.
          </p>
        </Card>

        <Card title={`2. Revisá (${valid.length} de ${rows.length} listos)`}>
          {rows.length === 0 ? (
            <p className="text-sm text-muted">Acá vas a ver cada equipo antes de cargarlo.</p>
          ) : (
            <ul className="space-y-2">
              {rows.map(r => (
                <li key={r.line} className={cn('rounded-xl border p-3 text-sm', r.errors.length ? 'border-ios-red/40 bg-ios-red/5' : 'border-white/8')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">
                        {r.model || '—'} {r.storage} {r.color && `· ${r.color}`}
                      </div>
                      <div className="text-xs text-muted">
                        {r.condition ? getCondition(r.condition).label : '?'} · batería {r.battery ?? '—'}% · stock {r.stock}
                        {r.warranty && ` · ${r.warranty}`}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-bold">{r.price ? formatPrice(r.price) : '—'}</div>
                      <div className="text-xs text-muted">rinde {r.rend != null ? formatPrice(r.rend) : '—'}</div>
                    </div>
                  </div>
                  {r.errors.length > 0 ? (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-ios-red">
                      <AlertTriangle size={12} /> Línea {r.line}: {r.errors.join(', ')}
                    </p>
                  ) : r.rend == null ? (
                    <p className="mt-1.5 text-xs text-ios-orange">Sin precio a rendir: no se va a poder calcular la comisión.</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={load} disabled={!valid.length || busy} className="btn btn-primary mt-4 w-full">
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Cargando {done}/{valid.length}…
              </>
            ) : (
              <>
                {valid.length ? <Upload size={18} /> : <Check size={18} />} Cargar {valid.length} equipos
              </>
            )}
          </button>
        </Card>
      </div>
    </div>
  );
}
