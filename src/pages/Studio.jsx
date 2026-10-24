// Página interna (no enlazada): renderiza el iPhone 3D para generar imágenes de ejemplo.
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeroPhones, PhoneStudio } from '@/components/Phone3D';

export default function Studio() {
  const [q] = useSearchParams();
  useEffect(() => {
    document.body.style.background = q.get('bg') ?? 'transparent';
  }, [q]);
  if (q.get('hero')) return <HeroPhones className="h-dvh w-dvw" />;
  return (
    <div className="grid h-dvh w-dvw place-items-center" style={{ background: q.get('bg') ?? 'transparent' }}>
      <PhoneStudio className="h-full w-full" color={q.get('c') ?? '#5b4a72'} variant={q.get('v') ?? 'pro'} view={q.get('view') ?? 'angle'} />
    </div>
  );
}
