// PATCH /api/orders/:id/status — admin/rider updates order status.
// When status is "delivered", verify the delivery PIN before allowing it.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { status, pin, rider_id } = await req.json();
  const validStatuses = ["pending", "paid", "preparing", "picked_up", "on_the_way", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (status === "delivered") {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("delivery_pin")
      .eq("id", params.id)
      .single();
    if (!order || order.delivery_pin !== pin) {
      return NextResponse.json({ error: "Incorrect delivery PIN" }, { status: 400 });
    }
  }

  const update: Record<string, unknown> = { status };
  if (rider_id) update.rider_id = rider_id;
  if (status === "delivered") update.delivered_at = new Date().toISOString();

  const { error } = await supabaseAdmin.from("orders").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
