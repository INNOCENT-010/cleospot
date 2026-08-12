"use client";

// Tier 2 live tracking: renders a Mapbox map with the customer's delivery pin
// (static) and the rider's live location (updates via Supabase Realtime).
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabaseBrowser } from "@/lib/supabase/client";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function RiderMap({
  orderId,
  destLat,
  destLng
}: {
  orderId: string;
  destLat: number;
  destLng: number;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const riderMarker = useRef<mapboxgl.Marker | null>(null);
  const [status, setStatus] = useState("Waiting for rider location…");

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [destLng, destLat],
      zoom: 13
    });

    new mapboxgl.Marker({ color: "#E30613" })
      .setLngLat([destLng, destLat])
      .setPopup(new mapboxgl.Popup().setText("Delivery address"))
      .addTo(map.current);

    // Initial fetch
    supabaseBrowser
      .from("rider_locations")
      .select("*")
      .eq("order_id", orderId)
      .single()
      .then(({ data }) => {
        if (data) placeRiderMarker(data.lat, data.lng);
      });

    // Realtime subscription — fires whenever the rider's page writes a new location
    const channel = supabaseBrowser
      .channel(`rider-location-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rider_locations", filter: `order_id=eq.${orderId}` },
        (payload) => {
          const loc = payload.new as { lat: number; lng: number };
          if (loc) placeRiderMarker(loc.lat, loc.lng);
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  function placeRiderMarker(lat: number, lng: number) {
    setStatus("Rider is on the way");
    if (!map.current) return;
    if (!riderMarker.current) {
      riderMarker.current = new mapboxgl.Marker({ color: "#F5B800" })
        .setLngLat([lng, lat])
        .addTo(map.current);
    } else {
      riderMarker.current.setLngLat([lng, lat]);
    }
    map.current.easeTo({ center: [lng, lat] });
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">{status}</p>
      <div ref={mapContainer} className="w-full h-80 rounded-xl overflow-hidden border" />
    </div>
  );
}
