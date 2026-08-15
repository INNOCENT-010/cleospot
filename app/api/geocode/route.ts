import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  // Temporary debug — remove after fixing
  if (!data.results?.length) {
    return NextResponse.json({ 
      error: "No results", 
      status: data.status, 
      error_message: data.error_message ?? null 
    }, { status: 404 });
  }

  return NextResponse.json({ address: data.results[0].formatted_address });
}