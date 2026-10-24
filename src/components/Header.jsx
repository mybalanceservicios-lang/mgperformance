import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCcw, Search } from 'lucide-react';
import { STORE, TRADE_IN_MESSAGE } from '@/config';
import { cn, waLink } from '@/lib/utils';
import WhatsAppIcon from './WhatsAppIcon';
import { DolarChip } from './Pesos';

export function Logo({ className }) {
  return (
    <Link to="/" className={cn('flex shrink-0 items-center gap-2', className)} aria-label={`${STORE.name} — inicio`}>
      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-gradient-to-br from-[#7c3aed] to-[#2563eb] text-[13px] font-extrabold text-white shadow-[0_6px_18px_-6px_rgba(124,58,237,.9)]">
        {STORE.shortName}
      </span>
      <span className="hidden font-display text-[15px] font-bold tracking-tight sm:inline">{STORE.name}</span>
    </Link>
  );
}

export default function Header() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setQ(params.get('q') ?? '');
  }, [params]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const submit = e => {
    e.preventDefault();
    const next = new URLSearchParams(pathname === '/' ? params : undefined);
    if (q.trim()) next.set('q', q.trim());
    else next.delete('q');
    navigate({ pathname: '/', search: next.toString() });
    setTimeout(() => document.getElementById('publicaciones')?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300',
        scrolled ? 'border-white/8 bg-[#07041a]/80 backdrop-blur-xl' : 'border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Logo />
        <form onSubmit={submit} className="relative mx-auto flex w-full max-w-xl" role="search">
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar iPhone 15 Pro, 256GB…"
            aria-label="Buscar"
            className="h-11 w-full rounded-full border border-white/10 bg-white/[0.06] pr-12 pl-4 text-[15px] text-white outline-none placeholder:text-white/40 focus:border-violet-400/60 focus:bg-white/[0.09]"
          />
          <button type="submit" className="absolute top-1/2 right-1.5 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-white/70 hover:bg-white/10" aria-label="Buscar">
            <Search size={17} />
          </button>
        </form>
        <DolarChip className="hidden shrink-0 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/75 xl:inline-flex" />
        <Link to="/cotizar" className="hidden shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-violet-200 hover:bg-white/5 md:flex">
          <RefreshCcw size={16} /> Cotizá tu usado
        </Link>
        <a
          href={waLink(`Hola ${STORE.name}! Tengo una consulta.`)}
          target="_blank"
          rel="noreferrer"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#22c55e] text-[#04210f] md:hidden"
          aria-label="WhatsApp"
        >
          <WhatsAppIcon className="h-5 w-5" />
        </a>
      </div>
    </header>
  );
}
