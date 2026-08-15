"use client";

import { useEffect, useState } from "react";

export default function PushPrompt() {
  const [show, setShow] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) return; // iOS Safari without PWA install — silently skip
    if (Notification.permission === "granted") { setSubscribed(true); return; }
    if (Notification.permission === "denied") return;
    const t = setTimeout(() => setShow(true), 8000); // reduced to 8s
    return () => clearTimeout(t);
  }, []);

  async function subscribe() {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON())
      });

      setSubscribed(true);
      setShow(false);
    } catch (err) {
      console.error("Push subscription failed", err);
      setShow(false);
    }
  }

  if (!show || subscribed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 max-w-sm mx-auto">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🍲</span>
        <div className="flex-1">
          <p className="font-semibold text-sm">Get notified when today's plates are ready</p>
          <p className="text-xs text-gray-500 mt-0.5">We'll ping you when fresh meals drop or there's a promo.</p>
        </div>
        <button onClick={() => setShow(false)} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={subscribe}
          className="flex-1 bg-brand-red text-white text-sm font-medium py-2 rounded-xl hover:bg-brand-dark transition-colors">
          Yes, notify me
        </button>
        <button onClick={() => setShow(false)}
          className="flex-1 border text-sm py-2 rounded-xl text-gray-500 hover:border-gray-400 transition-colors">
          Not now
        </button>
      </div>
    </div>
  );
}