import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'mg_cart_v1';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) ?? [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      open,
      pulse,
      setOpen,
      count: items.reduce((n, i) => n + i.qty, 0),
      has: id => items.some(i => i.id === id),
      add: (product, qty = 1) => {
        setItems(prev => {
          const found = prev.find(i => i.id === product.id);
          if (found) return prev.map(i => (i.id === product.id ? { ...i, qty: i.qty + qty } : i));
          return [...prev, { id: product.id, qty, snapshot: product }];
        });
        setPulse(p => p + 1);
      },
      setQty: (id, qty) => setItems(prev => (qty <= 0 ? prev.filter(i => i.id !== id) : prev.map(i => (i.id === id ? { ...i, qty } : i)))),
      remove: id => setItems(prev => prev.filter(i => i.id !== id)),
      clear: () => setItems([])
    }),
    [items, open, pulse]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
