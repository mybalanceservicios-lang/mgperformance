// Protección básica contra copias del diseño en la tienda (no aplica al sistema de gestión).
// Nada en una página web es 100% inviolable, pero esto frena la copia casual:
// sin clic derecho, sin seleccionar texto, sin arrastrar imágenes y sin atajos para ver el código.
let active = false;

const isField = el => el?.closest?.('input, textarea, select, [contenteditable="true"]');

function onContext(e) {
  if (!isField(e.target)) e.preventDefault();
}
function onDrag(e) {
  if (e.target?.tagName === 'IMG' || e.target?.tagName === 'VIDEO') e.preventDefault();
}
function onKey(e) {
  const k = e.key?.toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  if (k === 'f12' || (mod && ['u', 's'].includes(k)) || (mod && e.shiftKey && ['i', 'j', 'c'].includes(k))) e.preventDefault();
}

export function setProtection(on) {
  if (on === active || typeof window === 'undefined') return;
  active = on;
  const method = on ? 'addEventListener' : 'removeEventListener';
  document[method]('contextmenu', onContext);
  document[method]('dragstart', onDrag);
  document[method]('keydown', onKey);
  document.documentElement.classList.toggle('protected', on);
}

if (typeof window !== 'undefined') {
  console.log('%c© MG Performance · Diseño y desarrollo: RT Design. Todos los derechos reservados.', 'color:#a78bfa;font-size:13px;font-weight:600');
}
