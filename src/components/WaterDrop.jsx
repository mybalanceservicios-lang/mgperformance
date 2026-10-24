import { useEffect } from 'react';

// Efecto leve de "gota de agua" donde se toca la pantalla.
export default function WaterDrop() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onDown = e => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      for (const cls of ['water-drop', 'water-drop second']) {
        const el = document.createElement('span');
        el.className = cls;
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
      }
    };
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);
  return null;
}
