// Productos de ejemplo para el modo demo. Se borran/editan desde el panel.
export const DEMO_PRODUCTS = [
  { model: 'iPhone 16 Pro Max', storage: '256GB', color: 'Titanio desierto', condition: 'nuevo', battery: 100, price: 1450, stock: 3, featured: true, includes: ['Caja', 'Cable USB-C'], warranty: '12 meses oficial Apple' },
  { model: 'iPhone 16 Pro', storage: '128GB', color: 'Titanio negro', condition: 'como-nuevo', battery: 99, price: 1090, featured: true, includes: ['Caja', 'Cable USB-C'], warranty: '6 meses' },
  { model: 'iPhone 15 Pro Max', storage: '256GB', color: 'Titanio natural', condition: 'usado-premium', battery: 92, price: 920, featured: true, includes: ['Cable USB-C'], warranty: '3 meses' },
  { model: 'iPhone 15', storage: '128GB', color: 'Rosa', condition: 'como-nuevo', battery: 97, price: 640, includes: ['Caja', 'Cable USB-C'], warranty: '6 meses' },
  { model: 'iPhone 14 Pro', storage: '256GB', color: 'Morado oscuro', condition: 'usado-premium', battery: 88, price: 610, includes: ['Cable'], warranty: '3 meses' },
  { model: 'iPhone 14', storage: '128GB', color: 'Medianoche', condition: 'usado', battery: 85, price: 430, includes: [], warranty: '3 meses' },
  { model: 'iPhone 13 Pro Max', storage: '512GB', color: 'Azul alpino', condition: 'usado-premium', battery: 90, price: 560, includes: ['Cable'], warranty: '3 meses' },
  { model: 'iPhone 13', storage: '128GB', color: 'Blanco estelar', condition: 'usado', battery: 83, price: 340, includes: [], warranty: '3 meses', status: 'reservado' },
  { model: 'iPhone 16e', storage: '128GB', color: 'Negro', condition: 'nuevo', battery: 100, price: 690, stock: 2, includes: ['Caja', 'Cable USB-C'], warranty: '12 meses oficial Apple' },
  { model: 'iPhone 12', storage: '64GB', color: 'Azul', condition: 'usado', battery: 81, price: 250, includes: [], warranty: '1 mes' }
].map((p, i) => ({
  id: `demo-${i + 1}`,
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
  description: '',
  status: 'disponible',
  featured: false,
  media: [],
  stock: 1,
  ...p
}));

export const DEMO_PROFILES = [
  { id: 'owner', name: 'Dueño', email: 'dueno@demo', role: 'owner', active: true },
  { id: 'emp-1', name: 'Lucas', email: 'lucas@demo', role: 'employee', active: true },
  { id: 'emp-2', name: 'Sofi', email: 'sofi@demo', role: 'employee', active: true }
];
export const DEMO_PASSWORDS = { owner: 'admin', employee: '1234' };

// Precio a rendir = ~88% del precio publicado (redondeado a 10)
export const DEMO_PRICES = Object.fromEntries(
  DEMO_PRODUCTS.map(p => [p.id, Math.round((p.price * 0.88) / 10) * 10])
);

// Historial de ventas de ejemplo de las últimas 3 semanas
export const DEMO_SALES = (() => {
  let seed = 42;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const methods = ['Efectivo', 'Transferencia', 'Dólares', 'Tarjeta'];
  const out = [];
  for (let i = 0; i < 26; i++) {
    const p = DEMO_PRODUCTS[Math.floor(rnd() * DEMO_PRODUCTS.length)];
    const emp = rnd() > 0.45 ? 'emp-1' : 'emp-2';
    const daysAgo = Math.floor(rnd() * 21);
    const date = new Date(Date.now() - daysAgo * 86400000 - Math.floor(rnd() * 8) * 3600000);
    const unit = p.price + Math.round((rnd() * 60 - 20) / 10) * 10;
    out.push({
      id: `sale-${i}`,
      created_at: date.toISOString(),
      product_id: p.id,
      product_label: [p.model, p.storage, p.color].join(' · '),
      employee_id: emp,
      qty: 1,
      unit_price: unit,
      owner_price: DEMO_PRICES[p.id],
      payment_method: methods[Math.floor(rnd() * methods.length)],
      customer: '',
      notes: '',
      settled: daysAgo > 6,
      settled_at: daysAgo > 6 ? date.toISOString() : null
    });
  }
  return out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
})();
