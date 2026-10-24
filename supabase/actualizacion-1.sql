-- ═══════════════════════════════════════════════════════════════
--  Actualización 1 — diagnóstico 3D, reseñas y publicaciones de ejemplo
--  Pegá TODO en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.
-- ═══════════════════════════════════════════════════════════════

-- Diagnóstico de cada equipo: chequeos (Face ID, cámaras…) y marcas sobre el iPhone 3D
alter table public.products add column if not exists diagnostics jsonb not null default '{}';

-- Reseñas de clientes (se muestran en la tienda)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  text text not null,
  rating int not null default 5 check (rating between 1 and 5),
  model text,
  photo_url text,
  active boolean not null default true
);
alter table public.reviews enable row level security;
drop policy if exists "reseñas públicas" on public.reviews;
create policy "reseñas públicas" on public.reviews for select using (active or public.is_owner());
drop policy if exists "dueño gestiona reseñas" on public.reviews;
create policy "dueño gestiona reseñas" on public.reviews for all using (public.is_owner()) with check (public.is_owner());

-- Publicaciones de ejemplo (iPhones ficticios). Para borrarlas todas después:
--   delete from public.products where id::text like '00000000-0000-4000-8000-%';
insert into public.products (id, model, storage, color, condition, battery, price, compare_price, description, includes, warranty, status, featured, media, stock, diagnostics, created_at) values
  ('00000000-0000-4000-8000-000000000001', $q$iPhone 16 Pro Max$q$, $q$256GB$q$, $q$Titanio desierto$q$, $q$nuevo$q$, 100, 1450, null, $q$Equipo nuevo, en caja sellada. Lo activás vos.

(Publicación de ejemplo)$q$, $q${"Caja","Cable USB-C"}$q$::text[], $q$12 meses oficial Apple$q$, $q$disponible$q$, true, $q$[{"id":"16promax-desierto-2","type":"image","url":"demo/16promax-desierto-2.webp","path":null},{"id":"16promax-desierto-v","type":"video","url":"demo/16promax-desierto.mp4","path":null},{"id":"16promax-desierto-1","type":"image","url":"demo/16promax-desierto-1.webp","path":null},{"id":"16promax-desierto-3","type":"image","url":"demo/16promax-desierto-3.webp","path":null}]$q$::jsonb, 3, $q${"checks":{},"marks":[]}$q$::jsonb, now() - interval '0 days'),
  ('00000000-0000-4000-8000-000000000002', $q$iPhone 16 Pro$q$, $q$128GB$q$, $q$Titanio negro$q$, $q$como-nuevo$q$, 99, 1090, 1180, $q$Usado 2 meses, siempre con funda y vidrio. Impecable.

(Publicación de ejemplo)$q$, $q${"Caja","Cable USB-C"}$q$::text[], $q$6 meses$q$, $q$disponible$q$, true, $q$[{"id":"16pro-negro-2","type":"image","url":"demo/16pro-negro-2.webp","path":null},{"id":"16pro-negro-1","type":"image","url":"demo/16pro-negro-1.webp","path":null},{"id":"16pro-negro-3","type":"image","url":"demo/16pro-negro-3.webp","path":null}]$q$::jsonb, 1, $q${"checks":{"faceid":true,"truetone":true,"pantalla":true,"camaras":true,"audio":true,"carga":true,"botones":true,"senal":true,"sinreparar":true},"marks":[]}$q$::jsonb, now() - interval '1 days'),
  ('00000000-0000-4000-8000-000000000003', $q$iPhone 15 Pro Max$q$, $q$256GB$q$, $q$Titanio natural$q$, $q$usado-premium$q$, 92, 920, null, $q$Excelente estado. Un detalle mínimo en el marco, mirá el diagnóstico 3D.

(Publicación de ejemplo)$q$, $q${"Cable USB-C"}$q$::text[], $q$3 meses$q$, $q$disponible$q$, true, $q$[{"id":"15promax-natural-2","type":"image","url":"demo/15promax-natural-2.webp","path":null},{"id":"15promax-natural-v","type":"video","url":"demo/15promax-natural.mp4","path":null},{"id":"15promax-natural-1","type":"image","url":"demo/15promax-natural-1.webp","path":null},{"id":"15promax-natural-3","type":"image","url":"demo/15promax-natural-3.webp","path":null}]$q$::jsonb, 1, $q${"checks":{"faceid":true,"truetone":true,"pantalla":true,"camaras":true,"audio":true,"carga":true,"botones":true,"senal":true,"sinreparar":true},"marks":[{"id":"m1","side":"back","x":0.62,"y":-0.86,"title":"Marca mínima en esquina inferior","note":"Solo se ve con luz directa. No afecta el uso.","media_id":"15promax-natural-v"}]}$q$::jsonb, now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000000004', $q$iPhone 15$q$, $q$128GB$q$, $q$Rosa$q$, $q$como-nuevo$q$, 97, 640, null, $q$Como nuevo, sin marcas de uso.

(Publicación de ejemplo)$q$, $q${"Caja","Cable USB-C"}$q$::text[], $q$6 meses$q$, $q$disponible$q$, false, $q$[{"id":"15-rosa-2","type":"image","url":"demo/15-rosa-2.webp","path":null},{"id":"15-rosa-1","type":"image","url":"demo/15-rosa-1.webp","path":null},{"id":"15-rosa-3","type":"image","url":"demo/15-rosa-3.webp","path":null}]$q$::jsonb, 1, $q${"checks":{"faceid":true,"truetone":true,"pantalla":true,"camaras":true,"audio":true,"carga":true,"botones":true,"senal":true,"sinreparar":true},"marks":[]}$q$::jsonb, now() - interval '3 days'),
  ('00000000-0000-4000-8000-000000000005', $q$iPhone 14 Pro$q$, $q$256GB$q$, $q$Morado oscuro$q$, $q$usado-premium$q$, 88, 610, null, $q$Muy buen estado general. Batería 88%.

(Publicación de ejemplo)$q$, $q${"Cable"}$q$::text[], $q$3 meses$q$, $q$disponible$q$, false, $q$[{"id":"14pro-morado-2","type":"image","url":"demo/14pro-morado-2.webp","path":null},{"id":"14pro-morado-v","type":"video","url":"demo/14pro-morado.mp4","path":null},{"id":"14pro-morado-1","type":"image","url":"demo/14pro-morado-1.webp","path":null},{"id":"14pro-morado-3","type":"image","url":"demo/14pro-morado-3.webp","path":null}]$q$::jsonb, 1, $q${"checks":{"faceid":true,"truetone":true,"pantalla":true,"camaras":true,"audio":true,"carga":true,"botones":true,"senal":true,"sinreparar":true},"marks":[{"id":"m1","side":"front","x":-0.55,"y":0.78,"title":"Microrayón en pantalla","note":"Arriba a la izquierda, no se nota con la pantalla encendida.","media_id":"14pro-morado-v"}]}$q$::jsonb, now() - interval '4 days'),
  ('00000000-0000-4000-8000-000000000006', $q$iPhone 14$q$, $q$128GB$q$, $q$Azul$q$, $q$usado$q$, 85, 430, null, $q$Funciona perfecto. Tiene marcas leves de uso en el dorso.

(Publicación de ejemplo)$q$, $q${}$q$::text[], $q$3 meses$q$, $q$disponible$q$, false, $q$[{"id":"14-azul-2","type":"image","url":"demo/14-azul-2.webp","path":null},{"id":"14-azul-1","type":"image","url":"demo/14-azul-1.webp","path":null},{"id":"14-azul-3","type":"image","url":"demo/14-azul-3.webp","path":null}]$q$::jsonb, 1, $q${"checks":{"faceid":true,"truetone":true,"pantalla":true,"camaras":true,"audio":true,"carga":true,"botones":true,"senal":true,"sinreparar":true},"marks":[{"id":"m1","side":"back","x":0.2,"y":-0.3,"title":"Rayones leves en el dorso","note":"Marcas finas de uso diario.","media_id":"14-azul-2"},{"id":"m2","side":"front","x":0.7,"y":-0.9,"title":"Golpe chico en el marco","note":"Esquina inferior derecha.","media_id":"14-azul-2"}]}$q$::jsonb, now() - interval '5 days'),
  ('00000000-0000-4000-8000-000000000007', $q$iPhone 13 Pro Max$q$, $q$512GB$q$, $q$Azul alpino$q$, $q$usado-premium$q$, 90, 560, null, $q$512GB, ideal para fotos y video.

(Publicación de ejemplo)$q$, $q${"Cable"}$q$::text[], $q$3 meses$q$, $q$disponible$q$, false, $q$[{"id":"13promax-alpino-2","type":"image","url":"demo/13promax-alpino-2.webp","path":null},{"id":"13promax-alpino-1","type":"image","url":"demo/13promax-alpino-1.webp","path":null},{"id":"13promax-alpino-3","type":"image","url":"demo/13promax-alpino-3.webp","path":null}]$q$::jsonb, 1, $q${"checks":{"faceid":true,"truetone":true,"pantalla":true,"camaras":true,"audio":true,"carga":true,"botones":true,"senal":true,"sinreparar":true},"marks":[]}$q$::jsonb, now() - interval '6 days'),
  ('00000000-0000-4000-8000-000000000008', $q$iPhone 13$q$, $q$128GB$q$, $q$Blanco estelar$q$, $q$usado$q$, 83, 340, null, $q$Buen estado. Batería 83%.

(Publicación de ejemplo)$q$, $q${}$q$::text[], $q$3 meses$q$, $q$reservado$q$, false, $q$[{"id":"13-estelar-2","type":"image","url":"demo/13-estelar-2.webp","path":null},{"id":"13-estelar-1","type":"image","url":"demo/13-estelar-1.webp","path":null},{"id":"13-estelar-3","type":"image","url":"demo/13-estelar-3.webp","path":null}]$q$::jsonb, 1, $q${"checks":{"faceid":true,"truetone":false,"pantalla":true,"camaras":true,"audio":true,"carga":true,"botones":true,"senal":true,"sinreparar":true},"marks":[{"id":"m1","side":"back","x":-0.1,"y":0.1,"title":"Desgaste en el vidrio trasero","note":"Marcas de uso visibles de cerca.","media_id":"13-estelar-2"}]}$q$::jsonb, now() - interval '7 days'),
  ('00000000-0000-4000-8000-000000000009', $q$iPhone 16e$q$, $q$128GB$q$, $q$Negro$q$, $q$nuevo$q$, 100, 690, null, $q$Nuevo en caja sellada.

(Publicación de ejemplo)$q$, $q${"Caja","Cable USB-C"}$q$::text[], $q$12 meses oficial Apple$q$, $q$disponible$q$, false, $q$[{"id":"16e-negro-2","type":"image","url":"demo/16e-negro-2.webp","path":null},{"id":"16e-negro-1","type":"image","url":"demo/16e-negro-1.webp","path":null},{"id":"16e-negro-3","type":"image","url":"demo/16e-negro-3.webp","path":null}]$q$::jsonb, 2, $q${"checks":{},"marks":[]}$q$::jsonb, now() - interval '8 days'),
  ('00000000-0000-4000-8000-000000000010', $q$iPhone Air$q$, $q$256GB$q$, $q$Blanco$q$, $q$como-nuevo$q$, 100, 1050, null, $q$El más fino. Como nuevo.

(Publicación de ejemplo)$q$, $q${"Caja","Cable USB-C"}$q$::text[], $q$6 meses$q$, $q$disponible$q$, false, $q$[{"id":"air-blanco-2","type":"image","url":"demo/air-blanco-2.webp","path":null},{"id":"air-blanco-1","type":"image","url":"demo/air-blanco-1.webp","path":null},{"id":"air-blanco-3","type":"image","url":"demo/air-blanco-3.webp","path":null}]$q$::jsonb, 1, $q${"checks":{"faceid":true,"truetone":true,"pantalla":true,"camaras":true,"audio":true,"carga":true,"botones":true,"senal":true,"sinreparar":true},"marks":[]}$q$::jsonb, now() - interval '9 days')
on conflict (id) do nothing;

insert into public.product_prices (product_id, owner_price) values
  ('00000000-0000-4000-8000-000000000001', 1280),
  ('00000000-0000-4000-8000-000000000002', 960),
  ('00000000-0000-4000-8000-000000000003', 810),
  ('00000000-0000-4000-8000-000000000004', 560),
  ('00000000-0000-4000-8000-000000000005', 540),
  ('00000000-0000-4000-8000-000000000006', 380),
  ('00000000-0000-4000-8000-000000000007', 490),
  ('00000000-0000-4000-8000-000000000008', 300),
  ('00000000-0000-4000-8000-000000000009', 610),
  ('00000000-0000-4000-8000-000000000010', 920)
on conflict (product_id) do nothing;
