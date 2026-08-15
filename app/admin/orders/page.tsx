"use client";

import { useEffect, useState } from "react";

const STATUS_OPTIONS = ["pending", "paid", "preparing", "picked_up", "on_the_way", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  picked_up: "bg-purple-100 text-purple-700",
  on_the_way: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const ACTIVE_STATUSES = ["pending", "paid", "preparing", "picked_up", "on_the_way"];
const DONE_STATUSES = ["delivered", "cancelled"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [tab, setTab] = useState<"active" | "done">("active");
  const [pinPrompt, setPinPrompt] = useState<{ orderId: string } | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigningRider, setAssigningRider] = useState<string | null>(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    const [o, r] = await Promise.all([
      fetch("/api/admin/orders", { credentials: "include" }).then((res) => res.json()),
      fetch("/api/admin/riders", { credentials: "include" }).then((res) => res.json())
    ]);
    setOrders(Array.isArray(o) ? o : []);
    setRiders(Array.isArray(r) ? r : []);
    if (!silent) setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 30000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(orderId: string, status: string, pin?: string, riderId?: string) {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status, pin, rider_id: riderId })
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not update status");
      return;
    }
    // Optimistically update status in UI
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  }

  async function assignRider(orderId: string, riderId: string) {
    if (!riderId) return;
    setAssigningRider(orderId);
    // Optimistically update UI immediately
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, rider_id: riderId } : o));
    const res = await fetch("/api/admin/riders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ order_id: orderId, rider_id: riderId })
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not assign rider");
      await load(true); // Revert on error
    }
    setAssigningRider(null);
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

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const doneOrders = orders.filter((o) => DONE_STATUSES.includes(o.status));
  console.log("Total orders loaded:", orders.length, "Active:", activeOrders.length, "Done:", doneOrders.length);
  const displayed = tab === "active" ? activeOrders : doneOrders;

  function OrderCard({ o }: { o: any }) {
    const rider = riders.find((r) => r.id === o.rider_id);
    return (
      <div className="border rounded-xl p-4 bg-white shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold">{o.customer_name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}>
                {o.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{o.customer_phone}</p>
            <p className="text-sm text-gray-500">{o.customer_address}</p>
            {o.delivery_city && <p className="text-xs text-gray-400">📍 {o.delivery_city}</p>}
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="font-bold text-lg">₦{o.total?.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString("en-NG", {
              day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
            })}</p>
            <p className="text-xs text-gray-400 mt-0.5">PIN: <span className="font-mono font-bold text-brand-red">{o.delivery_pin}</span></p>
          </div>
        </div>

        {/* Items */}
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-3">
          {o.order_items?.length
            ? o.order_items.map((i: any) => `${i.quantity}× ${i.meal_name}`).join(", ")
            : <span className="text-gray-400 italic">No items</span>
          }
        </div>

        {/* Actions */}
        {tab === "active" && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Status */}
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-400">Status</label>
              <select
                value={o.status}
                onChange={(e) => handleStatusChange(o, e.target.value)}
                className="border rounded-lg px-2 py-1.5 text-sm min-w-[140px]"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            {/* Rider */}
            <div className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-400">
                Rider {assigningRider === o.id ? "— saving…" : rider ? `— ${rider.full_name}` : ""}
              </label>
              <select
                value={o.rider_id || ""}
                onChange={(e) => assignRider(o.id, e.target.value)}
                disabled={assigningRider === o.id}
                className="border rounded-lg px-2 py-1.5 text-sm min-w-[140px] disabled:opacity-50"
              >
                <option value="">Assign rider…</option>
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>{r.full_name}</option>
                ))}
              </select>
            </div>

            {/* Live location link */}
            {o.rider_id && (
              <a href={`/rider/${o.id}`} target="_blank"
                className="mt-4 text-xs text-brand-red underline">
                Live map ↗
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <button onClick={() => load()} className="text-sm text-gray-500 hover:text-brand-red border rounded-lg px-3 py-1.5">
          ↻ Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-5">
        <button onClick={() => setTab("active")}
          className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
            tab === "active" ? "border-brand-red text-brand-red" : "border-transparent text-gray-500"
          }`}>
          Active ({activeOrders.length})
        </button>
        <button onClick={() => setTab("done")}
          className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
            tab === "done" ? "border-brand-red text-brand-red" : "border-transparent text-gray-500"
          }`}>
          Completed ({doneOrders.length})
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Loading orders…</p>
      ) : displayed.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          {tab === "active" ? "No active orders right now." : "No completed orders yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {displayed.map((o) => <OrderCard key={o.id} o={o} />)}
        </div>
      )}

      {/* PIN modal */}
      {pinPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <p className="font-medium mb-1">Confirm delivery</p>
            <p className="text-sm text-gray-500 mb-4">Enter the customer's 4-digit PIN to mark as delivered.</p>
            <input
              className="w-full border rounded-lg px-3 py-2 mb-4 text-center text-2xl tracking-widest font-mono"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value)}
              placeholder="••••"
              maxLength={4}
              inputMode="numeric"
            />
            <div className="flex gap-2">
              <button onClick={confirmDelivery}
                className="flex-1 bg-brand-red text-white py-2 rounded-lg font-medium">
                Confirm
              </button>
              <button onClick={() => { setPinPrompt(null); setPinValue(""); }}
                className="flex-1 border py-2 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}