import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

function generateAccessCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase(); // e.g. "K3F9QZ"
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from("riders").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const { order_id, rider_id } = await req.json();
  if (!order_id || !rider_id) {
    return NextResponse.json({ error: "Missing order_id or rider_id" }, { status: 400 });
  }
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ rider_id })
    .eq("id", order_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from("riders")
    .insert({ ...body, access_code: generateAccessCode() })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
