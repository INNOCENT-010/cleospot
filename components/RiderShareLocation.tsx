"use client";

import { useEffect, useRef, useState } from "react";

export default function RiderShareLocation({ orderId }: { orderId: string }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  function startSharing() {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported on this device.");
      return;
    }
    setSharing(true);
    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await fetch("/api/rider/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId, lat: latitude, lng: longitude })
        });
        setLastSent(new Date().toLocaleTimeString());
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  }

  function stopSharing() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    setSharing(false);
  }

  useEffect(() => () => stopSharing(), []);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-bold mb-2">Delivery for Order #{orderId.slice(0, 8).toUpperCase()}</h1>
      <p className="text-gray-500 mb-8">
        Keep this page open while delivering — it shares your location so the customer can track you.
      </p>

      {!sharing ? (
        <button
          onClick={startSharing}
          className="bg-brand-red text-white font-medium px-6 py-3 rounded-lg hover:bg-brand-dark"
        >
          Start sharing location
        </button>
      ) : (
        <div>
          <div className="inline-flex items-center gap-2 text-brand-red font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" /> Sharing live location
          </div>
          {lastSent && <p className="text-xs text-gray-400 mb-4">Last update: {lastSent}</p>}
          <button onClick={stopSharing} className="border border-gray-300 px-6 py-3 rounded-lg">
            Stop sharing
          </button>
        </div>
      )}

      {error && <p className="text-brand-red text-sm mt-4">{error}</p>}
    </div>
  );
}
