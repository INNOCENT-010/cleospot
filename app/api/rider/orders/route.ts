// GET /api/rider/orders — returns orders assigned to the currently logged-in rider
// (identified by the cleos_rider_id cookie set at /rider/login).
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const riderId = cookies().get("cleos_rider_id")?.value;
  if (!riderId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("rider_id", riderId)
    .in("status", ["paid", "preparing", "picked_up", "on_the_way"])
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
