import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PushPrompt from "@/components/PushPrompt";
import StickyCart from "@/components/StickyCart";
import { CartProvider } from "@/components/CartProvider";
import { supabaseAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CLeo's Pot | Foodies & Snacks",
  description: "Order fresh, home-cooked plates from CLeo's Pot."
};

async function getSettings() {
  const { data } = await supabaseAdmin
    .from("store_settings")
    .select("*")
    .limit(1)
    .single();
  return data;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const primary = settings?.color_primary || "#E30613";

  return (
    <html lang="en">
      <body style={{ ["--brand-red" as string]: primary }}>
        <CartProvider>
          <Header settings={settings} />
          <main className="min-h-screen pt-[73px]">{children}</main>
          <Footer settings={settings} />
          <WhatsAppButton number={settings?.whatsapp_number} />
          <PushPrompt />
          <StickyCart />
        </CartProvider>
      </body>
    </html>
  );
}
