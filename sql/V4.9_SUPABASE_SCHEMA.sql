-- Build My Home V4.9 Cloud + Payment
-- Run once in Supabase SQL Editor. RLS is mandatory for user-owned data.

create extension if not exists pgcrypto;

create table if not exists public.bmh_projects (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  version text not null default '4.9.0',
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bmh_projects_user_updated_idx on public.bmh_projects(user_id, updated_at desc);
alter table public.bmh_projects enable row level security;
drop policy if exists "bmh_projects_select_own" on public.bmh_projects;
drop policy if exists "bmh_projects_insert_own" on public.bmh_projects;
drop policy if exists "bmh_projects_update_own" on public.bmh_projects;
drop policy if exists "bmh_projects_delete_own" on public.bmh_projects;
create policy "bmh_projects_select_own" on public.bmh_projects for select to authenticated using (auth.uid() = user_id);
create policy "bmh_projects_insert_own" on public.bmh_projects for insert to authenticated with check (auth.uid() = user_id);
create policy "bmh_projects_update_own" on public.bmh_projects for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "bmh_projects_delete_own" on public.bmh_projects for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.bmh_projects to authenticated;

create table if not exists public.bmh_payments (
  order_code bigint primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null,
  amount integer not null check (amount > 0),
  status text not null default 'pending',
  description text,
  payment_link_id text,
  checkout_url text,
  provider_payload jsonb,
  provider_webhook jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists bmh_payments_user_created_idx on public.bmh_payments(user_id, created_at desc);
alter table public.bmh_payments enable row level security;
drop policy if exists "bmh_payments_select_own" on public.bmh_payments;
create policy "bmh_payments_select_own" on public.bmh_payments for select to authenticated using (auth.uid() = user_id);
grant select on public.bmh_payments to authenticated;

create table if not exists public.bmh_entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null,
  active boolean not null default true,
  source text not null default 'payos',
  order_code bigint,
  paid_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, product_code)
);
alter table public.bmh_entitlements enable row level security;
drop policy if exists "bmh_entitlements_select_own" on public.bmh_entitlements;
create policy "bmh_entitlements_select_own" on public.bmh_entitlements for select to authenticated using (auth.uid() = user_id);
grant select on public.bmh_entitlements to authenticated;

-- IMPORTANT: Do not grant client insert/update/delete on payments or entitlements.
-- Vercel server functions use SUPABASE_SECRET_KEY (or legacy service role) for those writes.
