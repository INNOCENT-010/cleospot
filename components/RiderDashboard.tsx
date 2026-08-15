"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
};

const STATUS_PRIORITY: Record<string, number> = {
  on_the_way: 0,
  picked_up: 1,
  preparing: 2,
  paid: 3,
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
  const [pinPrompt, setPinPrompt] = useState<string | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [advancing, setAdvancing] = useState<string | null>(null);
  const router = useRouter();

  // Poll for new assignments every 15 seconds
  useEffect(() => {
    async function refresh() {
      const res = await fetch("/api/rider/orders", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    }
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  async function advance(order: any) {
    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) return;
    if (nextStatus === "delivered") {
      setPinPrompt(order.id);
      return;
    }
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
    const query = lat && lng
      ? `${lat},${lng}`
      : encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, "_blank");
  }

  // Sort by priority
  const sorted = [...orders].sort((a, b) =>
    (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99)
  );

  const onTheWay = sorted.filter((o) => o.status === "on_the_way");
  const pickedUp = sorted.filter((o) => o.status === "picked_up");
  const preparing = sorted.filter((o) => o.status === "preparing");
  const waiting = sorted.filter((o) => o.status === "paid");

  function OrderCard({ o }: { o: any }) {
    return (
      <div className="border rounded-xl p-4 bg-white shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold">{o.customer_name}</p>
            <p className="text-sm text-gray-500">{o.customer_phone}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}>
            {o.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Address */}
        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
          <p className="text-sm text-gray-700">{o.customer_address}</p>
          {o.delivery_city && <p className="text-xs text-gray-400 mt-0.5">📍 {o.delivery_city}</p>}
        </div>

        {/* Items */}
        <p className="text-sm text-gray-600 mb-3">
          {o.order_items?.map((i: any) => `${i.quantity}× ${i.meal_name}`).join(", ")}
        </p>

        {/* Total */}
        <p className="text-sm font-semibold mb-3">₦{Number(o.total).toLocaleString()}</p>

        {/* PIN reminder for on_the_way */}
        {o.status === "on_the_way" && (
          <div className="bg-[#fef2f2] border border-red-100 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-gray-500">Ask customer for PIN to confirm delivery</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => advance(o)}
            disabled={advancing === o.id}
            className="flex-1 bg-brand-red text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {advancing === o.id ? "Updating…" : STATUS_LABEL[o.status]}
          </button>

          <button
            onClick={() => openInMaps(o.customer_address, o.delivery_lat, o.delivery_lng)}
            className="flex items-center gap-1.5 border text-sm font-medium px-3 py-2.5 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            Navigate
          </button>

          <button
            onClick={() => router.push(`/rider/${o.id}`)}
            className="border text-sm font-medium px-3 py-2.5 rounded-lg hover:border-brand-red hover:text-brand-red transition-colors"
          >
            Share location
          </button>
        </div>
      </div>
    );
  }

  function Section({ title, items, color }: { title: string; items: any[]; color: string }) {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full mb-3 ${color}`}>
          {title} ({items.length})
        </div>
        <div className="space-y-3">
          {items.map((o) => <OrderCard key={o.id} o={o} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hi, {riderName} 👋</h1>
          <p className="text-gray-500 text-sm">
            {orders.length === 0
              ? "No active deliveries"
              : `${orders.length} active ${orders.length === 1 ? "delivery" : "deliveries"}`}
          </p>
        </div>
        <button
          onClick={async () => {
            const res = await fetch("/api/rider/orders", { credentials: "include" });
            if (res.ok) setOrders(await res.json());
          }}
          className="text-sm border rounded-lg px-3 py-1.5 text-gray-500 hover:text-brand-red hover:border-brand-red transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🛵</p>
          <p className="text-gray-500">No deliveries assigned yet.</p>
          <p className="text-gray-400 text-sm mt-1">Pull down to refresh or wait — new orders will appear automatically.</p>
        </div>
      )}

      <Section title="🛵 On the way" items={onTheWay} color="bg-indigo-100 text-indigo-700" />
      <Section title="📦 Picked up" items={pickedUp} color="bg-purple-100 text-purple-700" />
      <Section title="👩‍🍳 Preparing" items={preparing} color="bg-orange-100 text-orange-700" />
      <Section title="⏳ Waiting" items={waiting} color="bg-blue-100 text-blue-700" />

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
                Confirm delivery
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