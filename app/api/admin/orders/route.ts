import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    // Fall back to a plain orders fetch so a broken join never hides every order.
    console.error("Admin orders join failed, falling back:", error.message);
    const fallback = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    return NextResponse.json(fallback.data);
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" }
  });
}
