import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, error } = await supabase
    .from("saved_addresses")
    .select("*")
    .eq("customer_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const { label, address, delivery_zone_id, is_default } = body;

  if (is_default) {
    // clear any existing default first
    await supabase
      .from("saved_addresses")
      .update({ is_default: false })
      .eq("customer_id", user.id);
  }

  const { data, error } = await supabase
    .from("saved_addresses")
    .insert({ customer_id: user.id, label, address, delivery_zone_id: delivery_zone_id || null, is_default: !!is_default })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}