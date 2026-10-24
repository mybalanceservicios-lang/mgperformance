import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, BellRing, Boxes, Calculator, MoreHorizontal, CalendarDays, ClipboardList, Crown, Eye, Home, Loader2, LogOut, Megaphone, PiggyBank, Plus, Receipt, RotateCcw, Star, User, Users } from 'lucide-react';
import { Logo } from '@/components/Header';
import { isDemo, supabase } from '@/lib/supabase';
import { getMe, resetDemo, signOut } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useAdminData } from './useAdminData';
import { Avatar } from './kit';
import { DolarChip } from '@/components/Pesos';
import Login from './Login';
import SellerHome from './SellerHome';
import Clients from './Clients';
import Calendar, { ReminderSheet } from './Calendar';
import Sales from './Sales';
import Dashboard from './Dashboard';
import Ads from './Ads';
import Purchases from './Purchases';
import Team from './Team';
import Inventory from './Inventory';
import Import from './Import';
import ReviewsAdmin from './ReviewsAdmin';
import Leads from './Leads';
import TradeInAdmin from './TradeInAdmin';
import { Sheet } from '@/components/ui';
import SaleSheet from './SaleSheet';
import { ClientSheet } from './ClientSheet';

const NAVS = {
  seller: [
    { to: '/admin', end: true, label: 'Inicio', icon: Home },
    { to: '/admin/clientes', label: 'Clientes', icon: Users },
    { to: '/admin/calendario', label: 'Calendario', icon: CalendarDays },
    { to: '/admin/ventas', label: 'Ventas', icon: Receipt }
  ],
  owner: [
    { to: '/admin', end: true, label: 'Panel', icon: BarChart3 },
    { to: '/admin/interesados', label: 'Interesados', icon: BellRing, badge: 'leads' },
    { to: '/admin/ventas', label: 'Ventas', icon: Receipt },
    { to: '/admin/publicidad', label: 'Publicidad', icon: Megaphone },
    { to: '/admin/inversion', label: 'Inversión', icon: PiggyBank },
    { to: '/admin/cotizador', label: 'Cotizador', icon: Calculator },
    { to: '/admin/equipo', label: 'Equipo', icon: User }
  ],
  inventory: [
    { to: '/admin', end: true, label: 'Inventario', icon: Boxes },
    { to: '/admin/cargar', label: 'Cargar lista', icon: ClipboardList },
    { to: '/admin/resenas', label: 'Reseñas', icon: Star }
  ]
};
const MODE_KEY = 'mg_owner_mode';

export default function AdminApp({ products, reload: reloadProducts }) {
  const [me, setMe] = useState(undefined);
  const [ownerMode, setOwnerModeState] = useState(() => localStorage.getItem(MODE_KEY) === '1');
  const [sale, setSale] = useState(null);
  const [reminder, setReminder] = useState(null);
  const [client, setClient] = useState(null);
  const [more, setMore] = useState(false);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  const refreshMe = useCallback(() => getMe().then(setMe), []);
  useEffect(() => {
    refreshMe();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange(() => refreshMe());
    return () => data.subscription.unsubscribe();
  }, [refreshMe]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const data = useAdminData(me);

  if (me === undefined)
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="animate-spin text-muted" />
      </div>
    );
  if (!me || !me.active) return <Login onDone={refreshMe} />;

  const isOwner = me.role === 'owner';
  const isInventory = me.role === 'inventory';
  const mode = isInventory ? 'inventory' : isOwner && ownerMode ? 'owner' : 'seller';
  const nav = NAVS[mode];
  const newLeads = data.leads.filter(l => l.status === 'nuevo').length;
  const setOwnerMode = on => {
    localStorage.setItem(MODE_KEY, on ? '1' : '0');
    setOwnerModeState(on);
    navigate('/admin');
    window.scrollTo(0, 0);
  };
  const logout = async () => {
    await signOut();
    localStorage.setItem(MODE_KEY, '0');
    setOwnerModeState(false);
    await refreshMe();
    navigate('/admin');
  };

  const ctx = {
    me,
    isOwner,
    ownerMode: mode === 'owner',
    products,
    reloadProducts,
    ...data,
    notify: setToast,
    openSale: (initial = {}) => setSale(initial),
    openReminder: (initial = {}) => setReminder(initial),
    openClient: (initial = {}) => setClient(initial),
    setOwnerMode
  };

  const home = mode === 'owner' ? <Dashboard {...ctx} /> : mode === 'inventory' ? <Inventory {...ctx} isOwner /> : <SellerHome {...ctx} />;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      {/* barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-dvh flex-col p-4 lg:flex">
        <div className="neu flex h-full flex-col p-4">
          <Logo className="px-1" />
          {mode === 'owner' && (
            <span className="chip mt-5 self-start bg-ios-orange/15 text-ios-orange">
              <Crown size={12} /> Modo dueño
            </span>
          )}
          <nav className="mt-6 space-y-1.5">
            {nav.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn('flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition', isActive ? 'text-ink shadow-[var(--neu-in)] [&>svg]:text-violet-400' : 'text-muted hover:text-ink')
                }
              >
                <n.icon size={19} /> {n.label}
                {n.badge === 'leads' && newLeads > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-ios-red px-1.5 text-[11px] font-bold text-white">{newLeads}</span>}
              </NavLink>
            ))}
          </nav>
          {mode === 'seller' && (
            <button type="button" onClick={() => setSale({})} className="btn mt-6 w-full bg-gradient-to-br from-[#8b5cf6] to-[#4f46e5] text-white shadow-[0_12px_28px_-12px_rgba(124,58,237,.9)]">
              <Plus size={19} /> Nueva venta
            </button>
          )}
          <div className="mt-auto space-y-3">
            {isOwner && (
              <button
                type="button"
                onClick={() => setOwnerMode(!ownerMode)}
                className={cn('flex w-full items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-sm font-semibold transition', ownerMode ? 'border-white/10 text-muted hover:text-ink' : 'border-ios-orange/40 bg-ios-orange/10 text-ios-orange')}
              >
                {ownerMode ? <User size={17} /> : <Crown size={17} />} {ownerMode ? 'Volver a modo vendedor' : 'Modo dueño'}
              </button>
            )}
            <DolarChip className="px-2 text-xs text-muted" />
            <Link to="/" className="flex items-center gap-2 px-2 text-sm text-muted hover:text-ink">
              <Eye size={16} /> Ver tienda
            </Link>
            <div className="neu-inset flex items-center gap-3 rounded-2xl p-2.5">
              <Avatar name={me.name} owner={isOwner} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{me.name}</div>
                <div className="text-xs text-muted">{isOwner ? 'Dueño' : isInventory ? 'Inventario' : 'Vendedor'}</div>
              </div>
              <button type="button" onClick={logout} className="icon-btn !h-9 !w-9 text-muted hover:text-ios-red" aria-label="Salir">
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-28 lg:pb-10">
        {/* encabezado (celular) */}
        <header className="glass sticky top-0 z-30 flex items-center justify-between border-x-0 border-t-0 px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2.5">
            <Avatar name={me.name} owner={isOwner} size={34} />
            <div className="leading-tight">
              <div className="text-sm font-bold">{me.name}</div>
              <div className="text-[11px] text-muted">
                {mode === 'owner' ? 'Modo dueño' : isInventory ? 'Inventario' : 'Vendedor'} · <DolarChip className="!gap-1" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                type="button"
                onClick={() => setOwnerMode(!ownerMode)}
                className={cn('icon-btn !h-10 !w-10', ownerMode ? 'bg-ios-orange/20 text-ios-orange' : 'btn-neu')}
                aria-label={ownerMode ? 'Volver a modo vendedor' : 'Modo dueño'}
                title={ownerMode ? 'Volver a modo vendedor' : 'Modo dueño'}
              >
                <Crown size={17} />
              </button>
            )}
            <Link to="/" className="icon-btn btn-neu !h-10 !w-10" aria-label="Ver tienda">
              <Eye size={17} />
            </Link>
            <button type="button" onClick={logout} className="icon-btn btn-neu !h-10 !w-10" aria-label="Salir">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        {isDemo && (
          <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ios-orange/10 px-4 py-2.5 text-xs text-ios-orange lg:mx-6">
            <span>
              <b>Modo demo:</b> datos de ejemplo guardados solo en este navegador.
            </span>
            <button type="button" onClick={() => confirm('¿Volver a los datos de ejemplo?') && resetDemo()} className="flex items-center gap-1 font-semibold">
              <RotateCcw size={13} /> Reiniciar demo
            </button>
          </div>
        )}
        {data.error && <div className="mx-4 mt-4 rounded-2xl bg-ios-red/10 p-3 text-sm text-ios-red lg:mx-6">{data.error}</div>}

        <div className="px-4 pt-5 lg:px-6 lg:pt-6">
          <Routes>
            <Route index element={home} />
            {mode === 'seller' && (
              <>
                <Route path="clientes" element={<Clients {...ctx} />} />
                <Route path="calendario" element={<Calendar {...ctx} />} />
                <Route path="ventas" element={<Sales {...ctx} />} />
              </>
            )}
            {mode === 'owner' && (
              <>
                <Route path="interesados" element={<Leads {...ctx} />} />
                <Route path="cotizador" element={<TradeInAdmin {...ctx} />} />
                <Route path="ventas" element={<Sales {...ctx} />} />
                <Route path="publicidad" element={<Ads {...ctx} />} />
                <Route path="inversion" element={<Purchases {...ctx} />} />
                <Route path="equipo" element={<Team {...ctx} />} />
              </>
            )}
            {mode === 'inventory' && (
              <>
                <Route path="cargar" element={<Import {...ctx} />} />
                <Route path="resenas" element={<ReviewsAdmin {...ctx} />} />
              </>
            )}
            <Route path="*" element={home} />
          </Routes>
        </div>
      </div>

      {/* barra de pestañas estilo iOS (celular) */}
      <nav className="glass fixed inset-x-0 bottom-0 z-40 flex items-end justify-around border-x-0 border-b-0 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        {mode === 'seller' ? (
          <>
            {nav.slice(0, 2).map(n => <TabLink key={n.to} n={n} />)}
            <button
              type="button"
              onClick={() => setSale({})}
              className="-mt-7 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-b from-[#8b5cf6] to-[#4f46e5] text-white shadow-[0_12px_28px_-8px_rgba(124,58,237,0.9),inset_0_1px_0_rgba(255,255,255,0.3)] ring-[6px] ring-[#0e1016] active:scale-95"
              aria-label="Nueva venta"
            >
              <Plus size={28} strokeWidth={2.4} />
            </button>
            {nav.slice(2).map(n => <TabLink key={n.to} n={n} />)}
          </>
        ) : nav.length > 5 ? (
          <>
            {nav.slice(0, 4).map(n => <TabLink key={n.to} n={n} badge={n.badge === 'leads' ? newLeads : 0} />)}
            <button type="button" onClick={() => setMore(true)} className="flex min-w-[58px] flex-col items-center gap-1 py-1 text-[10px] font-semibold text-faint">
              <MoreHorizontal size={22} />
              Más
            </button>
          </>
        ) : (
          nav.map(n => <TabLink key={n.to} n={n} />)
        )}
      </nav>
      <Sheet open={more} onClose={() => setMore(false)} title="Más">
        <div className="grid grid-cols-3 gap-3">
          {nav.slice(4).map(n => (
            <NavLink key={n.to} to={n.to} onClick={() => setMore(false)} className="neu flex flex-col items-center gap-2 p-4 text-sm font-semibold">
              <n.icon size={22} className="text-violet-400" /> {n.label}
            </NavLink>
          ))}
        </div>
      </Sheet>

      <SaleSheet open={!!sale} initial={sale} onClose={() => setSale(null)} {...ctx} />
      <ReminderSheet open={!!reminder} initial={reminder} onClose={() => setReminder(null)} clients={data.clients.filter(c => c.employee_id === me.id)} notify={setToast} />
      <ClientSheet open={!!client} initial={client} onClose={() => setClient(null)} notify={setToast} />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="glass fixed bottom-28 left-1/2 z-[90] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold whitespace-nowrap shadow-2xl lg:bottom-8"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabLink({ n, badge = 0 }) {
  return (
    <NavLink to={n.to} end={n.end} className={({ isActive }) => cn('relative flex min-w-[58px] flex-col items-center gap-1 py-1 text-[10px] font-semibold', isActive ? 'text-violet-400' : 'text-faint')}>
      {badge > 0 && <span className="absolute top-0 right-2 grid h-4 min-w-4 place-items-center rounded-full bg-ios-red px-1 text-[10px] font-bold text-white">{badge}</span>}
      <n.icon size={22} />
      {n.label}
    </NavLink>
  );
}
