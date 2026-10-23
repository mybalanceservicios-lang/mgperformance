import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import ClickSpark from '@/components/reactbits/ClickSpark';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartSheet from '@/components/CartSheet';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Home from '@/pages/Home';
import Product from '@/pages/Product';
import { useProducts } from '@/lib/useProducts';
import { useCart } from '@/lib/cart';
import { waLink } from '@/lib/utils';
import { STORE } from '@/config';

const Admin = lazy(() => import('@/admin/AdminApp'));

function WhatsAppFab() {
  const cart = useCart();
  return (
    <a
      href={waLink(`Hola ${STORE.name}! Tengo una consulta.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribinos por WhatsApp"
      className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-b from-[#34d76a] to-[#22b455] text-[#04210f] shadow-[0_12px_30px_-8px_rgba(48,209,88,0.8),inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform hover:scale-105 active:scale-95 ${cart.open ? 'hidden' : ''}`}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}

export default function App() {
  const { products, loading, error, reload } = useProducts();
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const isProduct = pathname.startsWith('/producto');
  // Los vendidos desaparecen de la tienda (siguen en el sistema de gestión)
  const shop = products.filter(p => p.status !== 'vendido');

  return (
    <ClickSpark sparkColor="#9fc9ff" sparkSize={9} sparkRadius={22} sparkCount={8} duration={420} style={{ minHeight: '100dvh' }}>
      {!isAdmin && <Navbar />}
      {error && (
        <div className="fixed inset-x-4 top-24 z-50 mx-auto max-w-md rounded-2xl bg-ios-red/15 p-3 text-center text-sm text-ios-red">
          No pudimos cargar los equipos. {error}
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home products={shop} loading={loading} />} />
        <Route path="/producto/:id" element={<Product products={shop} loading={loading} />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={null}>
              <Admin products={products} reload={reload} />
            </Suspense>
          }
        />
        <Route path="*" element={<Home products={shop} loading={loading} />} />
      </Routes>
      {!isAdmin && <Footer />}
      {!isAdmin && <CartSheet products={products} />}
      {!isAdmin && !isProduct && <WhatsAppFab />}
    </ClickSpark>
  );
}
