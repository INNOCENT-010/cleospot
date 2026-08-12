-- Run this once in the Supabase SQL editor on your EXISTING project —
-- adds delivery zones without touching anything you've already seeded.

create table if not exists delivery_zones (
  id uuid primary key default uuid_generate_v4(),
  city text not null,
  fee numeric(10,2) not null default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

alter table orders add column if not exists delivery_city text;
alter table riders add column if not exists access_code text;

alter table delivery_zones enable row level security;
create policy "public read delivery zones" on delivery_zones for select using (true);
