import { useCallback, useEffect, useState } from 'react';
import { listOwnerPrices, listProfiles, listSales } from '@/lib/store';
import { friendlyError } from '@/lib/supabase';

export function useAdminData(me) {
  const [sales, setSales] = useState([]);
  const [prices, setPrices] = useState({});
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!me?.active) return;
    try {
      const [s, pr, pf] = await Promise.all([
        listSales(),
        listOwnerPrices(),
        me.role === 'owner' ? listProfiles() : Promise.resolve([me])
      ]);
      setSales(s);
      setPrices(pr);
      setProfiles(pf);
      setError('');
    } catch (e) {
      setError(friendlyError(e));
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

  const nameOf = id => profiles.find(p => p.id === id)?.name ?? 'Empleado';
  return { sales, prices, profiles, loading, error, reload, nameOf };
}
