"use client";

import { useEffect, useRef, useState } from "react";

export default function RiderShareLocation({ orderId }: { orderId: string }) {
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const watchId = useRef<number | null>(null);

  function startSharing() {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported on this device.");
      return;
    }
    setSharing(true);
    setError(null);
    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setSending(true);
        await fetch("/api/rider/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId, lat: latitude, lng: longitude })
        });
        setSending(false);
        setLastSent(new Date().toLocaleTimeString());
      },
      (err) => {
        setError(err.message);
        setSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function stopSharing() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setSharing(false);
  }

  // Auto-start on mount
  useEffect(() => {
    startSharing();
    return () => stopSharing();
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <div className="mb-6">
        <span className="text-5xl">🛵</span>
      </div>
      <h1 className="text-xl font-bold mb-1">
        Order #{orderId.slice(0, 8).toUpperCase()}
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Keep this page open while delivering — your location is being shared with the customer.
      </p>

      {sharing ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-green-700 font-medium mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            Sharing live location
          </div>
          {lastSent && (
            <p className="text-xs text-green-600">
              Last update: {lastSent} {sending ? "⏳" : "✓"}
            </p>
          )}
          <button
            onClick={stopSharing}
            className="mt-4 text-sm border border-gray-300 px-5 py-2 rounded-lg text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
          >
            Stop sharing
          </button>
        </div>
      ) : (
        <button
          onClick={startSharing}
          className="bg-brand-red text-white font-medium px-6 py-3 rounded-xl hover:bg-brand-dark transition-colors"
        >
          Start sharing location
        </button>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={startSharing}
            className="mt-2 text-sm text-brand-red underline"
          >
            Try again
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-8">
        ⚠️ Do not close this page until delivery is complete
      </p>
    </div>
  );
}