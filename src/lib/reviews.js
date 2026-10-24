// Reseñas de clientes. Con Supabase se leen de la tabla "reviews" (se cargan desde el sistema).
// En modo demo se muestran ejemplos para ver el diseño.
import { useEffect, useState } from 'react';
import { isDemo, supabase } from './supabase';

const DEMO_REVIEWS = [
  { id: 'r1', name: 'Ejemplo · Cliente 1', rating: 5, text: 'Reseña de ejemplo: así se ve un comentario de un cliente con su compra.', model: 'iPhone 15 Pro' },
  { id: 'r2', name: 'Ejemplo · Cliente 2', rating: 5, text: 'Reseña de ejemplo: se reemplaza por los comentarios reales desde el sistema.', model: 'iPhone 14' },
  { id: 'r3', name: 'Ejemplo · Cliente 3', rating: 5, text: 'Reseña de ejemplo: también se puede subir la foto que el cliente compartió en Instagram.', model: 'iPhone 13 Pro Max' }
];

export async function listReviews() {
  if (isDemo) return DEMO_REVIEWS;
  const { data, error } = await supabase.from('reviews').select('*').eq('active', true).order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

export function useReviews() {
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    listReviews().then(setReviews);
  }, []);
  return reviews;
}
