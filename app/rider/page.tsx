import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import RiderDashboard from "@/components/RiderDashboard";

export default async function RiderHomePage() {
  const riderId = cookies().get("cleos_rider_id")?.value;
  if (!riderId) redirect("/rider/login");

  const { data: rider } = await supabaseAdmin.from("riders").select("full_name").eq("id", riderId).single();
  if (!rider) redirect("/rider/login");

  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("rider_id", riderId)
    .in("status", ["paid", "preparing", "picked_up", "on_the_way"])
    .order("created_at", { ascending: true });

  return <RiderDashboard riderName={rider.full_name} orders={orders || []} />;
}
