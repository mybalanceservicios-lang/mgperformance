// Cotización del dólar blue para mostrar precios en pesos (por defecto el valor de COMPRA, ver config).
// Fuente principal: DolarApi (dolarapi.com, toma los datos de DolarHoy). Respaldo: Bluelytics.
// Se consulta al abrir la página y se actualiza sola cada 15 minutos.
import { useEffect, useState } from 'react';
import { STORE } from '@/config';

const KEY = 'mg_dolar_blue_v2';
const TTL = 15 * 60 * 1000;
let memo = null;
let inflight = null;
const listeners = new Set();

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

async function fetchRate() {
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares/blue', { cache: 'no-store' });
    const d = await r.json();
    if (d?.compra || d?.venta) return { venta: Number(d.venta), compra: Number(d.compra), updated: d.fechaActualizacion ?? new Date().toISOString(), source: 'DolarApi' };
  } catch { /* probamos el respaldo */ }
  const r = await fetch('https://api.bluelytics.com.ar/v2/latest', { cache: 'no-store' });
  const d = await r.json();
  return { venta: Number(d.blue.value_sell), compra: Number(d.blue.value_buy), updated: d.last_update ?? new Date().toISOString(), source: 'Bluelytics' };
}

export function loadDolar(force = false) {
  const cached = memo ?? readCache();
  if (!force && cached && Date.now() - cached.fetchedAt < TTL) {
    memo = cached;
    return Promise.resolve(cached);
  }
  if (inflight) return inflight;
  inflight = fetchRate()
    .then(rate => {
      memo = { ...rate, fetchedAt: Date.now() };
      try {
        localStorage.setItem(KEY, JSON.stringify(memo));
      } catch { /* sin almacenamiento */ }
      listeners.forEach(fn => fn(memo));
      return memo;
    })
    .catch(() => cached ?? null) // sin conexión: usamos la última conocida
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useDolar() {
  const [rate, setRate] = useState(() => memo ?? readCache());
  useEffect(() => {
    if (STORE.currency !== 'USD') return;
    listeners.add(setRate);
    loadDolar().then(r => r && setRate(r));
    const t = setInterval(() => loadDolar(true), TTL);
    return () => {
      listeners.delete(setRate);
      clearInterval(t);
    };
  }, []);
  return STORE.currency === 'USD' ? rate : null;
}

// Valor que se usa para convertir (compra o venta según config)
export function rateValue(rate) {
  return rate ? Number(rate[STORE.dolarField ?? 'compra']) || null : null;
}

// Precio en pesos redondeado para arriba (a $1.000 por defecto)
export function toPesos(usd, rate, round = STORE.pesosRound ?? 1000) {
  const v = rateValue(rate);
  if (!v || usd == null || usd === '') return null;
  return Math.ceil((Number(usd) * v) / round) * round;
}

export function formatARS(n) {
  if (n == null) return '';
  return `$ ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n)}`;
}
