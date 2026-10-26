import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Marca de agua "Diseñado por RT Design" (igual que en la web de Bast).
// En la tienda aparece al llegar al pie de página; con "always" queda fija.
export default function RtWatermark({ always = false, className }) {
  const [show, setShow] = useState(always);

  useEffect(() => {
    if (always) return undefined;
    const footer = document.getElementById('contacto');
    if (!footer) return undefined;
    const io = new IntersectionObserver(([e]) => setShow(e.isIntersecting), { threshold: 0 });
    io.observe(footer);
    return () => io.disconnect();
  }, [always]);

  return (
    <a
      href="https://www.instagram.com/rt.designweb/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Diseñado por RT Design — abrir Instagram"
      className={cn(
        'fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[60] inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/15 px-3.5 py-2 text-[11px] font-extrabold tracking-wide text-white/80 backdrop-blur-md transition-all duration-300 hover:bg-violet-500/25',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        className
      )}
    >
      <span className="h-[5px] w-[5px] shrink-0 rotate-45 rounded-[1px] bg-violet-300" />
      Diseñado por <b className="font-extrabold text-violet-300">RT Design</b>
    </a>
  );
}
