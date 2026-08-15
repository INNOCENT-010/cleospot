"use client";

import { useEffect, useState } from "react";
import RiderMap from "@/components/RiderMap";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

const STATUS_STEPS: { key: string; label: string }[] = [
  { key: "paid", label: "Order confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "picked_up", label: "Picked up" },
  { key: "on_the_way", label: "On the way" },
  { key: "delivered", label: "Delivered" }
];

export default function OrderTracker({ order: initialOrder, reference }: { order: Order; reference?: string }) {
  const [order, setOrder] = useState(initialOrder);
  const [verifying, setVerifying] = useState(false);

  // Single sequential init: fetch latest DB state, then verify if still pending
  useEffect(() => {
    async function init() {
      // Step 1: get the freshest order from DB
      const { data: fresh } = await supabaseBrowser
        .from("orders")
        .select("*")
        .eq("id", initialOrder.id)
        .single();

      if (!fresh) return;

      // Step 2: if still pending, try to verify payment
      if (fresh.status === "pending") {
        setVerifying(true);
        try {
          const ref = reference || fresh.paystack_reference;
          const res = await fetch(`/api/paystack/verify?reference=${ref}`);
          const data = await res.json();
          if (data.paid) {
            // Re-fetch after verify to get DB-confirmed state
            const { data: confirmed } = await supabaseBrowser
              .from("orders")
              .select("*")
              .eq("id", initialOrder.id)
              .single();
            setOrder((confirmed as Order) || { ...fresh, status: "paid" });
          } else {
            setOrder(fresh as Order);
          }
        } catch {
          setOrder(fresh as Order);
        }
        setVerifying(false);
      } else {
        // Already past pending — just use DB state
        setOrder(fresh as Order);
      }
    }
    init();
  }, [initialOrder.id]);

  // Live status updates via Supabase Realtime + polling fallback
  useEffect(() => {
    if (order.status === "delivered" || order.status === "cancelled") return;

    // Realtime
    const channel = supabaseBrowser
      .channel(`order-${order.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        (payload) => setOrder((o) => ({ ...o, ...(payload.new as Order) }))
      )
      .subscribe();

    // Polling fallback every 10 seconds
    const poll = setInterval(async () => {
      const { data } = await supabaseBrowser
        .from("orders")
        .select("*")
        .eq("id", order.id)
        .single();
      if (data) setOrder(data as Order);
    }, 10000);

    return () => {
      supabaseBrowser.removeChannel(channel);
      clearInterval(poll);
    };
  }, [order.id, order.status]);

  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const showMap = ["picked_up", "on_the_way"].includes(order.status) && order.delivery_lat && order.delivery_lng;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Order Tracking</h1>
      <p className="text-gray-500 mb-6">Order #{order.id.slice(0, 8).toUpperCase()}</p>

      {verifying && <p className="text-brand-red mb-4">Confirming your payment…</p>}

      <div className="flex flex-col gap-3 mb-8">
        {STATUS_STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                i <= currentIndex ? "bg-brand-red" : "bg-gray-200"
              }`}
            />
            <span className={i <= currentIndex ? "font-medium text-gray-900" : "text-gray-400"}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {order.status !== "delivered" && (
        <div className="bg-gray-50 border rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500">Give this PIN to your rider to confirm delivery:</p>
          <p className="text-3xl font-bold tracking-widest text-brand-red mt-1">{order.delivery_pin}</p>
        </div>
      )}

      {showMap && (
        <RiderMap orderId={order.id} destLat={order.delivery_lat!} destLng={order.delivery_lng!} />
      )}

      <div className="mt-8 border-t pt-4 text-sm text-gray-600 space-y-1">
        <p><strong>Delivering to:</strong> {order.customer_address}</p>
        <p><strong>Total:</strong> ₦{order.total.toLocaleString()}</p>
      </div>
    </div>
  );
}
