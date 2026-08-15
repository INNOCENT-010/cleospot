"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { supabaseBrowser } from "@/lib/supabase/client";

type DeliveryZone = { id: string; city: string; fee: number };
type SavedAddress = { id: string; label: string; address: string; delivery_zone_id: string | null; is_default: boolean };

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [code, setCode] = useState("");
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zoneId, setZoneId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string>("new");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).google?.maps?.places) { setMapsReady(true); return; }
    if (document.getElementById("gmap-script")) {
      document.getElementById("gmap-script")?.addEventListener("load", () => setMapsReady(true));
      return;
    }
    (window as any).__onGMapsLoaded = () => setMapsReady(true);
    const script = document.createElement("script");
    script.id = "gmap-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=__onGMapsLoaded`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Init autocomplete when maps ready and address input is visible
  useEffect(() => {
    if (!mapsReady || !addressInputRef.current) return;
    if (autocompleteRef.current) return;
    const ac = new (window as any).google.maps.places.Autocomplete(
      addressInputRef.current,
      { componentRestrictions: { country: "ng" }, fields: ["formatted_address", "geometry"] }
    );
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place?.formatted_address) {
        setForm((prev) => ({ ...prev, address: place.formatted_address }));
        if (addressInputRef.current) addressInputRef.current.value = place.formatted_address;
      }
      if (place?.geometry?.location) {
        setCoords({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
      }
    });
    autocompleteRef.current = ac;
  }, [mapsReady, isLoggedIn]);

  async function useMyLocation() {
    setLocating(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Geolocation not supported by your browser.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: position }) => {
        try {
          const res = await fetch(`/api/geocode?lat=${position.latitude}&lng=${position.longitude}`);
          const data = await res.json();
          if (!res.ok || !data.address) {
            setLocError("Could not resolve your location. Type your address instead.");
          } else {
            setForm((prev) => ({ ...prev, address: data.address }));
            setCoords({ lat: position.latitude, lng: position.longitude });
            if (addressInputRef.current) addressInputRef.current.value = data.address;
          }
        } catch {
          setLocError("Could not fetch your address. Type it instead.");
        }
        setLocating(false);
      },
      () => {
        setLocError("Location access denied. Please type your address.");
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  useEffect(() => {
    supabaseBrowser
      .from("delivery_zones")
      .select("*")
      .eq("is_active", true)
      .order("city")
      .then(({ data }) => setZones(data || []));

    supabaseBrowser.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setIsLoggedIn(true);
      setForm((prev) => ({ ...prev, email: session.user.email || "" }));
      const token = session.access_token;
      const res = await fetch("/api/account/addresses", {
        headers: { authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const addrs: SavedAddress[] = await res.json();
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.is_default) || addrs[0];
        if (def) {
          setSelectedSavedId(def.id);
          setForm((prev) => ({ ...prev, address: def.address }));
          if (def.delivery_zone_id) setZoneId(def.delivery_zone_id);
        }
      }
    });
  }, []);

  async function handleSavedAddressChange(id: string) {
    setSelectedSavedId(id);
    if (id === "new") {
      setForm((prev) => ({ ...prev, address: "" }));
      setCoords(null);
      setZoneId("");
      return;
    }
    const addr = savedAddresses.find((a) => a.id === id);
    if (addr) {
      setForm((prev) => ({ ...prev, address: addr.address }));
      if (addr.delivery_zone_id) setZoneId(addr.delivery_zone_id);
      // Geocode the saved address to get coordinates
      try {
        const res = await fetch(`/api/geocode/forward?address=${encodeURIComponent(addr.address)}`);
        const data = await res.json();
        if (data.lat && data.lng) setCoords({ lat: data.lat, lng: data.lng });
      } catch {}
    }
  }

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
          delivery_lat: coords?.lat || null,
          delivery_lng: coords?.lng || null,
          items,
          discount_code: code || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create order");
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

        {/* Logged-in: saved address picker */}
        {isLoggedIn && savedAddresses.length > 0 && (
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Deliver to</label>
            <div className="space-y-2">
              {savedAddresses.map((addr) => (
                <label key={addr.id}
                  className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${
                    selectedSavedId === addr.id ? "border-brand-red bg-[#fef2f2]" : "border-gray-200"
                  }`}>
                  <input type="radio" name="saved_address" value={addr.id}
                    checked={selectedSavedId === addr.id}
                    onChange={() => handleSavedAddressChange(addr.id)}
                    className="mt-0.5 accent-brand-red" />
                  <div>
                    <p className="font-medium text-sm">{addr.label}</p>
                    <p className="text-xs text-gray-500">{addr.address}</p>
                  </div>
                </label>
              ))}
              <label className={`flex items-center gap-3 border rounded-xl p-3 cursor-pointer transition-colors ${
                selectedSavedId === "new" ? "border-brand-red bg-[#fef2f2]" : "border-gray-200"
              }`}>
                <input type="radio" name="saved_address" value="new"
                  checked={selectedSavedId === "new"}
                  onChange={() => handleSavedAddressChange("new")}
                  className="accent-brand-red" />
                <span className="text-sm font-medium">Enter a different address</span>
              </label>
            </div>
          </div>
        )}

        {/* Guest: Google autocomplete + use my location */}
        {!isLoggedIn && (
          <div className="space-y-2">
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
            {locError && <p className="text-xs text-red-500">{locError}</p>}
            <input
              ref={addressInputRef}
              required
              placeholder="Or type your delivery address…"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              defaultValue={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
        )}

        {/* Logged-in new address: Google autocomplete + use my location */}
        {isLoggedIn && selectedSavedId === "new" && (
          <div className="space-y-2">
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
            {locError && <p className="text-xs text-red-500">{locError}</p>}
            <input
              ref={addressInputRef}
              required
              placeholder="Or type your delivery address…"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              defaultValue={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
        )}

        {zones.length > 0 && (
          <div>
            <label className="text-sm text-gray-500">Delivery area</label>
            <select required className="w-full border rounded-lg px-3 py-2 mt-1"
              value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
              <option value="">Select your area…</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.city} — ₦{z.fee.toLocaleString()}</option>
              ))}
            </select>
          </div>
        )}

        <input placeholder="Discount code (optional)" className="w-full border rounded-lg px-3 py-2"
          value={code} onChange={(e) => setCode(e.target.value)} />

        <div className="pt-2 space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{selectedZone ? `₦${deliveryFee.toLocaleString()}` : "—"}</span>
          </div>
        </div>
        <div className="flex justify-between font-bold text-lg pt-1 border-t">
          <span>Total</span><span>₦{total.toLocaleString()}</span>
        </div>

        {error && <p className="text-brand-red text-sm">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-brand-red text-white font-medium py-3 rounded-lg hover:bg-brand-dark disabled:opacity-50">
          {loading ? "Redirecting to Paystack…" : "Pay with Paystack"}
        </button>
      </form>
    </div>
  );
}