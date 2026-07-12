-- Run this once in the Supabase SQL editor before using the app.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null, phone text not null, address text not null,
  governorate text not null, payment_method text not null,
  uploaded_image_url text, selected_frame_type text not null,
  selected_size text not null, order_status text not null default 'New', total numeric not null default 0
);
create table if not exists public.store_settings (
  key text primary key, value jsonb not null default '{}'::jsonb
);
insert into storage.buckets (id, name, public) values ('order-uploads', 'order-uploads', true) on conflict (id) do nothing;

alter table public.orders enable row level security;
alter table public.store_settings enable row level security;

-- Public storefront: submit only; admin access belongs to your authenticated user.
create policy "customers create orders" on public.orders for insert to anon, authenticated with check (true);
create policy "admin reads orders" on public.orders for select to authenticated using ((auth.jwt() ->> 'email') = 'codexa031@gmail.com');
create policy "admin updates orders" on public.orders for update to authenticated using ((auth.jwt() ->> 'email') = 'codexa031@gmail.com');
create policy "catalog is readable" on public.store_settings for select using (true);
create policy "admin changes catalog" on public.store_settings for all to authenticated using ((auth.jwt() ->> 'email') = 'codexa031@gmail.com') with check ((auth.jwt() ->> 'email') = 'codexa031@gmail.com');

create policy "customers upload artwork" on storage.objects for insert to anon, authenticated with check (bucket_id = 'order-uploads');
create policy "public reads artwork" on storage.objects for select using (bucket_id = 'order-uploads');
