import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const riderId = cookieStore.get("cleos_rider_id")?.value;
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