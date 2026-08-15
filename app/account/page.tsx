"use client";

import { useEffect, useRef, useState } from "react";
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
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/account/signup"); return; }
      setEmail(data.user.email || "");

      const { data: { session } } = await supabaseBrowser.auth.getSession();
      const token = session?.access_token ?? "";
      const [ordersRes, addrRes, zonesRes] = await Promise.all([
        supabaseBrowser.from("orders").select("id, total, status, created_at, order_items(meal_name, quantity)").eq("customer_id", data.user.id).order("created_at", { ascending: false }),
        fetch("/api/account/addresses", { headers: { authorization: `Bearer ${token}` } }).then((r) => r.json()),
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
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    const token = session?.access_token ?? "";
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
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
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    const token = session?.access_token ?? "";
    await fetch(`/api/account/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_default: true })
    });
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
  }

  async function deleteAddr(id: string) {
    const { data: { session } } = await supabaseBrowser.auth.getSession();
    const token = session?.access_token ?? "";
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE", headers: { authorization: `Bearer ${token}` } });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  const [mapsReady, setMapsReady] = useState(false);

  // Load Google Maps script once with a callback so we know when it's ready
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).google?.maps?.places) { setMapsReady(true); return; }
    if (document.getElementById("gmap-script")) return;

    (window as any).__onGMapsLoaded = () => setMapsReady(true);

    const script = document.createElement("script");
    script.id = "gmap-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=__onGMapsLoaded`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Init autocomplete once maps is ready AND form is open
  useEffect(() => {
    if (!addingAddr || !mapsReady || !addressInputRef.current) return;
    if (autocompleteRef.current) {
      (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }
    (async () => {
      if (!addressInputRef.current) return;
      const ac = new (window as any).google.maps.places.Autocomplete(
        addressInputRef.current,
        { componentRestrictions: { country: "ng" }, fields: ["formatted_address"] }
      );
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (place?.formatted_address) {
          setNewAddr((prev) => ({ ...prev, address: place.formatted_address }));
          if (addressInputRef.current) addressInputRef.current.value = place.formatted_address;
        }
      });
      autocompleteRef.current = ac;
    })();
  }, [addingAddr, mapsReady]);

  async function useMyLocation() {
    setLocating(true);
    setLocError(null);

    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `/api/geocode?lat=${coords.latitude}&lng=${coords.longitude}`
          );
          const data = await res.json();
          if (!res.ok || !data.address) {
            setLocError("Could not resolve your location. Try typing your address.");
          } else {
            setNewAddr((prev) => ({ ...prev, address: data.address }));
            if (addressInputRef.current) addressInputRef.current.value = data.address;
          }
        } catch {
          setLocError("Could not fetch your address. Try typing it instead.");
        }
        setLocating(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocError("Location access denied. Please allow location in your browser settings.");
        } else {
          setLocError("Could not get your location. Try typing your address.");
        }
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
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
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="w-full flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 hover:border-brand-red hover:text-brand-red disabled:opacity-40 transition-colors"
              >
                {locating ? (
                  <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                )}
                {locating ? "Detecting your location…" : "Use my current location"}
              </button>
              <input
                ref={addressInputRef}
                required
                placeholder="Or type your street address…"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                defaultValue={newAddr.address}
                onChange={(e) => setNewAddr({ ...newAddr, address: e.target.value })}
              />
              {locError && <p className="text-xs text-red-500 -mt-2">{locError}</p>}
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