# CLeo's Pot — Foodies & Snacks

A per-plate meal ordering site: customers browse meal cards, pay with Paystack,
and track their order (including live rider location) through to delivery.

## Stack
- Next.js 14 (App Router, TypeScript)
- Supabase (Postgres + Realtime + Storage)
- Paystack (payments)
- Mapbox GL (rider live tracking)
- Tailwind CSS

## What's included
- **Storefront**: home page product cards → product detail → cart → checkout (Paystack)
- **Order tracking page** (`/order/[id]`): status timeline, delivery PIN, and a live
  map once the order is picked up (Tier 2 rider tracking)
- **Rider page** (`/rider/[orderId]`): mobile web page a rider opens to share live
  GPS — no app install needed
- **Admin dashboard** (`/admin`, password-gated): meals CRUD with image upload,
  discount codes, order list + status/rider assignment, riders, store settings
  (logo, brand name, colors, WhatsApp number)
- **Reusable theming**: colors, logo, and brand name all come from the
  `store_settings` table — change them in Admin → Settings, no code edits needed

## Setup

1. **Create a Supabase project** at supabase.com.
2. Run `supabase/schema.sql` in the Supabase SQL editor — this creates all
   tables, the default settings row, and RLS policies.
3. In Supabase → Storage, create a **public** bucket named `public-images`
   (used for meal photos and the logo).
4. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
     — from Supabase → Project Settings → API
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` / `PAYSTACK_SECRET_KEY` — from your
     Paystack dashboard
   - `NEXT_PUBLIC_MAPBOX_TOKEN` — from mapbox.com (free tier is plenty to start)
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` — fallback WhatsApp number (you can also set
     this in Admin → Settings, which takes priority)
   - `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` — pick your own values; this
     gates `/admin`
   - `NEXT_PUBLIC_SITE_URL` — your deployed URL (or `http://localhost:3000` locally)
5. Install and run:
   ```
   npm install
   npm run dev
   ```
6. Visit `/admin/login`, log in, and add your first meals under Admin → Meals.

## How discounts work
- **Meal-level discount** (`discount_active` + `discount_percent` on a meal) —
  this is what covers both "app-wide" and "seasonal" promos, since those are
  really the same mechanism: a % off you toggle on for one meal or apply
  across several. No separate seasonal system needed.
- **Discount codes** — separate, customer-entered codes (e.g. `WELCOME10`)
  with optional expiry and usage limits, managed under Admin → Discount codes.

## Rider tracking — how it works (Tier 2)
1. Admin assigns a rider to a paid order (Admin → Orders → rider dropdown).
2. Admin sends the rider the link shown next to the order: `/rider/[orderId]`
   (e.g. via WhatsApp). No app needed — it's a mobile web page.
3. The rider taps **Start sharing location**; their browser's GPS writes to
   the `rider_locations` table roughly every 10–15 seconds.
4. The customer's tracking page (`/order/[id]`) subscribes to that row via
   Supabase Realtime and moves a pin on the Mapbox map live.
5. Delivery is confirmed by the rider/admin entering the customer's 4-digit
   delivery PIN (shown on the tracking page) into the order's status dropdown.

This is intentionally simple (no route optimization, no native app) — it's
built to be upgraded later (auto rider assignment, ETAs, geofencing) without
changing the schema much.

## Before going live
- Replace the password-cookie admin gate (`middleware.ts`) with real
  Supabase Auth + a `staff` table if more than one person needs admin access.
- Add a Paystack webhook (`/api/paystack/webhook`) as a backup to the
  client-side verify call, in case a customer closes the tab right after paying.
- Set a real delivery fee calculation in `app/api/orders/route.ts`
  (currently hardcoded to 0).
- Turn on Supabase Storage file-size/type limits on the `public-images` bucket.

## Reusing this for another vendor
Because theming and content are all data-driven (`store_settings`, `meals`),
you can stand up a second storefront by pointing a new Supabase project +
env vars at the same codebase — no component code needs to change.
