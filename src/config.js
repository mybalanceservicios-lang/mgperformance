// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE LA TIENDA — editá estos valores a gusto
// ─────────────────────────────────────────────────────────────
export const STORE = {
  name: 'MG Performance',
  shortName: 'MG',
  tagline: 'iPhones seleccionados, verificados y con fotos reales.',
  // Número de WhatsApp en formato internacional, sin "+" ni espacios (ej: 5491122334455)
  whatsapp: '5491100000000',
  instagram: 'mgperformance.ok',
  city: 'Buenos Aires',
  currency: 'USD', // 'USD' o 'ARS'
  // Precio en pesos = dólares × dólar blue. 'compra' o 'venta' (datos de DolarHoy vía DolarApi):
  dolarField: 'compra',
  // El precio en pesos se redondea para arriba a este múltiplo:
  pesosRound: 1000,
  // Contraseña del panel SOLO en modo demo (sin Supabase). Con Supabase se usa email + contraseña.
  demoAdminPassword: 'admin'
};

// Categorías por condición del equipo. El "id" es lo que se guarda en la base.
export const CONDITIONS = [
  {
    id: 'nuevo',
    label: 'Nuevo sellado',
    short: 'Nuevo',
    hint: 'En caja cerrada, sin activar.',
    color: '#64D2FF'
  },
  {
    id: 'como-nuevo',
    label: 'Como nuevo',
    short: 'Como nuevo',
    hint: 'Sin marcas de uso. Caja abierta o exhibición.',
    color: '#BF5AF2'
  },
  {
    id: 'usado-premium',
    label: 'Usado premium',
    short: 'Premium',
    hint: 'Estética impecable, detalles mínimos.',
    color: '#30D158'
  },
  {
    id: 'usado',
    label: 'Usado',
    short: 'Usado',
    hint: 'Marcas leves de uso, funcionamiento 100%.',
    color: '#FF9F0A'
  }
];

export const STATUSES = [
  { id: 'disponible', label: 'Disponible' },
  { id: 'reservado', label: 'Reservado' },
  { id: 'vendido', label: 'Vendido' }
];

export const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

export const BATTERY_FILTERS = [
  { value: 0, label: 'Todas' },
  { value: 80, label: '+80%' },
  { value: 85, label: '+85%' },
  { value: 90, label: '+90%' },
  { value: 95, label: '+95%' },
  { value: 100, label: '100%' }
];

// Chequeos del diagnóstico de cada equipo (se marcan desde Inventario)
export const CHECKS = [
  { id: 'faceid', label: 'Face ID' },
  { id: 'truetone', label: 'True Tone' },
  { id: 'pantalla', label: 'Pantalla original' },
  { id: 'camaras', label: 'Cámaras y flash' },
  { id: 'audio', label: 'Parlantes y micrófono' },
  { id: 'carga', label: 'Carga y MagSafe' },
  { id: 'botones', label: 'Botones' },
  { id: 'senal', label: 'Señal y Wi‑Fi' },
  { id: 'sinreparar', label: 'Sin reparaciones' }
];

export const TRADE_IN_MESSAGE =
  'Hola! Quiero entregar mi celular en parte de pago.\nModelo:\nCapacidad:\nBatería (%):\nEstado:\n¿Cuánto me lo toman?';

// ─────────────────────────────────────────────────────────────
//  COTIZADOR DE USADOS
//  Valor estimado = valor base del modelo (lo carga Matías) × estado × batería × falla
// ─────────────────────────────────────────────────────────────
export const TRADE_IN = {
  conditions: [
    { id: 'impecable', label: 'Impecable', hint: 'Sin marcas, como nuevo', factor: 1 },
    { id: 'muy-bueno', label: 'Muy bueno', hint: 'Marcas mínimas de uso', factor: 0.9 },
    { id: 'detalles', label: 'Con detalles', hint: 'Rayones o golpes visibles', factor: 0.78 },
    { id: 'roto', label: 'Vidrio roto', hint: 'Pantalla o dorso astillado', factor: 0.55 }
  ],
  battery: [
    { id: '90', label: '90% o más', factor: 1 },
    { id: '85', label: '85 a 89%', factor: 0.95 },
    { id: '80', label: '80 a 84%', factor: 0.9 },
    { id: '0', label: 'Menos de 80%', factor: 0.8 }
  ],
  faultFactor: 0.7, // si Face ID, cámaras u otra cosa no funciona
  spread: 0.06 // el rango que se muestra: ±6% del valor estimado
};
