import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { paystackVerifyTransaction } from "@/lib/paystack";
import webpush from "@/lib/webpush";
import { getResend, FROM } from "@/lib/resend";
import { orderConfirmationHtml } from "@/lib/emails/orderConfirmation";

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");
  if (!reference) return NextResponse.json({ error: "Missing reference" }, { status: 400 });

  try {
    const result = await paystackVerifyTransaction(reference);
    const paid = result?.data?.status === "success";

    if (paid) {
      // Fetch order first to check notif_confirmed guard
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, status, notif_confirmed, customer_name, customer_email, customer_address, customer_id, delivery_pin, delivery_fee, total")
        .eq("paystack_reference", reference)
        .single();

      if (order && order.status === "pending") {
        // Update status
        await supabaseAdmin
          .from("orders")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("paystack_reference", reference)
          .eq("status", "pending");

        // Send push only if not already sent for this event
        if (!order.notif_confirmed) {
          await supabaseAdmin
            .from("orders")
            .update({ notif_confirmed: true })
            .eq("id", order.id);

          await sendPushToSubscribers(
            "Order confirmed! 🎉",
            `Thanks ${order.customer_name?.split(" ")[0] || ""}! Your order is confirmed and being prepared.`,
            `/order/${order.id}`
          );

          // Send confirmation email
          if (order.customer_email) {
            const { data: itemsData } = await supabaseAdmin
              .from("order_items")
              .select("meal_name, quantity, unit_price")
              .eq("order_id", order.id);

            await getResend().emails.send({
              from: FROM,
              to: order.customer_email,
              subject: `Order confirmed — ₦${Number(order.total).toLocaleString()} · CLeo's Pot`,
              html: orderConfirmationHtml({
                customerName: order.customer_name,
                orderId: order.id,
                items: itemsData || [],
                total: Number(order.total),
                deliveryFee: Number(order.delivery_fee),
                address: order.customer_address,
                pin: order.delivery_pin,
                hasAccount: !!order.customer_id,
              })
            });
          }
        }
      }
    }

    return NextResponse.json({ paid });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}