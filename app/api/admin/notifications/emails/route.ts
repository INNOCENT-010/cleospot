import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resend, FROM } from "@/lib/resend";
import { menuUpdateHtml } from "@/lib/emails/menuUpdate";

export async function POST(req: Request) {
  const session = req.headers.get("x-admin-session");
  if (session !== process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { template, promo_text } = await req.json();

  if (template === "menu_update") {
    // Get today's available meals
    const { data: meals } = await supabaseAdmin
      .from("meals")
      .select("name, price, image_url, description")
      .eq("is_available", true)
      .order("created_at", { ascending: false })
      .limit(6);

    // Get all unique customer emails
    const { data: customers } = await supabaseAdmin
      .from("orders")
      .select("customer_email")
      .not("customer_email", "is", null)
      .order("created_at", { ascending: false });

    const emails = [...new Set(customers?.map((c) => c.customer_email).filter(Boolean))];
    if (!emails.length) return NextResponse.json({ sent: 0 });

    const html = menuUpdateHtml({ meals: meals || [], promoText: promo_text });

    // Send in batches of 50
    let sent = 0;
    for (let i = 0; i < emails.length; i += 50) {
      const batch = emails.slice(i, i + 50);
      await Promise.allSettled(
        batch.map((email) =>
          resend.emails.send({
            from: FROM,
            to: email as string,
            subject: "Today's menu is live 🍲 — CLeo's Pot",
            html
          })
        )
      );
      sent += batch.length;
    }

    await supabaseAdmin.from("notification_log").insert({
      title: "Menu update email",
      body: promo_text || "Today's menu sent to all customers",
      sent_count: sent
    });

    return NextResponse.json({ sent, total: emails.length });
  }

  return NextResponse.json({ error: "Unknown template" }, { status: 400 });
}