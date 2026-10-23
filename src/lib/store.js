// Capa de datos: usa Supabase si está configurado; si no, guarda todo en el navegador (modo demo).
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { supabase, isDemo, BUCKET } from './supabase';
import { DEMO_PRODUCTS } from './demoData';
import { STORE } from '@/config';
import { uid } from './utils';

const LS_KEY = 'mg_products_v1';
const LS_ADMIN = 'mg_demo_admin';

const FIELDS = ['model', 'storage', 'color', 'condition', 'battery', 'price', 'compare_price', 'description', 'includes', 'warranty', 'status', 'featured', 'media'];

function clean(p) {
  const out = {};
  for (const f of FIELDS) if (p[f] !== undefined) out[f] = p[f];
  for (const n of ['battery', 'price', 'compare_price']) {
    if (out[n] === '' || out[n] == null) out[n] = null;
    else if (out[n] !== undefined) out[n] = Number(out[n]);
  }
  return out;
}

/* ---------- demo (localStorage) ---------- */
function demoRead() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* vacío */ }
  return DEMO_PRODUCTS;
}
function demoWrite(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('mg:products'));
}

/* ---------- productos ---------- */
export async function listProducts() {
  if (isDemo) return demoRead();
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProduct(id) {
  if (isDemo) return demoRead().find(p => p.id === id) ?? null;
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProduct(product) {
  const body = clean(product);
  if (isDemo) {
    const list = demoRead();
    if (product.id) {
      demoWrite(list.map(p => (p.id === product.id ? { ...p, ...body } : p)));
      return { ...product, ...body };
    }
    const created = { id: uid(), created_at: new Date().toISOString(), ...body };
    demoWrite([created, ...list]);
    return created;
  }
  if (product.id) {
    const { data, error } = await supabase.from('products').update(body).eq('id', product.id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from('products').insert(body).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(product) {
  await Promise.allSettled((product.media ?? []).map(m => deleteMedia(m)));
  if (isDemo) {
    demoWrite(demoRead().filter(p => p.id !== product.id));
    return;
  }
  const { error } = await supabase.from('products').delete().eq('id', product.id);
  if (error) throw error;
}

/* ---------- fotos y videos ---------- */
const MAX_IMAGE_SIDE = 1800;

// Achica y convierte fotos a WebP antes de subir (ahorra espacio y carga más rápido).
async function compressImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/webp', 0.86));
    return blob && blob.size < file.size ? new File([blob], 'foto.webp', { type: 'image/webp' }) : file;
  } catch {
    return file;
  }
}

export async function uploadMedia(file) {
  const type = file.type.startsWith('video/') ? 'video' : 'image';
  const ready = type === 'image' ? await compressImage(file) : file;
  const ext = (ready.name.split('.').pop() || (type === 'video' ? 'mp4' : 'webp')).toLowerCase();
  const id = uid();
  if (isDemo) {
    await idbSet(`media:${id}`, ready);
    return { id, type, url: `idb://${id}`, path: id };
  }
  const path = `products/${id}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, ready, {
    cacheControl: '31536000',
    contentType: ready.type || undefined
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { id, type, url: data.publicUrl, path };
}

export async function deleteMedia(item) {
  if (!item?.path) return;
  if (isDemo) return idbDel(`media:${item.path}`);
  await supabase.storage.from(BUCKET).remove([item.path]);
}

const blobCache = new Map();
export async function resolveMediaUrl(url) {
  if (!url?.startsWith('idb://')) return url;
  if (blobCache.has(url)) return blobCache.get(url);
  const blob = await idbGet(`media:${url.slice(6)}`);
  const objectUrl = blob ? URL.createObjectURL(blob) : null;
  blobCache.set(url, objectUrl);
  return objectUrl;
}

/* ---------- acceso al panel ---------- */
export async function getSession() {
  if (isDemo) return sessionStorage.getItem(LS_ADMIN) ? { user: { email: 'demo' } } : null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signIn(email, password) {
  if (isDemo) {
    if (password !== STORE.demoAdminPassword) throw new Error('Contraseña incorrecta');
    sessionStorage.setItem(LS_ADMIN, '1');
    return;
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message);
}

export async function signOut() {
  if (isDemo) return sessionStorage.removeItem(LS_ADMIN);
  await supabase.auth.signOut();
}

export function resetDemo() {
  localStorage.removeItem(LS_KEY);
  window.dispatchEvent(new Event('mg:products'));
}
