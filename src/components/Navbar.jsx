import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { STORE } from '@/config';
import { cn } from '@/lib/utils';

export function Logo({ className }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2.5', className)} aria-label={`${STORE.name} — inicio`}>
      <span className="neu-sm grid h-9 w-9 place-items-center !rounded-[11px]">
        <span className="font-display text-[13px] font-extrabold tracking-tight text-gradient">{STORE.shortName}</span>
      </span>
      <span className="font-display text-[15px] font-bold tracking-tight">{STORE.name}</span>
    </Link>
  );
}

export default function Navbar() {
  const cart = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    if (!cart.pulse) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 500);
    return () => clearTimeout(t);
  }, [cart.pulse]);

  const links = [
    { id: 'catalogo', label: 'Equipos' },
    { id: 'como-funciona', label: 'Cómo comprar' },
    { id: 'contacto', label: 'Contacto' }
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-[max(0.6rem,env(safe-area-inset-top))]">
      <nav
        className={cn(
          'mx-auto flex h-[60px] max-w-6xl items-center justify-between rounded-[20px] px-3 pl-4 transition-all duration-500',
          scrolled ? 'glass shadow-[0_12px_40px_rgba(0,0,0,0.45)]' : 'border border-transparent'
        )}
      >
        <Logo />
        <div className="hidden items-center gap-1 md:flex">
          {links.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                if (pathname === '/') document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth' });
                else navigate('/', { state: { scrollTo: l.id } });
              }}
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted transition hover:bg-white/5 hover:text-ink"
            >
              {l.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => cart.setOpen(true)}
          className="btn btn-neu !min-h-[42px] !rounded-[14px] !px-3.5"
          aria-label={`Mi selección, ${cart.count} equipos`}
        >
          <ShoppingBag size={18} />
          <span className="hidden text-sm sm:inline">Mi selección</span>
          <span
            className={cn(
              'grid h-[22px] min-w-[22px] place-items-center rounded-full px-1.5 text-xs font-bold tabular-nums',
              cart.count ? 'bg-ios-blue text-white' : 'bg-white/10 text-muted',
              bump && 'bump'
            )}
          >
            {cart.count}
          </span>
        </button>
      </nav>
    </header>
  );
}
