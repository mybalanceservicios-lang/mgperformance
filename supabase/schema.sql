-- ═══════════════════════════════════════════════════════════════
--  MG Performance — base de datos (Supabase / Postgres)
--  Pegá TODO este archivo en Supabase → SQL Editor → Run.
--  Se puede volver a correr sin romper nada.
-- ═══════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ───────────── Perfiles (dueño y empleados) ─────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text,
  role text not null default 'employee' check (role in ('owner', 'employee')),
  active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Cada cuenta nueva queda como empleado INACTIVO hasta que el dueño la activa.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active);
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active and role = 'owner');
$$;

-- ───────────── Productos (publicaciones) ─────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  model text not null,
  storage text,
  color text,
  condition text not null default 'usado',
  battery int check (battery between 0 and 100),
  price numeric,
  compare_price numeric,
  description text,
  includes text[] not null default '{}',
  warranty text,
  status text not null default 'disponible' check (status in ('disponible', 'reservado', 'vendido')),
  featured boolean not null default false,
  media jsonb not null default '[]',
  stock int not null default 1 check (stock >= 0),
  created_by uuid references public.profiles (id) on delete set null default auth.uid()
);

-- Precio que el empleado le tiene que rendir al dueño. Privado: el público no lo ve.
create table if not exists public.product_prices (
  product_id uuid primary key references public.products on delete cascade,
  owner_price numeric,
  updated_at timestamptz not null default now()
);

-- ───────────── Ventas ─────────────
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  product_id uuid references public.products on delete set null,
  product_label text,
  employee_id uuid not null references public.profiles (id) default auth.uid(),
  qty int not null default 1 check (qty > 0),
  unit_price numeric not null check (unit_price >= 0),
  owner_price numeric not null default 0,
  payment_method text,
  customer text,
  notes text,
  settled boolean not null default false,
  settled_at timestamptz
);
create index if not exists sales_created_idx on public.sales (created_at desc);
create index if not exists sales_employee_idx on public.sales (employee_id);

-- Al registrar una venta: valida stock, congela el precio a rendir y descuenta stock.
create or replace function public.before_sale_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p public.products%rowtype;
begin
  if not public.is_owner() then
    new.employee_id := auth.uid();
    new.settled := false;
    new.settled_at := null;
  end if;

  select * into p from public.products where id = new.product_id for update;
  if not found then
    raise exception 'El producto no existe';
  end if;
  if p.stock < new.qty then
    raise exception 'Stock insuficiente: quedan % unidades', p.stock;
  end if;

  new.product_label := concat_ws(' · ', p.model, p.storage, p.color);
  new.owner_price := coalesce((select owner_price from public.product_prices where product_id = p.id), 0);

  update public.products
     set stock = stock - new.qty,
         status = case when stock - new.qty = 0 then 'vendido' else status end
   where id = p.id;
  return new;
end $$;

drop trigger if exists sales_before_insert on public.sales;
create trigger sales_before_insert before insert on public.sales
  for each row execute function public.before_sale_insert();

-- Si se borra una venta, el stock vuelve.
create or replace function public.after_sale_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.products
     set stock = stock + old.qty,
         status = case when status = 'vendido' then 'disponible' else status end
   where id = old.product_id;
  return old;
end $$;

drop trigger if exists sales_after_delete on public.sales;
create trigger sales_after_delete after delete on public.sales
  for each row execute function public.after_sale_delete();

-- ───────────── Seguridad (RLS) ─────────────
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_prices enable row level security;
alter table public.sales enable row level security;

drop policy if exists "perfil propio o dueño" on public.profiles;
create policy "perfil propio o dueño" on public.profiles for select
  using (id = auth.uid() or public.is_owner());
drop policy if exists "dueño edita perfiles" on public.profiles;
create policy "dueño edita perfiles" on public.profiles for update
  using (public.is_owner());

drop policy if exists "productos públicos" on public.products;
create policy "productos públicos" on public.products for select using (true);
drop policy if exists "staff crea productos" on public.products;
create policy "staff crea productos" on public.products for insert with check (public.is_staff());
drop policy if exists "staff edita productos" on public.products;
create policy "staff edita productos" on public.products for update using (public.is_staff());
drop policy if exists "dueño borra productos" on public.products;
create policy "dueño borra productos" on public.products for delete using (public.is_owner());

drop policy if exists "staff ve precios" on public.product_prices;
create policy "staff ve precios" on public.product_prices for select using (public.is_staff());
drop policy if exists "dueño gestiona precios" on public.product_prices;
create policy "dueño gestiona precios" on public.product_prices for all
  using (public.is_owner()) with check (public.is_owner());

drop policy if exists "ventas propias o dueño" on public.sales;
create policy "ventas propias o dueño" on public.sales for select
  using (employee_id = auth.uid() or public.is_owner());
drop policy if exists "staff registra ventas" on public.sales;
create policy "staff registra ventas" on public.sales for insert with check (public.is_staff());
drop policy if exists "dueño edita ventas" on public.sales;
create policy "dueño edita ventas" on public.sales for update using (public.is_owner());
drop policy if exists "dueño borra ventas" on public.sales;
create policy "dueño borra ventas" on public.sales for delete using (public.is_owner());

-- ───────────── Fotos y videos (Storage) ─────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media pública" on storage.objects;
create policy "media pública" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "staff sube media" on storage.objects;
create policy "staff sube media" on storage.objects for insert with check (bucket_id = 'media' and public.is_staff());
drop policy if exists "staff borra media" on storage.objects;
create policy "staff borra media" on storage.objects for delete using (bucket_id = 'media' and public.is_staff());

-- ═══════════════════════════════════════════════════════════════
--  ÚLTIMO PASO (una sola vez): después de crear tu cuenta en /admin,
--  convertite en dueño reemplazando el email y corriendo:
--
--  update public.profiles set role = 'owner', active = true
--  where email = 'tu-email@gmail.com';
-- ═══════════════════════════════════════════════════════════════
