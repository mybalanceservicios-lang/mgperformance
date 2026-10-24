-- ═══════════════════════════════════════════════════════════════
--  Actualización 2 — Sistema de gestión estilo barbería
--  · Ingreso con cuadraditos + clave de 4 números (Alte, Tito, Tomás, Matías e Inventario)
--  · Clientes (CRM), calendario con recordatorios, publicidad e inversión
--  Pegá TODO en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.
--  (Necesita haber corrido antes schema.sql y actualizacion-1.sql)
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

-- ───────────── Perfiles: nuevos campos y rol "inventario" ─────────────
alter table public.profiles add column if not exists slug text unique;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists sort int not null default 0;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('owner', 'employee', 'inventory'));

create or replace function public.is_inventory() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and role in ('owner', 'inventory'));
$$;

-- Lista pública SOLO con nombres, para mostrar los cuadraditos del ingreso
create or replace view public.staff_directory as
  select id, name, role, slug, sort from public.profiles where active and slug is not null;
grant select on public.staff_directory to anon, authenticated;

-- Crea (o actualiza) una persona del equipo con su clave de 4 números
create or replace function public.upsert_staff(p_slug text, p_name text, p_role text, p_pin text, p_sort int default 0)
returns uuid language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_id uuid;
  v_email text := lower(p_slug) || '@staff.mgperformance.app';
begin
  if p_pin !~ '^\d{4}$' then raise exception 'La clave tiene que ser de 4 números'; end if;
  select id into v_id from auth.users where email = v_email;
  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
      crypt('mg-' || p_pin || '-pin', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('name', p_name), now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text, jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true), 'email', now(), now(), now());
  else
    update auth.users set encrypted_password = crypt('mg-' || p_pin || '-pin', gen_salt('bf')), updated_at = now() where id = v_id;
  end if;
  insert into public.profiles (id, email, name, role, active, slug, sort)
  values (v_id, v_email, p_name, p_role, true, lower(p_slug), p_sort)
  on conflict (id) do update set name = excluded.name, role = excluded.role, active = true, slug = excluded.slug, sort = excluded.sort;
  return v_id;
end $$;
revoke all on function public.upsert_staff(text, text, text, text, int) from public, anon, authenticated;

-- El dueño puede cambiar claves y sumar gente desde el sistema
create or replace function public.owner_upsert_staff(p_slug text, p_name text, p_role text, p_pin text, p_sort int default 0)
returns uuid language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'Solo el dueño puede hacer esto'; end if;
  return public.upsert_staff(p_slug, p_name, p_role, p_pin, p_sort);
end $$;

create or replace function public.owner_set_pin(p_slug text, p_pin text)
returns void language plpgsql security definer set search_path = public, extensions, auth as $$
begin
  if not public.is_owner() then raise exception 'Solo el dueño puede hacer esto'; end if;
  if p_pin !~ '^\d{4}$' then raise exception 'La clave tiene que ser de 4 números'; end if;
  update auth.users set encrypted_password = crypt('mg-' || p_pin || '-pin', gen_salt('bf')), updated_at = now()
   where id = (select id from public.profiles where slug = lower(p_slug));
end $$;

-- Equipo inicial (claves provisorias: cambialas desde Modo dueño → Equipo)
select public.upsert_staff('alte', 'Alte', 'employee', '1111', 1);
select public.upsert_staff('tito', 'Tito', 'employee', '2222', 2);
select public.upsert_staff('tomas', 'Tomás', 'employee', '3333', 3);
select public.upsert_staff('matias', 'Matías', 'owner', '7777', 4);
select public.upsert_staff('inventario', 'Inventario', 'inventory', '9999', 99);

-- ───────────── Publicaciones: solo Inventario y el dueño las cargan ─────────────
drop policy if exists "staff crea productos" on public.products;
drop policy if exists "inventario crea productos" on public.products;
create policy "inventario crea productos" on public.products for insert with check (public.is_inventory());
drop policy if exists "staff edita productos" on public.products;
drop policy if exists "inventario edita productos" on public.products;
create policy "inventario edita productos" on public.products for update using (public.is_inventory());
drop policy if exists "dueño borra productos" on public.products;
drop policy if exists "inventario borra productos" on public.products;
create policy "inventario borra productos" on public.products for delete using (public.is_inventory());

drop policy if exists "dueño gestiona precios" on public.product_prices;
drop policy if exists "inventario gestiona precios" on public.product_prices;
create policy "inventario gestiona precios" on public.product_prices for all using (public.is_inventory()) with check (public.is_inventory());

drop policy if exists "dueño gestiona reseñas" on public.reviews;
drop policy if exists "inventario gestiona reseñas" on public.reviews;
create policy "inventario gestiona reseñas" on public.reviews for all using (public.is_inventory()) with check (public.is_inventory());
drop policy if exists "reseñas públicas" on public.reviews;
create policy "reseñas públicas" on public.reviews for select using (active or public.is_inventory());

-- ───────────── Clientes (cada vendedor tiene los suyos) ─────────────
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  employee_id uuid not null references public.profiles (id) default auth.uid(),
  name text not null,
  phone text,
  interest text,
  notes text
);
create index if not exists clients_employee_idx on public.clients (employee_id);
alter table public.clients enable row level security;
drop policy if exists "clientes propios o dueño" on public.clients;
create policy "clientes propios o dueño" on public.clients for all
  using (employee_id = auth.uid() or public.is_owner())
  with check (employee_id = auth.uid() or public.is_owner());

-- La venta puede quedar asociada a un cliente
alter table public.sales add column if not exists client_id uuid references public.clients on delete set null;

-- ───────────── Calendario / recordatorios ─────────────
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  employee_id uuid not null references public.profiles (id) default auth.uid(),
  client_id uuid references public.clients on delete set null,
  date date not null,
  time time,
  title text not null,
  notes text,
  done boolean not null default false
);
create index if not exists reminders_date_idx on public.reminders (employee_id, date);
alter table public.reminders enable row level security;
drop policy if exists "recordatorios propios o dueño" on public.reminders;
create policy "recordatorios propios o dueño" on public.reminders for all
  using (employee_id = auth.uid() or public.is_owner())
  with check (employee_id = auth.uid() or public.is_owner());

-- ───────────── Gastos de publicidad (solo dueño) ─────────────
create table if not exists public.ad_expenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date date not null default current_date,
  platform text not null default 'Instagram',
  amount numeric not null check (amount >= 0), -- en la moneda de la tienda (US$)
  original_amount numeric,                     -- lo que se pagó, si fue en pesos
  original_currency text,
  rate numeric,                                -- cotización usada
  notes text
);
alter table public.ad_expenses add column if not exists original_amount numeric;
alter table public.ad_expenses add column if not exists original_currency text;
alter table public.ad_expenses add column if not exists rate numeric;
alter table public.ad_expenses enable row level security;
drop policy if exists "dueño gestiona publicidad" on public.ad_expenses;
create policy "dueño gestiona publicidad" on public.ad_expenses for all using (public.is_owner()) with check (public.is_owner());

-- ───────────── Inversión: equipos que entran (solo dueño) ─────────────
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date date not null default current_date,
  description text not null,
  qty int not null default 1 check (qty > 0),
  unit_cost numeric not null check (unit_cost >= 0),
  supplier text,
  notes text
);
alter table public.purchases enable row level security;
drop policy if exists "dueño gestiona inversión" on public.purchases;
create policy "dueño gestiona inversión" on public.purchases for all using (public.is_owner()) with check (public.is_owner());
