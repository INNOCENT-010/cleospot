// POST /api/rider/login — verifies phone + access code against the riders table
// and sets a session cookie identifying this rider. Admin generates the access
// code when adding a rider (see app/api/admin/riders/route.ts).
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { phone, access_code } = await req.json();
  if (!phone || !access_code) {
    return NextResponse.json({ error: "Enter your phone number and access code" }, { status: 400 });
  }

  const { data: rider } = await supabaseAdmin
    .from("riders")
    .select("id, full_name, access_code, is_active")
    .eq("phone", phone.trim())
    .single();

  if (!rider || rider.access_code !== access_code.trim() || !rider.is_active) {
    return NextResponse.json({ error: "Incorrect phone number or access code" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, name: rider.full_name });
  res.cookies.set("cleos_rider_id", rider.id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days — riders shouldn't have to log in every shift
    path: "/"
  });
  return res;
}
