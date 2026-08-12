// POST /api/rider/location — upserts the rider's current lat/lng for an order.
// Called every time the rider's geolocation watch fires (see RiderShareLocation.tsx).
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { order_id, lat, lng, rider_id } = await req.json();
  if (!order_id || lat == null || lng == null) {
    return NextResponse.json({ error: "Missing order_id/lat/lng" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("rider_locations")
    .upsert(
      { order_id, rider_id: rider_id || null, lat, lng, updated_at: new Date().toISOString() },
      { onConflict: "order_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
