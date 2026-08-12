"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["pending", "paid", "preparing", "picked_up", "on_the_way", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [pinPrompt, setPinPrompt] = useState<{ orderId: string } | null>(null);
  const [pinValue, setPinValue] = useState("");

  async function load() {
    const [o, r] = await Promise.all([
      fetch("/api/admin/orders").then((res) => res.json()),
      fetch("/api/admin/riders").then((res) => res.json())
    ]);
    setOrders(o);
    setRiders(r);
  }
  useEffect(() => { load(); }, []);

  async function updateStatus(orderId: string, status: string, pin?: string, riderId?: string) {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, pin, rider_id: riderId })
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not update status");
      return;
    }
    load();
  }

  function handleStatusChange(order: any, status: string) {
    if (status === "delivered") {
      setPinPrompt({ orderId: order.id });
    } else {
      updateStatus(order.id, status);
    }
  }

  function confirmDelivery() {
    if (!pinPrompt) return;
    updateStatus(pinPrompt.orderId, "delivered", pinValue);
    setPinPrompt(null);
    setPinValue("");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="border rounded-xl p-4">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{o.customer_name} — {o.customer_phone}</p>
                <p className="text-sm text-gray-500">{o.customer_address}</p>
                <p className="text-sm text-gray-500">
                  {o.order_items?.map((i: any) => `${i.quantity}× ${i.meal_name}`).join(", ")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">₦{o.total.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <select
                value={o.status}
                onChange={(e) => handleStatusChange(o, e.target.value)}
                className="border rounded-lg px-2 py-1 text-sm"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={o.rider_id || ""}
                onChange={(e) => updateStatus(o.id, o.status, undefined, e.target.value)}
                className="border rounded-lg px-2 py-1 text-sm"
              >
                <option value="">Assign rider…</option>
                {riders.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
              </select>
              {o.rider_id && (
                <a
                  href={`/rider/${o.id}`}
                  target="_blank"
                  className="text-xs text-brand-red underline"
                >
                  Live location page ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {pinPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80">
            <p className="font-medium mb-3">Enter the customer's delivery PIN to confirm</p>
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
