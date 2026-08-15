"use client";

import { useEffect, useState } from "react";

const STATUS_FLOW: Record<string, string> = {
  paid: "preparing",
  preparing: "picked_up",
  picked_up: "on_the_way",
  on_the_way: "delivered"
};

const STATUS_LABEL: Record<string, string> = {
  paid: "Start preparing",
  preparing: "Mark picked up",
  picked_up: "Mark on the way",
  on_the_way: "Mark delivered"
};

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  picked_up: "bg-purple-100 text-purple-700",
  on_the_way: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
};

export default function RiderDashboard({
  riderName,
  riderId,
  orders: initialOrders
}: {
  riderName: string;
  riderId: string;
  orders: any[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [completed, setCompleted] = useState<any[]>([]);
  const [tab, setTab] = useState<"active" | "done">("active");
  const [pinPrompt, setPinPrompt] = useState<string | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [advancing, setAdvancing] = useState<string | null>(null);

  async function fetchOrders() {
    const res = await fetch("/api/rider/orders", { credentials: "include" });
    if (res.ok) setOrders(await res.json());
  }

  async function fetchCompleted() {
    const res = await fetch("/api/rider/orders?completed=true", { credentials: "include" });
    if (res.ok) setCompleted(await res.json());
  }

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tab === "done") fetchCompleted();
  }, [tab]);

  async function advance(order: any) {
    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) return;
    if (nextStatus === "delivered") { setPinPrompt(order.id); return; }
    setAdvancing(order.id);
    const res = await fetch(`/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: nextStatus })
    });
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: nextStatus } : o));
    }
    setAdvancing(null);
  }

  async function confirmDelivery() {
    if (!pinPrompt) return;
    const res = await fetch(`/api/orders/${pinPrompt}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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

  function openInMaps(address: string, lat?: number | null, lng?: number | null) {
    const query = lat && lng ? `${lat},${lng}` : encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, "_blank");
  }

  function CompactCard({ o, showActions }: { o: any; showActions: boolean }) {
    return (
      <div className="border rounded-xl p-3 bg-white">
        <div className="flex justify-between items-start mb-1">
          <div>
            <span className="font-semibold text-sm">{o.customer_name}</span>
            <span className="text-gray-400 text-xs ml-2">{o.customer_phone}</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-500"}`}>
            {o.status.replace(/_/g, " ")}
          </span>
        </div>

        <p className="text-xs text-gray-500 mb-0.5 truncate">{o.customer_address}</p>
        {o.delivery_city && <p className="text-xs text-gray-400 mb-1">📍 {o.delivery_city}</p>}

        <p className="text-xs text-gray-600 mb-2 line-clamp-1">
          {o.order_items?.map((i: any) => `${i.quantity}× ${i.meal_name}`).join(", ")}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">₦{Number(o.total).toLocaleString()}</span>
          {showActions && (
            <div className="flex gap-1.5">
              <button
                onClick={() => openInMaps(o.customer_address, o.delivery_lat, o.delivery_lng)}
                className="text-xs border px-2.5 py-1.5 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                Navigate
              </button>
              <button
                onClick={() => advance(o)}
                disabled={advancing === o.id}
                className="text-xs bg-brand-red text-white px-2.5 py-1.5 rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
              >
                {advancing === o.id ? "…" : STATUS_LABEL[o.status]}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const activeOrders = orders.sort((a, b) => {
    const p: Record<string, number> = { on_the_way: 0, picked_up: 1, preparing: 2, paid: 3 };
    return (p[a.status] ?? 9) - (p[b.status] ?? 9);
  });

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold">Hi, {riderName} 👋</h1>
          <p className="text-gray-500 text-xs">{activeOrders.length} active</p>
        </div>
        <button onClick={fetchOrders}
          className="text-xs border rounded-lg px-3 py-1.5 text-gray-500 hover:text-brand-red hover:border-brand-red transition-colors">
          ↻ Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-4">
        <button onClick={() => setTab("active")}
          className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${tab === "active" ? "border-brand-red text-brand-red" : "border-transparent text-gray-500"}`}>
          Active ({activeOrders.length})
        </button>
        <button onClick={() => setTab("done")}
          className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${tab === "done" ? "border-brand-red text-brand-red" : "border-transparent text-gray-500"}`}>
          Completed
        </button>
      </div>

      {/* Active */}
      {tab === "active" && (
        activeOrders.length === 0
          ? <p className="text-center text-gray-400 text-sm py-12">No active deliveries. Pull to refresh.</p>
          : <div className="space-y-2">
              {activeOrders.map((o) => <CompactCard key={o.id} o={o} showActions={true} />)}
            </div>
      )}

      {/* Completed */}
      {tab === "done" && (
        completed.length === 0
          ? <p className="text-center text-gray-400 text-sm py-12">No completed deliveries yet.</p>
          : <div className="space-y-2">
              {completed.map((o) => <CompactCard key={o.id} o={o} showActions={false} />)}
            </div>
      )}

      {/* PIN Modal */}
      {pinPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <p className="font-semibold mb-1">Confirm delivery</p>
            <p className="text-sm text-gray-500 mb-4">Ask the customer for their 4-digit PIN.</p>
            <input
              className="w-full border rounded-lg px-3 py-3 mb-4 text-center text-2xl tracking-widest font-mono"
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value)}
              placeholder="••••"
              maxLength={4}
              inputMode="numeric"
            />
            <div className="flex gap-2">
              <button onClick={confirmDelivery}
                className="flex-1 bg-brand-red text-white py-3 rounded-lg font-medium">
                Confirm
              </button>
              <button onClick={() => { setPinPrompt(null); setPinValue(""); }}
                className="flex-1 border py-3 rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}