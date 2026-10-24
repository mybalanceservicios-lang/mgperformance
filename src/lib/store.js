// Capa de datos: usa Supabase si está configurado; si no, guarda todo en el navegador (modo demo).
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { supabase, isDemo, BUCKET } from './supabase';
import { DEMO_PASSWORDS, DEMO_PRICES, DEMO_PRODUCTS, DEMO_PROFILES, DEMO_SALES } from './demoData';
import { uid } from './utils';

const K = {
  products: 'mg_products_v3',
  prices: 'mg_prices_v3',
  sales: 'mg_sales_v3',
  profiles: 'mg_profiles_v3',
  session: 'mg_demo_user'
};
const DEFAULTS = { products: DEMO_PRODUCTS, prices: DEMO_PRICES, sales: DEMO_SALES, profiles: DEMO_PROFILES };

const FIELDS = ['model', 'storage', 'color', 'condition', 'battery', 'price', 'compare_price', 'description', 'includes', 'warranty', 'status', 'featured', 'media', 'stock', 'diagnostics'];

function clean(p) {
  const out = {};
  for (const f of FIELDS) if (p[f] !== undefined) out[f] = p[f];
  for (const n of ['battery', 'price', 'compare_price', 'stock']) {
    if (out[n] === '' || out[n] == null) out[n] = n === 'stock' ? 0 : null;
    else if (out[n] !== undefined) out[n] = Number(out[n]);
  }
  // el estado sigue al stock: sin unidades = vendido; si vuelve a haber, disponible
  if (out.stock === 0) out.status = 'vendido';
  else if (out.stock > 0 && out.status === 'vendido') out.status = 'disponible';
  return out;
}

/* ---------- demo (localStorage) ---------- */
function read(key) {
  try {
    const raw = localStorage.getItem(K[key]);
    if (raw) return JSON.parse(raw);
  } catch { /* vacío */ }
  return structuredClone(DEFAULTS[key]);
}
function write(key, value) {
  localStorage.setItem(K[key], JSON.stringify(value));
  window.dispatchEvent(new Event(key === 'products' ? 'mg:products' : 'mg:data'));
}
function notify() {
  window.dispatchEvent(new Event('mg:products'));
  window.dispatchEvent(new Event('mg:data'));
}
const demoUser = () => read('profiles').find(p => p.id === sessionStorage.getItem(K.session)) ?? null;

/* ═════════════ Productos ═════════════ */
export async function listProducts() {
  if (isDemo) return read('products');
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveProduct(product) {
  const body = clean(product);
  if (isDemo) {
    const list = read('products');
    if (product.id) {
      write('products', list.map(p => (p.id === product.id ? { ...p, ...body } : p)));
      return { ...product, ...body };
    }
    const created = { id: uid(), created_at: new Date().toISOString(), created_by: demoUser()?.id, ...body };
    write('products', [created, ...list]);
    return created;
  }
  const query = product.id
    ? supabase.from('products').update(body).eq('id', product.id)
    : supabase.from('products').insert(body);
  const { data, error } = await query.select().single();
  if (error) throw error;
  notify();
  return data;
}

export async function deleteProduct(product) {
  await Promise.allSettled((product.media ?? []).map(m => deleteMedia(m)));
  if (isDemo) {
    write('products', read('products').filter(p => p.id !== product.id));
    return;
  }
  const { error } = await supabase.from('products').delete().eq('id', product.id);
  if (error) throw error;
  notify();
}

/* ═════════════ Precio a rendir (privado) ═════════════ */
export async function listOwnerPrices() {
  if (isDemo) return read('prices');
  const { data, error } = await supabase.from('product_prices').select('product_id, owner_price');
  if (error) throw error;
  return Object.fromEntries(data.map(r => [r.product_id, r.owner_price]));
}

export async function setOwnerPrice(productId, value) {
  const v = value === '' || value == null ? null : Number(value);
  if (isDemo) {
    write('prices', { ...read('prices'), [productId]: v });
    return;
  }
  const { error } = await supabase
    .from('product_prices')
    .upsert({ product_id: productId, owner_price: v, updated_at: new Date().toISOString() });
  if (error) throw error;
  notify();
}

/* ═════════════ Ventas ═════════════ */
export async function listSales() {
  if (isDemo) {
    const me = demoUser();
    const all = read('sales');
    return me?.role === 'owner' ? all : all.filter(s => s.employee_id === me?.id);
  }
  const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(2000);
  if (error) throw error;
  return data;
}

export async function createSale(sale) {
  const body = {
    product_id: sale.product_id,
    qty: Number(sale.qty) || 1,
    unit_price: Number(sale.unit_price),
    payment_method: sale.payment_method || null,
    customer: sale.customer || null,
    notes: sale.notes || null
  };
  if (isDemo) {
    const me = demoUser();
    const products = read('products');
    const p = products.find(x => x.id === body.product_id);
    if (!p) throw new Error('El producto no existe');
    if ((p.stock ?? 0) < body.qty) throw new Error(`Stock insuficiente: quedan ${p.stock ?? 0} unidades`);
    const created = {
      id: uid(),
      created_at: new Date().toISOString(),
      employee_id: me.role === 'owner' && sale.employee_id ? sale.employee_id : me.id,
      product_label: [p.model, p.storage, p.color].filter(Boolean).join(' · '),
      owner_price: read('prices')[p.id] ?? 0,
      settled: false,
      settled_at: null,
      ...body
    };
    const stock = p.stock - body.qty;
    write('products', products.map(x => (x.id === p.id ? { ...x, stock, status: stock === 0 ? 'vendido' : x.status } : x)));
    write('sales', [created, ...read('sales')]);
    return created;
  }
  if (sale.employee_id) body.employee_id = sale.employee_id; // solo el dueño puede asignar otro vendedor
  const { data, error } = await supabase.from('sales').insert(body).select().single();
  if (error) throw new Error(error.message);
  notify();
  return data;
}

export async function deleteSale(sale) {
  if (isDemo) {
    write('sales', read('sales').filter(s => s.id !== sale.id));
    write(
      'products',
      read('products').map(p =>
        p.id === sale.product_id ? { ...p, stock: (p.stock ?? 0) + sale.qty, status: p.status === 'vendido' ? 'disponible' : p.status } : p
      )
    );
    return;
  }
  const { error } = await supabase.from('sales').delete().eq('id', sale.id);
  if (error) throw error;
  notify();
}

export async function setSettled(ids, settled = true) {
  const settled_at = settled ? new Date().toISOString() : null;
  if (isDemo) {
    const set = new Set(ids);
    write('sales', read('sales').map(s => (set.has(s.id) ? { ...s, settled, settled_at } : s)));
    return;
  }
  const { error } = await supabase.from('sales').update({ settled, settled_at }).in('id', ids);
  if (error) throw error;
  notify();
}

/* ═════════════ Equipo ═════════════ */
export async function listProfiles() {
  if (isDemo) return read('profiles');
  const { data, error } = await supabase.from('profiles').select('*').order('created_at');
  if (error) throw error;
  return data;
}

export async function updateProfile(id, patch) {
  if (isDemo) {
    write('profiles', read('profiles').map(p => (p.id === id ? { ...p, ...patch } : p)));
    return;
  }
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw error;
  notify();
}

export async function addDemoEmployee(name) {
  write('profiles', [...read('profiles'), { id: uid(), name, email: '', role: 'employee', active: true }]);
}

/* ═════════════ Fotos y videos ═════════════ */
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

/* ═════════════ Acceso ═════════════ */
// Devuelve el perfil del usuario logueado (con rol) o null.
export async function getMe() {
  if (isDemo) return demoUser();
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return profile ?? { id: user.id, email: user.email, name: user.email, role: 'employee', active: false };
}

// En modo demo "who" es el id del perfil; con Supabase es el email.
export async function signIn(who, password) {
  if (isDemo) {
    const profile = read('profiles').find(p => p.id === who);
    if (!profile) throw new Error('Elegí un usuario');
    if (password !== DEMO_PASSWORDS[profile.role]) throw new Error('Contraseña incorrecta');
    sessionStorage.setItem(K.session, profile.id);
    return;
  }
  const { error } = await supabase.auth.signInWithPassword({ email: who, password });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message);
}

export async function signUp(name, email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: window.location.href.split('#')[0] } });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  if (isDemo) return sessionStorage.removeItem(K.session);
  await supabase.auth.signOut();
}

export function demoProfiles() {
  return read('profiles');
}

export function resetDemo() {
  for (const k of ['products', 'prices', 'sales', 'profiles']) localStorage.removeItem(K[k]);
  notify();
}
