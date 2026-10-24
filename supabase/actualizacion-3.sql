-- ═══════════════════════════════════════════════════════════════
--  Actualización 3 — Cotizador de usados e Interesados
--  · Valores base para cotizar usados (los define Matías)
--  · Interesados: cotizaciones y "avisame cuando entre" que llegan desde la web
--  Pegá TODO en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.
--  (Necesita haber corrido antes schema.sql, actualizacion-1.sql y actualizacion-2.sql)
-- ═══════════════════════════════════════════════════════════════

-- ───────────── Valores del cotizador ─────────────
-- "value" = cuánto se toma ese modelo/capacidad en estado impecable y batería 90% o más (en US$).
create table if not exists public.trade_in_prices (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  storage text not null,
  value numeric not null check (value >= 0),
  updated_at timestamptz not null default now(),
  unique (model, storage)
);
alter table public.trade_in_prices enable row level security;
drop policy if exists "cotizador público" on public.trade_in_prices;
create policy "cotizador público" on public.trade_in_prices for select using (true);
drop policy if exists "dueño gestiona cotizador" on public.trade_in_prices;
create policy "dueño gestiona cotizador" on public.trade_in_prices for all using (public.is_owner()) with check (public.is_owner());

-- Parámetros del cotizador (porcentajes por estado, batería, falla y rango). Los edita Matías.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
drop policy if exists "ajustes públicos" on public.app_settings;
create policy "ajustes públicos" on public.app_settings for select using (true);
drop policy if exists "dueño edita ajustes" on public.app_settings;
create policy "dueño edita ajustes" on public.app_settings for all using (public.is_owner()) with check (public.is_owner());

-- ───────────── Interesados ─────────────
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('cotizacion', 'aviso')),
  name text not null check (char_length(name) between 1 and 80),
  phone text not null check (char_length(phone) between 6 and 30),
  model text check (char_length(model) <= 80),
  storage text check (char_length(storage) <= 20),
  details jsonb not null default '{}',
  estimate_min numeric,
  estimate_max numeric,
  status text not null default 'nuevo' check (status in ('nuevo', 'contactado', 'cerrado')),
  notes text,
  contacted_at timestamptz
);
create index if not exists leads_created_idx on public.leads (created_at desc);
alter table public.leads enable row level security;

-- Cualquiera puede dejar sus datos desde la web (solo como "nuevo"); solo el dueño los ve y gestiona.
drop policy if exists "la web carga interesados" on public.leads;
create policy "la web carga interesados" on public.leads for insert to anon, authenticated
  with check (status = 'nuevo' and notes is null and contacted_at is null);
drop policy if exists "dueño ve interesados" on public.leads;
create policy "dueño ve interesados" on public.leads for select using (public.is_owner());
drop policy if exists "dueño edita interesados" on public.leads;
create policy "dueño edita interesados" on public.leads for update using (public.is_owner());
drop policy if exists "dueño borra interesados" on public.leads;
create policy "dueño borra interesados" on public.leads for delete using (public.is_owner());

-- Valores de ejemplo para el cotizador (ajustalos desde Modo dueño → Cotizador)
insert into public.trade_in_prices (model, storage, value) values
  ('iPhone 11', '64GB', 160), ('iPhone 11', '128GB', 185),
  ('iPhone 11 Pro', '64GB', 210), ('iPhone 11 Pro Max', '64GB', 250),
  ('iPhone 12', '64GB', 230), ('iPhone 12', '128GB', 260),
  ('iPhone 12 Pro', '128GB', 320), ('iPhone 12 Pro Max', '128GB', 370),
  ('iPhone 13', '128GB', 330), ('iPhone 13 Pro', '128GB', 430), ('iPhone 13 Pro Max', '128GB', 490),
  ('iPhone 14', '128GB', 400), ('iPhone 14 Pro', '128GB', 540), ('iPhone 14 Pro Max', '128GB', 610),
  ('iPhone 15', '128GB', 520), ('iPhone 15 Pro', '128GB', 680), ('iPhone 15 Pro Max', '256GB', 820),
  ('iPhone 16', '128GB', 650), ('iPhone 16 Pro', '128GB', 850), ('iPhone 16 Pro Max', '256GB', 1020)
on conflict (model, storage) do nothing;
