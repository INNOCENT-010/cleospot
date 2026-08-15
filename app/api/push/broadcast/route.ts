import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "@/lib/webpush";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  // Admin only
  const session = req.headers.get("x-admin-session");
  if (session !== process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body, url = "/", template_id } = await req.json();
  if (!title || !body) return NextResponse.json({ error: "title and body required" }, { status: 400 });

  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs?.length) return NextResponse.json({ sent: 0 });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url })
      ).catch(async (err) => {
        // Remove dead subscriptions (410 = unsubscribed)
        if (err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
        throw err;
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;

  // Log it
  await supabase.from("notification_log").insert({
    template_id: template_id || null,
    title,
    body,
    sent_count: sent
  });

  return NextResponse.json({ sent, total: subs.length });
}