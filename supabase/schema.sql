-- CLeo's Pot — Supabase schema
-- Run this in the Supabase SQL editor for a fresh project.

create extension if not exists "uuid-ossp";

-- ─── Store settings (single row, drives theme/logo/whatsapp so template is reusable) ───
create table if not exists store_settings (
  id uuid primary key default uuid_generate_v4(),
  brand_name text not null default 'CLeo''s Pot',
  logo_url text,
  color_primary text not null default '#E30613',   -- red
  color_secondary text not null default '#FFFFFF',  -- white
  whatsapp_number text,                             -- e.g. 2348000000000
  updated_at timestamptz not null default now()
);
insert into store_settings (brand_name, whatsapp_number)
  select 'CLeo''s Pot', '2348000000000'
  where not exists (select 1 from store_settings);

-- ─── Meals ───
create table if not exists meals (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  image_url text,
  price numeric(10,2) not null,
  -- direct discount admin sets on this meal (covers "app-wide"/"seasonal" promos too,
  -- since those are just this field applied across many meals at once)
  discount_percent numeric(5,2) default 0,
  discount_active boolean default false,
  discount_starts_at timestamptz,
  discount_ends_at timestamptz,
  is_available boolean default true,
  created_at timestamptz not null default now()
);

-- ─── Discount codes (customer-entered, separate from meal.discount_percent) ───
create table if not exists discount_codes (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  percent_off numeric(5,2),
  amount_off numeric(10,2),
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

-- ─── Delivery zones (admin-set delivery price per city/area) ───
create table if not exists delivery_zones (
  id uuid primary key default uuid_generate_v4(),
  city text not null,
  fee numeric(10,2) not null default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

-- ─── Riders ───
create table if not exists riders (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text not null,
  access_code text,             -- rider logs in at /rider/login with phone + this code
  is_active boolean default true,
  created_at timestamptz not null default now()
);

-- ─── Orders ───
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  delivery_lat double precision,
  delivery_lng double precision,
  delivery_city text,
  subtotal numeric(10,2) not null,
  discount_total numeric(10,2) not null default 0,
  discount_code_id uuid references discount_codes(id),
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending','paid','preparing','picked_up','on_the_way','delivered','cancelled')),
  delivery_pin text not null,              -- 4-digit PIN, customer confirms delivery with this
  rider_id uuid references riders(id),
  paystack_reference text unique,
  paid_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  meal_id uuid references meals(id),
  meal_name text not null,   -- snapshot in case meal is edited/deleted later
  unit_price numeric(10,2) not null,
  quantity integer not null default 1
);

-- ─── Rider live location (Tier 2 tracking) ───
-- Rider's page writes here every ~15s while an order is active; realtime subscription
-- on the customer tracking page listens for updates.
create table if not exists rider_locations (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  rider_id uuid references riders(id),
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);
create unique index if not exists rider_locations_order_id_key on rider_locations(order_id);

-- Helper used by app/api/orders/route.ts to bump a code's usage count
create or replace function increment_discount_usage(code_id uuid)
returns void as $$
  update discount_codes set used_count = used_count + 1 where id = code_id;
$$ language sql;

-- ─── Row Level Security ───
alter table meals enable row level security;
alter table discount_codes enable row level security;
alter table riders enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table rider_locations enable row level security;
alter table store_settings enable row level security;
alter table delivery_zones enable row level security;

-- Public can read available meals & store settings (storefront)
create policy "public read meals" on meals for select using (true);
create policy "public read settings" on store_settings for select using (true);
create policy "public read delivery zones" on delivery_zones for select using (true);

-- Public can read/insert orders they create by id (app enforces this via server routes;
-- for simplicity we allow insert from anon and restrict updates to service role via API)
create policy "public insert orders" on orders for insert with check (true);
create policy "public read own order" on orders for select using (true); -- app filters by order id in the URL
create policy "public insert order items" on order_items for insert with check (true);
create policy "public read order items" on order_items for select using (true);

-- Rider location: public can read (for the tracking page) and insert/update
-- (in production, scope this to the rider's own session/token)
create policy "public read rider locations" on rider_locations for select using (true);
create policy "public upsert rider locations" on rider_locations for insert with check (true);
create policy "public update rider locations" on rider_locations for update using (true);

-- Everything else (writes to meals, discount_codes, riders, order status changes,
-- store_settings updates) should go through the service-role key from admin API
-- routes only — no public write policies are created for those on purpose.
