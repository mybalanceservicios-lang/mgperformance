import { useCallback, useEffect, useState } from 'react';
import { listProducts, resolveMediaUrl } from './store';
import { friendlyError } from './supabase';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      setProducts(await listProducts());
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    window.addEventListener('mg:products', reload);
    return () => window.removeEventListener('mg:products', reload);
  }, [reload]);

  return { products, loading, error, reload };
}

export function useMediaUrl(url) {
  const [resolved, setResolved] = useState(url?.startsWith('idb://') ? null : url);
  useEffect(() => {
    let alive = true;
    resolveMediaUrl(url).then(u => alive && setResolved(u));
    return () => {
      alive = false;
    };
  }, [url]);
  return resolved;
}
