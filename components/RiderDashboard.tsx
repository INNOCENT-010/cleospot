"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_FLOW: Record<string, string> = {
  paid: "preparing",
  preparing: "picked_up",
  picked_up: "on_the_way",
  on_the_way: "delivered"
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Mark preparing",
  preparing: "Mark picked up",
  picked_up: "Mark on the way",
  on_the_way: "Mark delivered"
};

export default function RiderDashboard({ riderName, orders: initialOrders }: { riderName: string; orders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [pinPrompt, setPinPrompt] = useState<string | null>(null);
  const [pinValue, setPinValue] = useState("");
  const router = useRouter();

  async function advance(order: any) {
    const nextStatus = STATUS_FLOW[order.status];
    if (nextStatus === "delivered") {
      setPinPrompt(order.id);
      return;
    }
    await fetch(`/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o)));
  }

  async function confirmDelivery() {
    if (!pinPrompt) return;
    const res = await fetch(`/api/orders/${pinPrompt}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "delivered", pin: pinValue })
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Incorrect PIN");
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== pinPrompt));
    setPinPrompt(null);
    setPinValue("");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hi, {riderName}</h1>
          <p className="text-gray-500 text-sm">{orders.length} active {orders.length === 1 ? "delivery" : "deliveries"}</p>
        </div>
      </div>

      {orders.length === 0 && (
        <p className="text-center text-gray-500 py-12">No deliveries assigned to you right now.</p>
      )}

      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="border rounded-xl p-4">
            <p className="font-medium">{o.customer_name} — {o.customer_phone}</p>
            <p className="text-sm text-gray-500">{o.customer_address}{o.delivery_city ? `, ${o.delivery_city}` : ""}</p>
            <p className="text-sm text-gray-500 mt-1">
              {o.order_items?.map((i: any) => `${i.quantity}× ${i.meal_name}`).join(", ")}
            </p>
            <p className="text-xs uppercase tracking-wide text-brand-red font-semibold mt-2">{o.status.replace("_", " ")}</p>

            <div className="flex gap-3 mt-3">
              <button
                onClick={() => advance(o)}
                className="bg-brand-red text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-dark"
              >
                {STATUS_LABEL[o.status]}
              </button>
              <button
                onClick={() => router.push(`/rider/${o.id}`)}
                className="border text-sm font-medium px-4 py-2 rounded-lg"
              >
                Share my location
              </button>
            </div>
          </div>
        ))}
      </div>

      {pinPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80">
            <p className="font-medium mb-3">Ask the customer for their delivery PIN</p>
            <input
              className="w-full border rounded-lg px-3 py-2 mb-4"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value)}
              placeholder="4-digit PIN"
            />
            <div className="flex gap-2">
              <button onClick={confirmDelivery} className="flex-1 bg-brand-red text-white py-2 rounded-lg">Confirm</button>
              <button onClick={() => setPinPrompt(null)} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
