import { useCallback, useEffect, useState } from 'react';
import { listOwnerPrices, listProfiles, listRows, listSales } from '@/lib/store';
import { friendlyError } from '@/lib/supabase';

const EMPTY = { sales: [], prices: {}, profiles: [], clients: [], reminders: [], ads: [], purchases: [], reviews: [] };

// Carga lo que cada rol necesita. Las reglas de la base igual impiden ver lo ajeno.
export function useAdminData(me) {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!me?.active) return;
    const owner = me.role === 'owner';
    const inventory = me.role === 'inventory';
    const safe = p => p.catch(e => {
      // tablas nuevas que todavía no existen en la base (falta correr la actualización)
      setError(friendlyError(e));
      return null;
    });
    try {
      const [sales, prices, profiles, clients, reminders, ads, purchases, reviews] = await Promise.all([
        inventory ? [] : safe(listSales()),
        safe(listOwnerPrices()),
        owner ? safe(listProfiles()) : [me],
        inventory ? [] : safe(listRows('clients', { all: owner })),
        inventory ? [] : safe(listRows('reminders', { all: owner })),
        owner ? safe(listRows('ads')) : [],
        owner ? safe(listRows('purchases')) : [],
        owner || inventory ? safe(listRows('reviews')) : []
      ]);
      setData({
        sales: sales ?? [],
        prices: prices ?? {},
        profiles: profiles ?? [me],
        clients: clients ?? [],
        reminders: reminders ?? [],
        ads: ads ?? [],
        purchases: purchases ?? [],
        reviews: reviews ?? []
      });
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    reload();
    window.addEventListener('mg:data', reload);
    window.addEventListener('mg:products', reload);
    return () => {
      window.removeEventListener('mg:data', reload);
      window.removeEventListener('mg:products', reload);
    };
  }, [reload]);

  const nameOf = id => data.profiles.find(p => p.id === id)?.name ?? (id === me?.id ? me.name : 'Vendedor');
  const clientOf = id => data.clients.find(c => c.id === id);
  return { ...data, loading, error, reload, nameOf, clientOf };
}
