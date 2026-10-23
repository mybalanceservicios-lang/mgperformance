import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CONDITIONS, STORE } from '@/config';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value, currency = STORE.currency) {
  if (value == null || value === '') return 'Consultar';
  const n = Number(value);
  const formatted = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n);
  return currency === 'USD' ? `US$ ${formatted}` : `$ ${formatted}`;
}

export function getCondition(id) {
  return CONDITIONS.find(c => c.id === id) ?? { id, label: id, short: id, hint: '', color: '#8a93a6' };
}

export function productTitle(p) {
  return [p.model, p.storage].filter(Boolean).join(' · ');
}

export function waLink(text) {
  return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function productUrl(p) {
  const base = window.location.href.split('#')[0];
  return `${base}#/producto/${p.id}`;
}

export function productLine(p, qty = 1) {
  const parts = [productTitle(p), p.color, getCondition(p.condition).label];
  if (p.battery != null && p.battery !== '') parts.push(`Batería ${p.battery}%`);
  return `${qty > 1 ? `${qty}x ` : ''}${parts.filter(Boolean).join(' · ')} — ${formatPrice(p.price)}`;
}

export function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
