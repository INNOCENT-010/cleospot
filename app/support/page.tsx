import { supabaseAdmin } from "@/lib/supabase/server";

async function getSettings() {
  const { data } = await supabaseAdmin.from("store_settings").select("*").limit(1).single();
  return data;
}

export default async function SupportPage() {
  const settings = await getSettings();
  const waHref = settings?.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent("Hi, I need help with my order.")}`
    : "#";

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-2">Need help?</h1>
      <p className="text-gray-500 mb-8">
        Reach us on WhatsApp for order issues, delivery questions, or anything else.
      </p>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-[#25D366] text-white font-medium px-6 py-3 rounded-lg"
      >
        Chat on WhatsApp
      </a>
    </div>
  );
}
