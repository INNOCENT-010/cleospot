import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const olat = searchParams.get("olat");
  const olng = searchParams.get("olng");
  const dlat = searchParams.get("dlat");
  const dlng = searchParams.get("dlng");

  if (!olat || !olng || !dlat || !dlng) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${olat},${olng}&destinations=${dlat},${dlng}&mode=driving&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
  );
  const data = await res.json();
  const element = data.rows?.[0]?.elements?.[0];

  if (!element || element.status !== "OK") {
    return NextResponse.json({ error: "Could not calculate ETA" }, { status: 404 });
  }

  return NextResponse.json({
    duration: element.duration.text,
    distance: element.distance.text
  });
}