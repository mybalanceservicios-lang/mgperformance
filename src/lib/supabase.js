import { createClient } from '@supabase/supabase-js';

// Datos públicos del proyecto de Supabase (la clave "publishable" está hecha para usarse en el navegador;
// la seguridad la dan las reglas RLS de supabase/schema.sql).
// Se pueden pisar con VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, o forzar el modo demo con VITE_DEMO=true.
const DEFAULT_URL = 'https://hzfhgimsanggiypptwff.supabase.co';
const DEFAULT_KEY = 'sb_publishable_sK1xtBnHUIjLbJadlgdfWg_pQPoxB-t';

const url = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

export const isDemo = import.meta.env.VITE_DEMO === 'true' || !(url && key);
export const supabase = isDemo ? null : createClient(url, key);
export const BUCKET = 'media';

// Traduce errores típicos de una base sin configurar a algo entendible.
export function friendlyError(e) {
  const msg = e?.message ?? String(e);
  if (/could not find the table|relation .* does not exist|PGRST205|42P01/i.test(msg))
    return 'La base de datos todavía no está configurada: falta correr supabase/schema.sql en Supabase (ver README).';
  if (/failed to fetch|networkerror/i.test(msg)) return 'No hay conexión con el servidor. Revisá tu internet y recargá.';
  return msg;
}
