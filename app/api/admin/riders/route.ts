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
