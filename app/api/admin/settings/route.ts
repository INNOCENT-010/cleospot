import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("store_settings").select("*").limit(1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { data: existing } = await supabaseAdmin.from("store_settings").select("id").limit(1).single();
  const { data, error } = await supabaseAdmin
    .from("store_settings")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", existing?.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
