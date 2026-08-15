import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address) return NextResponse.json({ error: "Missing address" }, { status: 400 });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
  );
  const data = await res.json();
  const loc = data.results?.[0]?.geometry?.location;
  if (!loc) return NextResponse.json({ error: "Could not geocode address" }, { status: 404 });

  return NextResponse.json({ lat: loc.lat, lng: loc.lng });
}