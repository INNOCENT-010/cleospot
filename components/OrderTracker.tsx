"use client";

import { useEffect, useState } from "react";
import RiderMap from "@/components/RiderMap";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Order, OrderItem } from "@/lib/types";

const STATUS_STEPS: { key: string; label: string; emoji: string }[] = [
  { key: "paid",       label: "Order confirmed",  emoji: "✅" },
  { key: "preparing", label: "Being prepared",    emoji: "👩‍🍳" },
  { key: "picked_up", label: "Picked up",         emoji: "📦" },
  { key: "on_the_way",label: "On the way",        emoji: "🛵" },
  { key: "delivered", label: "Delivered",         emoji: "🎉" },
];

export default function OrderTracker({
  order: initialOrder,
  reference
}: {
  order: Order;
  reference?: string;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [verifying, setVerifying] = useState(false);
  const [eta, setEta] = useState<string | null>(null);

  // Sequential init: fetch fresh DB state, then verify if pending
  useEffect(() => {
    async function init() {
      const { data: fresh } = await supabaseBrowser
        .from("orders")
        .select("*, order_items(meal_name, quantity, unit_price)")
        .eq("id", initialOrder.id)
        .single();

      if (!fresh) return;

      if (fresh.status === "pending") {
        setVerifying(true);
        try {
          const ref = reference || fresh.paystack_reference;
          const res = await fetch(`/api/paystack/verify?reference=${ref}`);
          const data = await res.json();
          if (data.paid) {
            const { data: confirmed } = await supabaseBrowser
              .from("orders")
              .select("*, order_items(meal_name, quantity, unit_price)")
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
        setOrder(fresh as Order);
      }
    }
    init();
  }, [initialOrder.id]);

  // Realtime + polling
  useEffect(() => {
    if (order.status === "delivered" || order.status === "cancelled") return;

    const channel = supabaseBrowser
      .channel(`order-${order.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${order.id}` },
        (payload) => setOrder((o) => ({ ...o, ...(payload.new as Order) }))
      )
      .subscribe();

    const poll = setInterval(async () => {
      const { data } = await supabaseBrowser
        .from("orders")
        .select("*, order_items(meal_name, quantity, unit_price)")
        .eq("id", order.id)
        .single();
      if (data) setOrder(data as Order);
    }, 10000);

    return () => {
      supabaseBrowser.removeChannel(channel);
      clearInterval(poll);
    };
  }, [order.id, order.status]);

  // ETA via Google Distance Matrix when rider is on the way
  useEffect(() => {
    if (order.status !== "on_the_way" || !order.delivery_lat || !order.delivery_lng) return;

    async function fetchEta(riderLat: number, riderLng: number) {
      try {
        const res = await fetch(
          `/api/geocode/eta?olat=${riderLat}&olng=${riderLng}&dlat=${order.delivery_lat}&dlng=${order.delivery_lng}`
        );
        const data = await res.json();
        if (data.duration) setEta(data.duration);
      } catch {}
    }

    // Get rider location then compute ETA
    supabaseBrowser
      .from("rider_locations")
      .select("lat, lng")
      .eq("order_id", order.id)
      .single()
      .then(({ data }) => {
        if (data) fetchEta(data.lat, data.lng);
      });
  }, [order.status, order.delivery_lat, order.delivery_lng, order.id]);

  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const progressPercent = currentIndex < 0 ? 0 : Math.round((currentIndex / (STATUS_STEPS.length - 1)) * 100);
  const showMap = ["picked_up", "on_the_way"].includes(order.status) && order.delivery_lat && order.delivery_lng;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Order Tracking</h1>
      <p className="text-gray-400 text-sm mb-6">#{order.id.slice(0, 8).toUpperCase()}</p>

      {verifying && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-5 text-sm text-yellow-700">
          Confirming your payment…
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">{STATUS_STEPS[currentIndex]?.emoji || "⏳"}</span>
        <div>
          <p className="font-bold text-lg capitalize">{order.status.replace(/_/g, " ")}</p>
          {eta && order.status === "on_the_way" && (
            <p className="text-sm text-brand-red font-medium">Estimated arrival: {eta}</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-brand-red h-2 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex justify-between mb-8">
        {STATUS_STEPS.map((step, i) => (
          <div key={step.key} className="flex flex-col items-center gap-1" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
            <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
              i <= currentIndex ? "bg-brand-red border-brand-red" : "bg-white border-gray-300"
            }`} />
            <span className={`text-center leading-tight hidden sm:block ${
              i <= currentIndex ? "text-xs font-medium text-gray-700" : "text-xs text-gray-400"
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Delivery PIN */}
      {order.status !== "delivered" && order.status !== "cancelled" && (
        <div className="bg-[#fef2f2] border border-red-100 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">Give this PIN to your rider to confirm delivery:</p>
          <p className="text-4xl font-bold tracking-widest text-brand-red font-mono">{order.delivery_pin}</p>
        </div>
      )}

      {/* Map */}
      {showMap && (
        <div className="mb-6">
          <RiderMap orderId={order.id} destLat={order.delivery_lat!} destLng={order.delivery_lng!} />
        </div>
      )}

      {/* Order items */}
      {order.order_items && order.order_items.length > 0 && (
        <div className="border rounded-xl p-4 mb-4">
          <p className="font-semibold text-sm mb-3">Your order</p>
          <div className="space-y-2">
            {order.order_items.map((item: OrderItem, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.quantity}× {item.meal_name}</span>
                <span className="font-medium">₦{(item.unit_price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order summary */}
      <div className="border rounded-xl p-4 text-sm text-gray-600 space-y-1.5">
        <p><span className="text-gray-400">Name</span> · {order.customer_name}</p>
        <p><span className="text-gray-400">Phone</span> · {order.customer_phone}</p>
        <p><span className="text-gray-400">Address</span> · {order.customer_address}</p>
        {order.delivery_city && <p><span className="text-gray-400">Area</span> · {order.delivery_city}</p>}
        <div className="border-t pt-2 mt-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">Subtotal</span>
            <span>₦{Number(order.subtotal).toLocaleString()}</span>
          </div>
          {Number(order.delivery_fee) > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Delivery</span>
              <span>₦{Number(order.delivery_fee).toLocaleString()}</span>
            </div>
          )}
          {Number(order.discount_total) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-₦{Number(order.discount_total).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-1 border-t">
            <span>Total</span>
            <span>₦{Number(order.total).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}