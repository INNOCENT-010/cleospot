import { supabaseAdmin } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import OrderTracker from "@/components/OrderTracker";

async function getOrder(id: string) {
  const { data } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(meal_name, quantity, unit_price)")
    .eq("id", id)
    .single();
  return data;
}

export default async function OrderPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { reference?: string };
}) {
  const order = await getOrder(params.id);
  if (!order) return notFound();

  return <OrderTracker order={order} reference={searchParams.reference} />;
}
