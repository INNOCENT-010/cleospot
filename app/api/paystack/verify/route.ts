// GET /api/paystack/verify?reference=... — confirms payment with Paystack and
// marks the matching order as paid. Call this from the order tracking page on load.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { paystackVerifyTransaction } from "@/lib/paystack";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

  try {
    const result = await paystackVerifyTransaction(reference);
    const paid = result?.data?.status === "success";

    if (paid) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("paystack_reference", reference)
        .eq("status", "pending"); // don't downgrade an order that's already progressed
    }

    return NextResponse.json({ paid });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
