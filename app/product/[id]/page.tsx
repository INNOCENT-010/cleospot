import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import ProductDetail from "@/components/ProductDetail";

async function getMeal(id: string) {
  const { data } = await supabaseAdmin.from("meals").select("*").eq("id", id).single();
  return data;
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const meal = await getMeal(params.id);
  if (!meal) return notFound();
  return <ProductDetail meal={meal} />;
}
