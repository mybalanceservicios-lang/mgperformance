import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import Instagram from './InstagramIcon';
import { STORE } from '@/config';
import { Logo } from './Header';
import WhatsAppIcon from './WhatsAppIcon';
import { waLink } from '@/lib/utils';

export default function Footer() {
  return (
    <footer id="contacto" className="mx-auto mt-20 max-w-7xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="ml-panel grid gap-8 p-7 md:grid-cols-[1.3fr_1fr_1fr] md:p-10">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{STORE.tagline}</p>
        </div>
        <div className="space-y-3 text-sm">
          <h3 className="text-xs font-semibold tracking-widest text-faint uppercase">Contacto</h3>
          <a href={waLink(`Hola ${STORE.name}! Tengo una consulta.`)} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-muted hover:text-ink">
            <WhatsAppIcon className="h-4 w-4 text-ios-green" /> WhatsApp
          </a>
          <a href={`https://instagram.com/${STORE.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-muted hover:text-ink">
            <Instagram size={16} className="text-ios-purple" /> @{STORE.instagram}
          </a>
          <span className="flex items-center gap-2.5 text-muted">
            <MapPin size={16} className="text-ios-orange" /> {STORE.city}
          </span>
        </div>
        <div className="space-y-3 text-sm">
          <h3 className="text-xs font-semibold tracking-widest text-faint uppercase">Tienda</h3>
          <a href="#/" className="block text-muted hover:text-ink">Ver equipos</a>
          <Link to="/admin" className="block text-muted hover:text-ink">Acceso equipo</Link>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-faint">
        © {new Date().getFullYear()} {STORE.name}. iPhone es una marca de Apple Inc. No somos distribuidores oficiales.
      </p>
    </footer>
  );
}
