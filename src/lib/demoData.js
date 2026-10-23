// Productos de ejemplo para el modo demo. Se borran/editan desde el panel.
export const DEMO_PRODUCTS = [
  { model: 'iPhone 16 Pro Max', storage: '256GB', color: 'Titanio desierto', condition: 'nuevo', battery: 100, price: 1450, featured: true, includes: ['Caja', 'Cable USB-C'], warranty: '12 meses oficial Apple' },
  { model: 'iPhone 16 Pro', storage: '128GB', color: 'Titanio negro', condition: 'como-nuevo', battery: 99, price: 1090, featured: true, includes: ['Caja', 'Cable USB-C'], warranty: '6 meses' },
  { model: 'iPhone 15 Pro Max', storage: '256GB', color: 'Titanio natural', condition: 'usado-premium', battery: 92, price: 920, featured: true, includes: ['Cable USB-C'], warranty: '3 meses' },
  { model: 'iPhone 15', storage: '128GB', color: 'Rosa', condition: 'como-nuevo', battery: 97, price: 640, includes: ['Caja', 'Cable USB-C'], warranty: '6 meses' },
  { model: 'iPhone 14 Pro', storage: '256GB', color: 'Morado oscuro', condition: 'usado-premium', battery: 88, price: 610, includes: ['Cable'], warranty: '3 meses' },
  { model: 'iPhone 14', storage: '128GB', color: 'Medianoche', condition: 'usado', battery: 85, price: 430, includes: [], warranty: '3 meses' },
  { model: 'iPhone 13 Pro Max', storage: '512GB', color: 'Azul alpino', condition: 'usado-premium', battery: 90, price: 560, includes: ['Cable'], warranty: '3 meses' },
  { model: 'iPhone 13', storage: '128GB', color: 'Blanco estelar', condition: 'usado', battery: 83, price: 340, includes: [], warranty: '3 meses', status: 'reservado' },
  { model: 'iPhone 16e', storage: '128GB', color: 'Negro', condition: 'nuevo', battery: 100, price: 690, includes: ['Caja', 'Cable USB-C'], warranty: '12 meses oficial Apple' },
  { model: 'iPhone 12', storage: '64GB', color: 'Azul', condition: 'usado', battery: 81, price: 250, includes: [], warranty: '1 mes' }
].map((p, i) => ({
  id: `demo-${i + 1}`,
  created_at: new Date(Date.now() - i * 86400000).toISOString(),
  description: '',
  status: 'disponible',
  featured: false,
  media: [],
  ...p
}));
