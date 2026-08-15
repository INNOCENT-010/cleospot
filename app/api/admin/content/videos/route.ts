import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const { data } = await supabaseAdmin.from("hero_videos").select("*").order("sort_order");
  return NextResponse.json(data || []);
}
export async function POST(req: Request) {
  const body = await req.json();
  const { data, error } = await supabaseAdmin.from("hero_videos").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
export async function PATCH(req: Request) {
  const { id, ...rest } = await req.json();
  const { data, error } = await supabaseAdmin.from("hero_videos").update(rest).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await supabaseAdmin.from("hero_videos").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}