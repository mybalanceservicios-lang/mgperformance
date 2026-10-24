// Reseñas de clientes. Con Supabase se leen de la tabla "reviews" (se cargan desde el sistema).
// En modo demo se muestran ejemplos para ver el diseño.
import { useEffect, useState } from 'react';
import { isDemo, supabase } from './supabase';
import { listRows } from './store';

export async function listReviews() {
  if (isDemo) return (await listRows('reviews')).filter(r => r.active !== false);
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
