"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { supabaseBrowser } from "@/lib/supabase/client";

type DeliveryZone = { id: string; city: string; fee: number };

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [code, setCode] = useState("");
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabaseBrowser
      .from("delivery_zones")
      .select("*")
      .eq("is_active", true)
      .order("city")
      .then(({ data }) => setZones(data || []));
  }, []);

  const selectedZone = zones.find((z) => z.id === zoneId);
  const deliveryFee = selectedZone?.fee || 0;
  const total = subtotal + deliveryFee;

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (zones.length > 0 && !zoneId) {
      setError("Please select a delivery area.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email,
          customer_address: form.address,
          delivery_city: selectedZone?.city,
          delivery_fee: deliveryFee,
          items,
          discount_code: code || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create order");

      // Redirect to Paystack's hosted checkout
      clear();
      window.location.href = data.authorization_url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <p className="text-center py-16 text-gray-500">Your cart is empty.</p>;
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <form onSubmit={handlePay} className="space-y-4">
        <input required placeholder="Full name" className="w-full border rounded-lg px-3 py-2"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="tel" placeholder="Phone number" className="w-full border rounded-lg px-3 py-2"
          value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input required type="email" placeholder="Email (for payment receipt)" className="w-full border rounded-lg px-3 py-2"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <textarea required placeholder="Delivery address (street, landmark)" className="w-full border rounded-lg px-3 py-2"
          value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

        {zones.length > 0 && (
          <div>
            <label className="text-sm text-gray-500">Delivery area</label>
            <select
              required
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
            >
              <option value="">Select your area…</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.city} — ₦{z.fee.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        )}

        <input placeholder="Discount code (optional)" className="w-full border rounded-lg px-3 py-2"
          value={code} onChange={(e) => setCode(e.target.value)} />

        <div className="pt-2 space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{selectedZone ? `₦${deliveryFee.toLocaleString()}` : "—"}</span>
          </div>
        </div>
        <div className="flex justify-between font-bold text-lg pt-1 border-t">
          <span>Total</span>
          <span>₦{total.toLocaleString()}</span>
        </div>

        {error && <p className="text-brand-red text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-red text-white font-medium py-3 rounded-lg hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Redirecting to Paystack…" : "Pay with Paystack"}
        </button>
      </form>
    </div>
  );
}
