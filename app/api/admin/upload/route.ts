// POST /api/admin/upload — uploads an image (meal photo or logo) to the
// Supabase Storage "public-images" bucket and returns its public URL.
// Create the bucket once in the Supabase dashboard: Storage → New bucket →
// name "public-images" → Public bucket: ON.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from("public-images")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabaseAdmin.storage.from("public-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
