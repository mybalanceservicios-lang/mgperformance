import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, Boxes, Clock, Eye, Loader2, LogOut, Plus, Receipt, RotateCcw, Users } from 'lucide-react';
import { Logo } from '@/components/Navbar';
import { Segmented } from '@/components/ui';
import { isDemo, supabase } from '@/lib/supabase';
import { demoProfiles, getMe, resetDemo, signIn, signOut, signUp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useAdminData } from './useAdminData';
import { Avatar } from './kit';
import Dashboard from './Dashboard';
import Sales from './Sales';
import Inventory from './Inventory';
import Team from './Team';
import SaleSheet from './SaleSheet';

/* ─────────────── Acceso ─────────────── */
function Login({ onDone }) {
  const [mode, setMode] = useState('login');
  const [who, setWho] = useState(isDemo ? 'owner' : '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const people = isDemo ? demoProfiles().filter(p => p.active) : [];

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'signup') {
        const res = await signUp(name, who, password);
        if (!res.session) {
          setInfo('Te enviamos un email para confirmar la cuenta. Después avisale al dueño para que te active.');
          return;
        }
      } else {
        await signIn(who, password);
      }
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <form onSubmit={submit} className="neu w-full max-w-sm p-7">
        <Logo />
        <h1 className="mt-7 text-2xl font-bold">Sistema de gestión</h1>
        <p className="mt-1 text-sm text-muted">Publicaciones, stock, ventas y comisiones en un solo lugar.</p>

        {!isDemo && (
          <Segmented
            className="mt-6"
            options={[{ value: 'login', label: 'Entrar' }, { value: 'signup', label: 'Soy nuevo' }]}
            value={mode}
            onChange={m => {
              setMode(m);
              setError('');
            }}
          />
        )}

        <div className="mt-6 space-y-4">
          {isDemo ? (
            <div>
              <span className="label">¿Quién sos?</span>
              <div className="grid grid-cols-3 gap-2.5">
                {people.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setWho(p.id)}
                    aria-pressed={who === p.id}
                    className={cn('flex flex-col items-center gap-2 rounded-2xl p-3 transition', who === p.id ? 'shadow-[var(--neu-in)] ring-1 ring-ios-blue/60' : 'neu-sm')}
                  >
                    <Avatar name={p.name} owner={p.role === 'owner'} />
                    <span className="text-xs font-semibold">{p.name}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 rounded-2xl bg-ios-orange/10 p-3 text-xs leading-relaxed text-ios-orange">
                Modo demo · contraseña del dueño: <b>admin</b> · empleados: <b>1234</b>
              </p>
            </div>
          ) : (
            <>
              {mode === 'signup' && (
                <div>
                  <label className="label" htmlFor="name">Tu nombre</label>
                  <input id="name" className="field" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
                </div>
              )}
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" type="email" className="field" value={who} onChange={e => setWho(e.target.value)} required autoComplete="email" />
              </div>
            </>
          )}
          <div>
            <label className="label" htmlFor="pass">Contraseña</label>
            <input
              id="pass"
              type="password"
              className="field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={mode === 'signup' ? 6 : undefined}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>
          {error && <p className="text-sm text-ios-red">{error}</p>}
          {info && <p className="text-sm text-ios-green">{info}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy && <Loader2 size={18} className="animate-spin" />} {mode === 'signup' ? 'Crear cuenta' : 'Entrar'}
          </button>
          <Link to="/" className="btn btn-ghost w-full">Volver a la tienda</Link>
        </div>
      </form>
    </main>
  );
}

function Pending({ me, onLogout }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="neu w-full max-w-sm p-7 text-center">
        <div className="neu-inset mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl text-ios-orange">
          <Clock size={28} />
        </div>
        <h1 className="text-xl font-bold">Cuenta pendiente</h1>
        <p className="mt-2 text-sm text-muted">
          Hola {me.name}. Tu cuenta ya está creada; falta que el dueño la active desde <b>Equipo</b>. Cuando lo haga, recargá esta página.
        </p>
        <button className="btn btn-neu mt-6 w-full" onClick={onLogout}>
          <LogOut size={16} /> Salir
        </button>
      </div>
    </main>
  );
}

/* ─────────────── Layout ─────────────── */
const NAV = [
  { to: '/admin', end: true, label: 'Resumen', icon: BarChart3, roles: ['owner', 'employee'] },
  { to: '/admin/ventas', label: 'Ventas', icon: Receipt, roles: ['owner', 'employee'] },
  { to: '/admin/inventario', label: 'Inventario', icon: Boxes, roles: ['owner', 'employee'] },
  { to: '/admin/equipo', label: 'Equipo', icon: Users, roles: ['owner'] }
];

export default function AdminApp({ products, reload: reloadProducts }) {
  const [me, setMe] = useState(undefined);
  const [saleOpen, setSaleOpen] = useState(false);
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
  if (!me) return <Login onDone={refreshMe} />;
  const logout = async () => {
    await signOut();
    await refreshMe();
    navigate('/admin');
  };
  if (!me.active) return <Pending me={me} onLogout={logout} />;

  const isOwner = me.role === 'owner';
  const nav = NAV.filter(n => n.roles.includes(me.role));
  const ctx = { me, isOwner, products, reloadProducts, ...data, notify: setToast, openSale: () => setSaleOpen(true) };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      {/* barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-dvh flex-col p-4 lg:flex">
        <div className="neu flex h-full flex-col p-4">
          <Logo className="px-1" />
          <nav className="mt-8 space-y-1.5">
            {nav.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition',
                    isActive ? 'text-ink shadow-[var(--neu-in)] [&>svg]:text-ios-blue' : 'text-muted hover:text-ink'
                  )
                }
              >
                <n.icon size={19} /> {n.label}
              </NavLink>
            ))}
          </nav>
          <button type="button" onClick={() => setSaleOpen(true)} className="btn btn-primary mt-6 w-full">
            <Plus size={19} /> Registrar venta
          </button>
          <div className="mt-auto space-y-3">
            <Link to="/" className="flex items-center gap-2 px-2 text-sm text-muted hover:text-ink">
              <Eye size={16} /> Ver tienda
            </Link>
            <div className="neu-inset flex items-center gap-3 rounded-2xl p-2.5">
              <Avatar name={me.name} owner={isOwner} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{me.name}</div>
                <div className="text-xs text-muted">{isOwner ? 'Dueño' : 'Empleado'}</div>
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
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/" className="icon-btn btn-neu !h-10 !w-10" aria-label="Ver tienda"><Eye size={17} /></Link>
            <button type="button" onClick={logout} className="icon-btn btn-neu !h-10 !w-10" aria-label="Salir"><LogOut size={17} /></button>
          </div>
        </header>

        {isDemo && (
          <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ios-orange/10 px-4 py-2.5 text-xs text-ios-orange lg:mx-6">
            <span><b>Modo demo:</b> los datos son de ejemplo y quedan solo en este navegador.</span>
            <button
              type="button"
              onClick={() => confirm('¿Volver a los datos de ejemplo? Se borra lo que cargaste.') && resetDemo()}
              className="flex items-center gap-1 font-semibold"
            >
              <RotateCcw size={13} /> Reiniciar demo
            </button>
          </div>
        )}
        {data.error && <div className="mx-4 mt-4 rounded-2xl bg-ios-red/10 p-3 text-sm text-ios-red lg:mx-6">{data.error}</div>}

        <div className="px-4 pt-5 lg:px-6 lg:pt-6">
          <Routes>
            <Route index element={<Dashboard {...ctx} />} />
            <Route path="ventas" element={<Sales {...ctx} />} />
            <Route path="inventario" element={<Inventory {...ctx} />} />
            {isOwner && <Route path="equipo" element={<Team {...ctx} />} />}
            <Route path="*" element={<Dashboard {...ctx} />} />
          </Routes>
        </div>
      </div>

      {/* barra de pestañas estilo iOS (celular) */}
      <nav className="glass fixed inset-x-0 bottom-0 z-40 flex items-end justify-around border-x-0 border-b-0 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
        {nav.slice(0, 2).map(n => <TabLink key={n.to} n={n} />)}
        <button
          type="button"
          onClick={() => setSaleOpen(true)}
          className="-mt-7 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-b from-[#2a95ff] to-[#0a7bf0] text-white shadow-[0_12px_28px_-8px_rgba(10,132,255,0.9),inset_0_1px_0_rgba(255,255,255,0.3)] ring-[6px] ring-[#0e1016] active:scale-95"
          aria-label="Registrar venta"
        >
          <Plus size={28} strokeWidth={2.4} />
        </button>
        {nav.slice(2).map(n => <TabLink key={n.to} n={n} />)}
      </nav>

      <SaleSheet open={saleOpen} onClose={() => setSaleOpen(false)} {...ctx} />

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

function TabLink({ n }) {
  return (
    <NavLink
      to={n.to}
      end={n.end}
      className={({ isActive }) =>
        cn('flex min-w-[64px] flex-col items-center gap-1 py-1 text-[10px] font-semibold', isActive ? 'text-ios-blue' : 'text-faint')
      }
    >
      <n.icon size={23} />
      {n.label}
    </NavLink>
  );
}

