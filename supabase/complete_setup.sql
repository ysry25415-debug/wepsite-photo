-- OASIS Frames — complete Supabase setup
-- Run this whole file once in Supabase: SQL Editor > New query > Run.
-- It is designed for the React project in this folder.

-- 1) DATABASE TABLES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  phone text not null check (char_length(phone) between 6 and 30),
  address text not null check (char_length(address) between 5 and 500),
  governorate text not null,
  payment_method text not null,
  uploaded_image_url text,
  selected_frame_type text not null,
  selected_size text not null,
  order_status text not null default 'New'
    check (order_status in ('New', 'Confirmed', 'In production', 'Delivered', 'Cancelled')),
  total numeric(10,2) not null default 0 check (total >= 0)
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Update the timestamp of an edited store setting.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

-- 2) ADMIN HELPER (used only inside RLS policies)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- A profile is automatically created for every future Auth user.
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.create_profile_for_new_user();

-- 3) TURN ON RLS AND REPLACE OLD POLICIES
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists "customers create orders" on public.orders;
drop policy if exists "admin reads orders" on public.orders;
drop policy if exists "admin updates orders" on public.orders;
drop policy if exists "catalog is readable" on public.store_settings;
drop policy if exists "admin changes catalog" on public.store_settings;
drop policy if exists "admin can read profiles" on public.profiles;
drop policy if exists "admin can manage orders" on public.orders;
drop policy if exists "public can read storefront" on public.store_settings;
drop policy if exists "admin can manage storefront" on public.store_settings;

-- Customers can submit an order without creating an account.
create policy "customers create orders"
on public.orders for insert to anon, authenticated
with check (true);

-- Only accounts promoted to profiles.role = 'admin' can see or update orders.
create policy "admin can manage orders"
on public.orders for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "admin can read profiles"
on public.profiles for select to authenticated
using ((select public.is_admin()));

-- The homepage needs to read content; only the admin can write it.
create policy "public can read storefront"
on public.store_settings for select to anon, authenticated
using (true);
create policy "admin can manage storefront"
on public.store_settings for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- 4) STORAGE BUCKETS
-- order-uploads is public ONLY because the current frontend stores a public URL.
-- Do not upload ID cards, sensitive photos, or private documents here.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'order-uploads', 'order-uploads', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- store-assets is for offer banners, category images, and other public site visuals.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'store-assets', 'store-assets', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "customers upload artwork" on storage.objects;
drop policy if exists "public reads artwork" on storage.objects;
drop policy if exists "customers upload order artwork" on storage.objects;
drop policy if exists "admin can view all order artwork" on storage.objects;
drop policy if exists "admin manages store assets" on storage.objects;
drop policy if exists "public reads store assets" on storage.objects;

-- Public users may upload their print image, but cannot modify or remove it.
create policy "customers upload order artwork"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'order-uploads'
  and (storage.foldername(name))[1] = 'customer-art'
);

-- This SELECT policy is needed because Storage returns metadata after an upload.
create policy "public reads artwork"
on storage.objects for select to anon, authenticated
using (bucket_id = 'order-uploads');

-- Only the admin manages marketing assets (offers, banners, categories).
create policy "admin manages store assets"
on storage.objects for all to authenticated
using (bucket_id = 'store-assets' and (select public.is_admin()))
with check (bucket_id = 'store-assets' and (select public.is_admin()));

create policy "public reads store assets"
on storage.objects for select to anon, authenticated
using (bucket_id = 'store-assets');

-- 5) DEFAULT CONTENT SHOWN ON THE WEBSITE
insert into public.store_settings (key, value)
values (
  'catalog',
  '{
    "heroTitle": "Turn your memories into art.",
    "heroText": "Custom framed prints, made with care for the walls you love.",
    "promotion": "Complimentary delivery across Greater Cairo on orders over EGP 1,200",
    "prices": {"classic": 690, "forex": 490},
    "categories": [
      {"name": "Decor", "image": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=80"},
      {"name": "Nature", "image": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80"},
      {"name": "Quotes", "image": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80"},
      {"name": "Movies", "image": "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80"}
    ]
  }'::jsonb
)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- 6) AFTER YOU CREATE THE USER IN Authentication > Users,
-- run this one statement to grant that user access to the admin dashboard:
-- insert into public.profiles (id, role)
-- select id, 'admin' from auth.users where email = 'codexa031@gmail.com'
-- on conflict (id) do update set role = 'admin';
