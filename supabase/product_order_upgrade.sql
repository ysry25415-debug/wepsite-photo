-- OASIS product ordering upgrade
-- Run this once in Supabase > SQL Editor before using the new product checkout.

alter table public.orders
  add column if not exists product_name text,
  add column if not exists product_image_url text,
  add column if not exists selected_product_image_url text,
  add column if not exists selected_product_size text;

-- Make sure the signed-in store manager can update and view every order.
-- This assumes you have already run complete_setup.sql.
insert into public.profiles (id, role)
select id, 'admin'
from auth.users
where email = 'codexa031@gmail.com'
on conflict (id) do update set role = 'admin';
