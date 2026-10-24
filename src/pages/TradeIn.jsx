import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, ChevronLeft, Loader2, RefreshCcw, ShieldCheck } from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { cardTitle } from '@/components/ListingCard';
import { STORE, TRADE_IN } from '@/config';
import { createLead, listTradeIn } from '@/lib/store';
import { formatARS, toPesos, useDolar } from '@/lib/dolar';
import { cn, formatPrice, waLink } from '@/lib/utils';

const OTHER = '__otro__';

function Option({ active, onClick, title, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('rounded-lg border px-3.5 py-2.5 text-left transition', active ? 'border-violet-400 bg-violet-500/15' : 'border-white/10 hover:border-white/25')}
    >
      <span className="block text-sm font-semibold">{title}</span>
      {hint && <span className="block text-xs text-white/50">{hint}</span>}
    </button>
  );
}

function Step({ n, title, children, done }) {
  return (
    <section className="border-t border-white/6 py-5 first:border-t-0 first:pt-0">
      <h2 className="mb-3 flex items-center gap-2.5 font-semibold">
        <span className={cn('grid h-6 w-6 place-items-center rounded-full text-xs font-bold', done ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/70')}>
          {done ? <Check size={14} strokeWidth={3} /> : n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function TradeIn({ products }) {
  const [params] = useSearchParams();
  const target = products.find(p => p.id === params.get('para'));
  const [prices, setPrices] = useState(null);
  const [model, setModel] = useState('');
  const [otherModel, setOtherModel] = useState('');
  const [storage, setStorage] = useState('');
  const [battery, setBattery] = useState('');
  const [condition, setCondition] = useState('');
  const [fault, setFault] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rate = useDolar();

  useEffect(() => {
    window.scrollTo(0, 0);
    listTradeIn().then(setPrices);
  }, []);

  const models = useMemo(() => {
    const list = [...new Set((prices ?? []).map(p => p.model))];
    return list.sort((a, b) => (parseInt(b.replace(/\D/g, '')) || 0) - (parseInt(a.replace(/\D/g, '')) || 0) || a.localeCompare(b));
  }, [prices]);
  const storages = (prices ?? []).filter(p => p.model === model);
  useEffect(() => {
    setStorage(storages.length === 1 ? storages[0].storage : '');
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  const base = storages.find(p => p.storage === storage)?.value;
  const cond = TRADE_IN.conditions.find(c => c.id === condition);
  const bat = TRADE_IN.battery.find(b => b.id === battery);
  const ready = model && model !== OTHER && base && cond && bat && fault !== null;
  const estimate = ready ? base * cond.factor * bat.factor * (fault ? TRADE_IN.faultFactor : 1) : null;
  const min = estimate ? Math.floor((estimate * (1 - TRADE_IN.spread)) / 5) * 5 : null;
  const max = estimate ? Math.ceil((estimate * (1 + TRADE_IN.spread)) / 5) * 5 : null;
  const isOther = model === OTHER;

  const send = () => {
    setError('');
    if (!name.trim() || phone.replace(/\D/g, '').length < 8) return setError('Dejanos tu nombre y tu WhatsApp para pasarte la cotización');
    const modelText = isOther ? otherModel.trim() : model;
    if (!modelText) return setError('Elegí o escribí el modelo');
    // se registra en "Interesados" en paralelo (no bloquea la apertura de WhatsApp)
    setBusy(true);
    createLead({
      kind: 'cotizacion',
      name,
      phone,
      model: modelText,
      storage,
      estimate_min: min,
      estimate_max: max,
      details: { battery: bat?.label ?? null, condition: cond?.label ?? null, fault: fault === null ? null : !!fault, para: target ? cardTitle(target) : null }
    })
      .catch(() => {})
      .finally(() => setBusy(false));
    const lines = [
      `Hola ${STORE.name}! Quiero entregar mi celular en parte de pago.`,
      '',
      `• ${modelText}${storage ? ` ${storage}` : ''}`,
      bat && `• Batería: ${bat.label}`,
      cond && `• Estado: ${cond.label}`,
      fault !== null && `• ${fault ? 'Tiene alguna falla' : 'Funciona todo'}`,
      min && `• Cotización web: ${formatPrice(min)} a ${formatPrice(max)}`,
      target && `\nMe interesa: ${cardTitle(target)} (${formatPrice(target.price)})`,
      '',
      `Soy ${name.trim()}.`
    ].filter(Boolean);
    window.open(waLink(lines.join('\n')), '_blank');
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pt-20 pb-12">
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-violet-300 hover:text-violet-200">
        <ChevronLeft size={16} /> Volver
      </Link>
      <h1 className="text-3xl font-bold md:text-4xl">Cotizá tu usado</h1>
      <p className="mt-2 max-w-xl text-white/65">Contanos cómo está tu celular y te mostramos al instante cuánto te lo tomamos como parte de pago.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="ml-panel p-5 md:p-6">
          <Step n={1} title="¿Qué iPhone tenés?" done={!!model && (!isOther || otherModel)}>
            {!prices ? (
              <Loader2 className="animate-spin text-white/40" />
            ) : (
              <>
                <select value={model} onChange={e => setModel(e.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-[15px] outline-none focus:border-violet-400/60">
                  <option value="" className="bg-[#0e0a1c]">Elegí el modelo…</option>
                  {models.map(m => (
                    <option key={m} value={m} className="bg-[#0e0a1c]">
                      {m}
                    </option>
                  ))}
                  <option value={OTHER} className="bg-[#0e0a1c]">Otro modelo / otra marca</option>
                </select>
                {isOther && (
                  <input value={otherModel} onChange={e => setOtherModel(e.target.value)} placeholder="Ej: iPhone XR 64GB, Samsung S23…" className="mt-3 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-[15px] outline-none focus:border-violet-400/60" />
                )}
                {storages.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {storages.map(s => (
                      <button key={s.storage} type="button" onClick={() => setStorage(s.storage)} className={cn('rounded-full border px-4 py-1.5 text-sm', storage === s.storage ? 'border-violet-400 bg-violet-500/15' : 'border-white/10')}>
                        {s.storage}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </Step>

          {!isOther && (
            <>
              <Step n={2} title="¿Cómo está la batería?" done={!!battery}>
                <p className="mb-3 text-xs text-white/50">En el iPhone: Ajustes → Batería → Estado y carga.</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TRADE_IN.battery.map(b => (
                    <Option key={b.id} active={battery === b.id} onClick={() => setBattery(b.id)} title={b.label} />
                  ))}
                </div>
              </Step>
              <Step n={3} title="¿Cómo está por fuera?" done={!!condition}>
                <div className="grid grid-cols-2 gap-2">
                  {TRADE_IN.conditions.map(c => (
                    <Option key={c.id} active={condition === c.id} onClick={() => setCondition(c.id)} title={c.label} hint={c.hint} />
                  ))}
                </div>
              </Step>
              <Step n={4} title="¿Funciona todo? (Face ID, cámaras, carga, sonido)" done={fault !== null}>
                <div className="grid grid-cols-2 gap-2">
                  <Option active={fault === false} onClick={() => setFault(false)} title="Sí, todo funciona" />
                  <Option active={fault === true} onClick={() => setFault(true)} title="Tiene alguna falla" />
                </div>
              </Step>
            </>
          )}
        </div>

        {/* resultado */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="ml-panel p-5 md:p-6">
            <p className="text-sm text-white/55">{isOther ? 'Te lo cotizamos por WhatsApp' : 'Te lo tomamos entre'}</p>
            {ready ? (
              <motion.div key={`${min}-${max}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mt-1 text-3xl font-light tracking-tight">
                  {formatPrice(min)} <span className="text-white/40">a</span> {formatPrice(max)}
                </div>
                {toPesos(min, rate) && (
                  <div className="mt-1 text-sm text-white/55">
                    {formatARS(toPesos(min, rate))} a {formatARS(toPesos(max, rate))}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="mt-1 text-2xl text-white/30">{isOther ? 'Escribinos 👇' : 'Completá los pasos'}</div>
            )}

            {target && (
              <div className="mt-4 rounded-lg bg-white/5 p-3 text-sm">
                <div className="text-white/55">Para llevarte</div>
                <div className="font-semibold">{cardTitle(target)}</div>
                <div className="text-white/70">{formatPrice(target.price)}</div>
                {ready && (
                  <div className="mt-2 border-t border-white/10 pt-2">
                    Pagarías la diferencia: <b className="text-white">{formatPrice(Math.max(0, target.price - max))} a {formatPrice(Math.max(0, target.price - min))}</b>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 space-y-2.5">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-[15px] outline-none focus:border-violet-400/60" />
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="Tu WhatsApp (ej: 11 2345 6789)" className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-[15px] outline-none focus:border-violet-400/60" />
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button type="button" onClick={send} disabled={busy || (!ready && !isOther)} className="btn btn-ml w-full !min-h-[52px] text-base">
                {busy ? <Loader2 size={18} className="animate-spin" /> : <WhatsAppIcon className="h-5 w-5" />} Enviar cotización por WhatsApp
              </button>
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs text-white/45">
              <ShieldCheck size={14} className="mt-0.5 shrink-0" /> Valor estimado. Se confirma al revisar el equipo en persona.
            </p>
          </div>
          {!target && (
            <Link to="/#publicaciones" className="mt-3 flex items-center justify-center gap-2 text-sm text-violet-300 hover:text-violet-200">
              <RefreshCcw size={14} /> Ver iPhones para cambiar
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
