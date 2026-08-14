"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Address = { id: string; label: string; address: string; delivery_zone_id: string | null; is_default: boolean };
type Zone = { id: string; city: string; fee: number };

export default function AccountPage() {
  const [orders, setOrders] = useState<any[] | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [tab, setTab] = useState<"orders" | "addresses">("orders");
  const [newAddr, setNewAddr] = useState({ label: "", address: "", delivery_zone_id: "", is_default: false });
  const [addingAddr, setAddingAddr] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/account/signup"); return; }
      setEmail(data.user.email || "");

      const [ordersRes, addrRes, zonesRes] = await Promise.all([
        supabaseBrowser.from("orders").select("*, order_items(*)").eq("customer_id", data.user.id).order("created_at", { ascending: false }),
        fetch("/api/account/addresses").then((r) => r.json()),
        supabaseBrowser.from("delivery_zones").select("*").eq("is_active", true).order("city")
      ]);

      setOrders(ordersRes.data || []);
      setAddresses(Array.isArray(addrRes) ? addrRes : []);
      setZones(zonesRes.data || []);
    });
  }, [router]);

  async function handleLogout() {
    await supabaseBrowser.auth.signOut();
    router.push("/");
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAddr)
    });
    const data = await res.json();
    if (res.ok) {
      setAddresses((prev) =>
        newAddr.is_default
          ? [...prev.map((a) => ({ ...a, is_default: false })), data]
          : [...prev, data]
      );
      setNewAddr({ label: "", address: "", delivery_zone_id: "", is_default: false });
      setAddingAddr(false);
    }
  }

  async function setDefault(id: string) {
    await fetch(`/api/account/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: true })
    });
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
  }

  async function deleteAddr(id: string) {
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  if (orders === null) return <p className="text-center py-16 text-gray-500">Loading…</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My account</h1>
          <p className="text-gray-500 text-sm">{email}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-brand-red">Log out</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6">
        {(["orders", "addresses"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize -mb-px border-b-2 transition-colors ${
              tab === t ? "border-brand-red text-brand-red" : "border-transparent text-gray-500"
            }`}
          >
            {t === "orders" ? "Order history" : "Saved addresses"}
          </button>
        ))}
      </div>

      {/* Order history */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-3">No orders yet.</p>
              <Link href="/" className="text-brand-red font-medium">Browse the menu →</Link>
            </div>
          )}
          {orders.map((o) => (
            <Link key={o.id} href={`/order/${o.id}`}
              className="block border rounded-xl p-4 hover:border-brand-red transition-colors">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {o.order_items?.map((i: any) => `${i.quantity}× ${i.meal_name}`).join(", ")}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-brand-red font-semibold mt-1">
                    {o.status.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">₦{o.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Saved addresses */}
      {tab === "addresses" && (
        <div>
          <div className="space-y-3 mb-6">
            {addresses.length === 0 && (
              <p className="text-gray-500 text-sm">No saved addresses yet — add one below.</p>
            )}
            {addresses.map((addr) => {
              const zone = zones.find((z) => z.id === addr.delivery_zone_id);
              return (
                <div key={addr.id} className={`border rounded-xl p-4 flex justify-between items-start ${addr.is_default ? "border-brand-red bg-[#fef2f2]" : ""}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{addr.label}</p>
                      {addr.is_default && (
                        <span className="text-xs bg-brand-red text-white px-2 py-0.5 rounded-full">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{addr.address}</p>
                    {zone && <p className="text-xs text-gray-400 mt-0.5">{zone.city} — ₦{zone.fee.toLocaleString()} delivery</p>}
                  </div>
                  <div className="flex flex-col gap-1 items-end text-xs">
                    {!addr.is_default && (
                      <button onClick={() => setDefault(addr.id)} className="text-brand-red">Set default</button>
                    )}
                    <button onClick={() => deleteAddr(addr.id)} className="text-gray-400 hover:text-red-500">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>

          {!addingAddr ? (
            <button
              onClick={() => setAddingAddr(true)}
              className="border-2 border-dashed border-gray-300 rounded-xl py-4 w-full text-sm text-gray-500 hover:border-brand-red hover:text-brand-red transition-colors"
            >
              + Add a new address
            </button>
          ) : (
            <form onSubmit={saveAddress} className="border rounded-xl p-4 space-y-3">
              <p className="font-medium text-sm">New address</p>
              <input
                required placeholder={`Label — e.g. "Home", "Mum's place", "David's house"`}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={newAddr.label}
                onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
              />
              <textarea
                required placeholder="Street address / landmark"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={newAddr.address}
                onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
              />
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={newAddr.delivery_zone_id}
                onChange={(e) => setNewAddr({ ...newAddr, delivery_zone_id: e.target.value })}
              >
                <option value="">Select delivery area (optional)</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.city} — ₦{z.fee.toLocaleString()}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newAddr.is_default}
                  onChange={(e) => setNewAddr({ ...newAddr, is_default: e.target.checked })}
                />
                Set as default address
              </label>
              <div className="flex gap-2">
                <button className="flex-1 bg-brand-red text-white py-2 rounded-lg text-sm font-medium">Save address</button>
                <button type="button" onClick={() => setAddingAddr(false)} className="flex-1 border py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}