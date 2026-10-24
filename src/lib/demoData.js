// Publicaciones de ejemplo (iPhones ficticios). Las imágenes y videos están en public/demo
// y se generaron con el iPhone 3D de la web. Se borran desde el panel cuando ya no sirvan.
const CHECKS_OK = { faceid: true, truetone: true, pantalla: true, camaras: true, audio: true, carga: true, botones: true, senal: true, sinreparar: true };

const RAW = [
  { slug: '16promax-desierto', model: 'iPhone 16 Pro Max', storage: '256GB', color: 'Titanio desierto', condition: 'nuevo', battery: 100, price: 1450, stock: 3, featured: true, includes: ['Caja', 'Cable USB-C'], warranty: '12 meses oficial Apple', video: true,
    description: 'Equipo nuevo, en caja sellada. Lo activás vos.', marks: [] },
  { slug: '16pro-negro', model: 'iPhone 16 Pro', storage: '128GB', color: 'Titanio negro', condition: 'como-nuevo', battery: 99, price: 1090, compare_price: 1180, featured: true, includes: ['Caja', 'Cable USB-C'], warranty: '6 meses',
    description: 'Usado 2 meses, siempre con funda y vidrio. Impecable.', marks: [] },
  { slug: '15promax-natural', model: 'iPhone 15 Pro Max', storage: '256GB', color: 'Titanio natural', condition: 'usado-premium', battery: 92, price: 920, featured: true, includes: ['Cable USB-C'], warranty: '3 meses', video: true,
    description: 'Excelente estado. Un detalle mínimo en el marco, mirá el diagnóstico 3D.',
    marks: [{ id: 'm1', side: 'back', x: 0.62, y: -0.86, title: 'Marca mínima en esquina inferior', note: 'Solo se ve con luz directa. No afecta el uso.' }] },
  { slug: '15-rosa', model: 'iPhone 15', storage: '128GB', color: 'Rosa', condition: 'como-nuevo', battery: 97, price: 640, includes: ['Caja', 'Cable USB-C'], warranty: '6 meses',
    description: 'Como nuevo, sin marcas de uso.', marks: [] },
  { slug: '14pro-morado', model: 'iPhone 14 Pro', storage: '256GB', color: 'Morado oscuro', condition: 'usado-premium', battery: 88, price: 610, includes: ['Cable'], warranty: '3 meses', video: true,
    description: 'Muy buen estado general. Batería 88%.',
    marks: [{ id: 'm1', side: 'front', x: -0.55, y: 0.78, title: 'Microrayón en pantalla', note: 'Arriba a la izquierda, no se nota con la pantalla encendida.' }] },
  { slug: '14-azul', model: 'iPhone 14', storage: '128GB', color: 'Azul', condition: 'usado', battery: 85, price: 430, includes: [], warranty: '3 meses',
    description: 'Funciona perfecto. Tiene marcas leves de uso en el dorso.',
    marks: [
      { id: 'm1', side: 'back', x: 0.2, y: -0.3, title: 'Rayones leves en el dorso', note: 'Marcas finas de uso diario.' },
      { id: 'm2', side: 'front', x: 0.7, y: -0.9, title: 'Golpe chico en el marco', note: 'Esquina inferior derecha.' }
    ] },
  { slug: '13promax-alpino', model: 'iPhone 13 Pro Max', storage: '512GB', color: 'Azul alpino', condition: 'usado-premium', battery: 90, price: 560, includes: ['Cable'], warranty: '3 meses',
    description: '512GB, ideal para fotos y video.', marks: [] },
  { slug: '13-estelar', model: 'iPhone 13', storage: '128GB', color: 'Blanco estelar', condition: 'usado', battery: 83, price: 340, includes: [], warranty: '3 meses', status: 'reservado',
    description: 'Buen estado. Batería 83%.', checks: { truetone: false },
    marks: [{ id: 'm1', side: 'back', x: -0.1, y: 0.1, title: 'Desgaste en el vidrio trasero', note: 'Marcas de uso visibles de cerca.' }] },
  { slug: '16e-negro', model: 'iPhone 16e', storage: '128GB', color: 'Negro', condition: 'nuevo', battery: 100, price: 690, stock: 2, includes: ['Caja', 'Cable USB-C'], warranty: '12 meses oficial Apple',
    description: 'Nuevo en caja sellada.', marks: [] },
  { slug: 'air-blanco', model: 'iPhone Air', storage: '256GB', color: 'Blanco', condition: 'como-nuevo', battery: 100, price: 1050, includes: ['Caja', 'Cable USB-C'], warranty: '6 meses',
    description: 'El más fino. Como nuevo.', marks: [] }
];

export const DEMO_RAW = RAW;

export const DEMO_PRODUCTS = RAW.map((p, i) => {
  const media = [
    { id: `${p.slug}-2`, type: 'image', url: `demo/${p.slug}-2.webp`, path: null },
    { id: `${p.slug}-1`, type: 'image', url: `demo/${p.slug}-1.webp`, path: null },
    { id: `${p.slug}-3`, type: 'image', url: `demo/${p.slug}-3.webp`, path: null }
  ];
  if (p.video) media.splice(1, 0, { id: `${p.slug}-v`, type: 'video', url: `demo/${p.slug}.mp4`, path: null });
  const videoId = p.video ? `${p.slug}-v` : `${p.slug}-2`;
  const isNew = p.condition === 'nuevo';
  return {
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    model: p.model,
    storage: p.storage,
    color: p.color,
    condition: p.condition,
    battery: p.battery,
    price: p.price,
    compare_price: p.compare_price ?? null,
    description: `${p.description}\n\n(Publicación de ejemplo)`,
    includes: p.includes,
    warranty: p.warranty,
    status: p.status ?? 'disponible',
    featured: !!p.featured,
    stock: p.stock ?? 1,
    media,
    diagnostics: {
      checks: isNew ? {} : { ...CHECKS_OK, ...(p.checks ?? {}) },
      marks: p.marks.map(m => ({ ...m, media_id: videoId }))
    }
  };
});

export const DEMO_PROFILES = [
  { id: 'alte', slug: 'alte', name: 'Alte', role: 'employee', active: true, sort: 1, phone: '' },
  { id: 'tito', slug: 'tito', name: 'Tito', role: 'employee', active: true, sort: 2, phone: '' },
  { id: 'tomas', slug: 'tomas', name: 'Tomás', role: 'employee', active: true, sort: 3, phone: '' },
  { id: 'matias', slug: 'matias', name: 'Matías', role: 'owner', active: true, sort: 4, phone: '' },
  { id: 'inventario', slug: 'inventario', name: 'Inventario', role: 'inventory', active: true, sort: 99, phone: '' }
];
// Claves de ejemplo del modo demo (en la base real se cambian desde Modo dueño → Equipo)
export const DEMO_PINS = { alte: '1111', tito: '2222', tomas: '3333', matias: '7777', inventario: '9999' };

// Precio a rendir = ~88% del precio publicado (redondeado a 10)
export const DEMO_PRICES = Object.fromEntries(
  DEMO_PRODUCTS.map(p => [p.id, Math.round((p.price * 0.88) / 10) * 10])
);

let seed = 42;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const isoDay = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const NAMES = ['Juan Pérez', 'Caro Gómez', 'Nico Díaz', 'Flor Romero', 'Martín Ruiz', 'Agus Sosa', 'Lu Fernández', 'Santi Álvarez', 'Meli Torres', 'Fede Castro', 'Juli Medina', 'Pato Herrera'];
export const DEMO_CLIENTS = NAMES.map((name, i) => ({
  id: `cli-${i}`,
  created_at: new Date(Date.now() - (i + 2) * 86400000 * 2).toISOString(),
  employee_id: ['alte', 'tito', 'tomas', 'matias'][i % 4],
  name,
  phone: `54911${String(40000000 + i * 1234567).slice(0, 8)}`,
  interest: pick(['iPhone 15 Pro', 'iPhone 14', 'iPhone 13', 'iPhone 16 Pro Max', 'Entrega su 11']),
  notes: ''
}));

// Historial de ventas de ejemplo de las últimas 7 semanas
export const DEMO_SALES = (() => {
  const methods = ['Efectivo', 'Transferencia', 'Dólares', 'Tarjeta'];
  const out = [];
  for (let i = 0; i < 40; i++) {
    const p = pick(DEMO_PRODUCTS);
    const emp = pick(['alte', 'alte', 'tito', 'tito', 'tomas', 'matias']);
    const client = DEMO_CLIENTS.find(c => c.employee_id === emp);
    const daysAgo = Math.floor(rnd() * 50);
    const date = new Date(Date.now() - daysAgo * 86400000 - Math.floor(rnd() * 8) * 3600000);
    const unit = p.price + Math.round((rnd() * 60 - 20) / 10) * 10;
    out.push({
      id: `sale-${i}`,
      created_at: date.toISOString(),
      product_id: p.id,
      product_label: [p.model, p.storage, p.color].join(' · '),
      employee_id: emp,
      client_id: client?.id ?? null,
      qty: 1,
      unit_price: unit,
      owner_price: DEMO_PRICES[p.id],
      payment_method: pick(methods),
      customer: client?.name ?? '',
      notes: '',
      settled: daysAgo > 6,
      settled_at: daysAgo > 6 ? date.toISOString() : null
    });
  }
  return out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
})();

export const DEMO_REMINDERS = (() => {
  const out = [];
  const titles = ['Viene a ver el equipo', 'Pasa a buscar', 'Recordarle la seña', 'Trae su usado para cotizar', 'Seguimiento por WhatsApp'];
  for (let i = 0; i < 18; i++) {
    const c = pick(DEMO_CLIENTS);
    const d = new Date();
    d.setDate(d.getDate() + Math.floor(rnd() * 24) - 8);
    out.push({
      id: `rem-${i}`,
      created_at: new Date().toISOString(),
      employee_id: c.employee_id,
      client_id: c.id,
      date: isoDay(d),
      time: `${10 + Math.floor(rnd() * 9)}:${pick(['00', '30'])}`,
      title: pick(titles),
      notes: '',
      done: d < new Date() && rnd() > 0.3
    });
  }
  return out;
})();

export const DEMO_ADS = (() => {
  const out = [];
  for (let i = 0; i < 10; i++) {
    const d = new Date(Date.now() - Math.floor(rnd() * 55) * 86400000);
    out.push({ id: `ad-${i}`, created_at: d.toISOString(), date: isoDay(d), platform: pick(['Instagram', 'Instagram', 'Facebook', 'TikTok', 'Google']), amount: Math.round(rnd() * 90 + 20), notes: '' });
  }
  return out;
})();

export const DEMO_PURCHASES = (() => {
  const out = [];
  for (let i = 0; i < 6; i++) {
    const p = pick(DEMO_PRODUCTS);
    const d = new Date(Date.now() - Math.floor(rnd() * 55) * 86400000);
    out.push({ id: `pur-${i}`, created_at: d.toISOString(), date: isoDay(d), description: `${p.model} ${p.storage}`, qty: 1 + Math.floor(rnd() * 3), unit_cost: Math.round(p.price * 0.75 / 10) * 10, supplier: '', notes: '' });
  }
  return out;
})();

export const DEMO_REVIEWS = [
  { id: 'r1', created_at: new Date().toISOString(), name: 'Ejemplo · Cliente 1', rating: 5, text: 'Reseña de ejemplo: así se ve un comentario de un cliente con su compra.', model: 'iPhone 15 Pro', photo_url: '', active: true },
  { id: 'r2', created_at: new Date().toISOString(), name: 'Ejemplo · Cliente 2', rating: 5, text: 'Reseña de ejemplo: se reemplaza por los comentarios reales desde el sistema.', model: 'iPhone 14', photo_url: '', active: true },
  { id: 'r3', created_at: new Date().toISOString(), name: 'Ejemplo · Cliente 3', rating: 5, text: 'Reseña de ejemplo: también se puede subir la foto que el cliente compartió en Instagram.', model: 'iPhone 13 Pro Max', photo_url: '', active: true }
];

const TI = [['iPhone 11','64GB',160],['iPhone 11','128GB',185],['iPhone 11 Pro','64GB',210],['iPhone 11 Pro Max','64GB',250],['iPhone 12','64GB',230],['iPhone 12','128GB',260],['iPhone 12 Pro','128GB',320],['iPhone 12 Pro Max','128GB',370],['iPhone 13','128GB',330],['iPhone 13 Pro','128GB',430],['iPhone 13 Pro Max','128GB',490],['iPhone 14','128GB',400],['iPhone 14 Pro','128GB',540],['iPhone 14 Pro Max','128GB',610],['iPhone 15','128GB',520],['iPhone 15 Pro','128GB',680],['iPhone 15 Pro Max','256GB',820],['iPhone 16','128GB',650],['iPhone 16 Pro','128GB',850],['iPhone 16 Pro Max','256GB',1020]];
export const DEMO_TRADEIN = TI.map(([model, storage, value], i) => ({ id: `ti-${i}`, model, storage, value }));

export const DEMO_LEADS = [
  { id: 'lead-1', created_at: new Date(Date.now() - 3600000).toISOString(), kind: 'cotizacion', name: 'Romi', phone: '1155550001', model: 'iPhone 13', storage: '128GB', details: { battery: '85 a 89%', condition: 'Muy bueno', fault: false, para: 'iPhone 15 Pro Max 256 GB Titanio natural' }, estimate_min: 250, estimate_max: 285, status: 'nuevo', notes: null },
  { id: 'lead-2', created_at: new Date(Date.now() - 86400000).toISOString(), kind: 'aviso', name: 'Gonza', phone: '1155550002', model: 'iPhone 15 Pro', storage: '256GB', details: { budget: '900' }, estimate_min: null, estimate_max: null, status: 'nuevo', notes: null },
  { id: 'lead-3', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), kind: 'aviso', name: 'Vale', phone: '1155550003', model: 'iPhone 14', storage: '', details: {}, estimate_min: null, estimate_max: null, status: 'contactado', notes: 'Le pasé opciones' },
  { id: 'lead-4', created_at: new Date(Date.now() - 3 * 86400000).toISOString(), kind: 'cotizacion', name: 'Dani', phone: '1155550004', model: 'iPhone 12', storage: '64GB', details: { battery: '80 a 84%', condition: 'Con detalles', fault: false }, estimate_min: 150, estimate_max: 170, status: 'nuevo', notes: null }
];
