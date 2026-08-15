import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import webpush from "@/lib/webpush";

async function sendPushToSubscribers(title: string, body: string, url: string) {
  const { data: subs } = await supabaseAdmin.from("push_subscriptions").select("*");
  if (!subs?.length) return;
  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url })
      ).catch(async (err) => {
        if (err.statusCode === 410) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      })
    )
  );
}

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

  // Fetch current order state for notification guards
  const { data: currentOrder } = await supabaseAdmin
    .from("orders")
    .select("id, customer_name, notif_confirmed, notif_on_the_way, notif_delivered")
    .eq("id", params.id)
    .single();

  if (!currentOrder) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const update: Record<string, unknown> = { status };
  if (rider_id) update.rider_id = rider_id;
  if (status === "delivered") update.delivered_at = new Date().toISOString();

  const { error } = await supabaseAdmin.from("orders").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const firstName = currentOrder.customer_name?.split(" ")[0] || "there";
  const orderUrl = `/order/${params.id}`;

  // Fire notification based on status — each fires exactly once
  if (status === "on_the_way" && !currentOrder.notif_on_the_way) {
    await supabaseAdmin.from("orders").update({ notif_on_the_way: true }).eq("id", params.id);
    await sendPushToSubscribers(
      "Your food is on the way 🛵",
      `Hey ${firstName}! Your order has been picked up and is heading to you.`,
      orderUrl
    );
  }

  if (status === "delivered" && !currentOrder.notif_delivered) {
    await supabaseAdmin.from("orders").update({ notif_delivered: true }).eq("id", params.id);
    await sendPushToSubscribers(
      "Order delivered! 🍲",
      `Enjoy your meal ${firstName}! We hope you love it. Order again anytime.`,
      orderUrl
    );
  }

  return NextResponse.json({ ok: true });
}