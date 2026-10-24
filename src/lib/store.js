// Capa de datos: usa Supabase si está configurado; si no, guarda todo en el navegador (modo demo).
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { supabase, isDemo, BUCKET } from './supabase';
import { DEMO_ADS, DEMO_CLIENTS, DEMO_PINS, DEMO_PRICES, DEMO_PRODUCTS, DEMO_PROFILES, DEMO_PURCHASES, DEMO_REMINDERS, DEMO_REVIEWS, DEMO_SALES } from './demoData';
import { uid } from './utils';

const K = {
  products: 'mg_products_v3',
  prices: 'mg_prices_v3',
  sales: 'mg_sales_v4',
  profiles: 'mg_profiles_v4',
  pins: 'mg_pins_v4',
  clients: 'mg_clients_v4',
  reminders: 'mg_reminders_v4',
  ads: 'mg_ads_v4',
  purchases: 'mg_purchases_v4',
  reviews: 'mg_reviews_v4',
  session: 'mg_demo_user'
};
const DEFAULTS = {
  products: DEMO_PRODUCTS,
  prices: DEMO_PRICES,
  sales: DEMO_SALES,
  profiles: DEMO_PROFILES,
  pins: DEMO_PINS,
  clients: DEMO_CLIENTS,
  reminders: DEMO_REMINDERS,
  ads: DEMO_ADS,
  purchases: DEMO_PURCHASES,
  reviews: DEMO_REVIEWS
};
const STAFF_DOMAIN = 'staff.mgperformance.app';
const pinPassword = pin => `mg-${pin}-pin`;

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
    notes: sale.notes || null,
    client_id: sale.client_id || null
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

/* ═════════════ Tablas simples (clientes, calendario, publicidad, inversión, reseñas) ═════════════ */
// Con Supabase, la seguridad (quién ve qué) la resuelven las reglas RLS de la base.
const TABLES = { clients: 'clients', reminders: 'reminders', ads: 'ad_expenses', purchases: 'purchases', reviews: 'reviews' };
const OWNED = new Set(['clients', 'reminders']); // filas que pertenecen a cada vendedor

export async function listRows(kind, { all = false } = {}) {
  if (isDemo) {
    const me = demoUser();
    const rows = read(kind);
    if (OWNED.has(kind) && !(all && me?.role === 'owner')) return rows.filter(r => r.employee_id === me?.id);
    return rows;
  }
  let q = supabase.from(TABLES[kind]).select('*');
  if (OWNED.has(kind) && !all) {
    const { data } = await supabase.auth.getUser();
    q = q.eq('employee_id', data.user?.id);
  }
  const { data, error } = await q.order('created_at', { ascending: false }).limit(3000);
  if (error) throw error;
  return data;
}

export async function saveRow(kind, row) {
  const body = Object.fromEntries(Object.entries(row).filter(([k, v]) => k !== 'id' && v !== undefined).map(([k, v]) => [k, v === '' ? null : v]));
  if (isDemo) {
    const rows = read(kind);
    if (row.id) {
      write(kind, rows.map(r => (r.id === row.id ? { ...r, ...body } : r)));
      return { ...row, ...body };
    }
    const created = { id: uid(), created_at: new Date().toISOString(), ...(OWNED.has(kind) ? { employee_id: demoUser()?.id } : {}), ...body };
    write(kind, [created, ...rows]);
    return created;
  }
  const q = row.id ? supabase.from(TABLES[kind]).update(body).eq('id', row.id) : supabase.from(TABLES[kind]).insert(body);
  const { data, error } = await q.select().single();
  if (error) throw new Error(error.message);
  window.dispatchEvent(new Event('mg:data'));
  return data;
}

export async function deleteRow(kind, row) {
  if (isDemo) {
    write(kind, read(kind).filter(r => r.id !== row.id));
    return;
  }
  const { error } = await supabase.from(TABLES[kind]).delete().eq('id', row.id);
  if (error) throw new Error(error.message);
  window.dispatchEvent(new Event('mg:data'));
}

/* ═════════════ Acceso con cuadraditos + clave de 4 números ═════════════ */
export async function listStaff() {
  if (isDemo) return read('profiles').filter(p => p.active).sort((a, b) => a.sort - b.sort);
  const { data, error } = await supabase.from('staff_directory').select('*').order('sort');
  if (error) throw error;
  return data;
}

// Devuelve el perfil del usuario logueado (con rol) o null.
export async function getMe() {
  if (isDemo) return demoUser();
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return profile ?? { id: user.id, email: user.email, name: user.email, role: 'employee', active: false };
}

export async function signInPin(slug, pin) {
  if (isDemo) {
    if (read('pins')[slug] !== pin) throw new Error('Clave incorrecta');
    sessionStorage.setItem(K.session, read('profiles').find(p => p.slug === slug)?.id);
    return;
  }
  const { error } = await supabase.auth.signInWithPassword({ email: `${slug}@${STAFF_DOMAIN}`, password: pinPassword(pin) });
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Clave incorrecta' : error.message);
}

export async function signOut() {
  if (isDemo) return sessionStorage.removeItem(K.session);
  await supabase.auth.signOut();
}

export async function setPin(slug, pin) {
  if (!/^\d{4}$/.test(pin)) throw new Error('La clave tiene que ser de 4 números');
  if (isDemo) {
    write('pins', { ...read('pins'), [slug]: pin });
    return;
  }
  const { error } = await supabase.rpc('owner_set_pin', { p_slug: slug, p_pin: pin });
  if (error) throw new Error(error.message);
}

export async function upsertStaff({ slug, name, role, pin, sort = 10 }) {
  if (!/^\d{4}$/.test(pin)) throw new Error('La clave tiene que ser de 4 números');
  slug = slug.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  if (isDemo) {
    const profiles = read('profiles');
    const exists = profiles.find(p => p.slug === slug);
    write('profiles', exists ? profiles.map(p => (p.slug === slug ? { ...p, name, role, active: true } : p)) : [...profiles, { id: slug, slug, name, role, active: true, sort }]);
    write('pins', { ...read('pins'), [slug]: pin });
    return;
  }
  const { error } = await supabase.rpc('owner_upsert_staff', { p_slug: slug, p_name: name, p_role: role, p_pin: pin, p_sort: sort });
  if (error) throw new Error(error.message);
  window.dispatchEvent(new Event('mg:data'));
}

export function resetDemo() {
  for (const k of Object.keys(DEFAULTS)) localStorage.removeItem(K[k]);
  notify();
}
