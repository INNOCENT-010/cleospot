"use client";

import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/settings");
    setSettings(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) setSettings((s: any) => ({ ...s, logo_url: data.url }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!settings) return <p>Loading…</p>;

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Store settings</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="text-sm text-gray-500">Brand name</label>
          <input className="w-full border rounded-lg px-3 py-2 mt-1"
            value={settings.brand_name} onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })} />
        </div>

        <div>
          <label className="text-sm text-gray-500">Logo</label>
          <input type="file" accept="image/*" onChange={handleUpload} className="block mt-1" />
          {uploading && <p className="text-xs text-gray-400">Uploading…</p>}
          {settings.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt="Logo" className="h-16 mt-2" />
          )}
        </div>

        <div className="flex gap-3">
          <div>
            <label className="text-sm text-gray-500">Primary color</label>
            <input type="color" className="block mt-1" value={settings.color_primary}
              onChange={(e) => setSettings({ ...settings, color_primary: e.target.value })} />
          </div>
          <div>
            <label className="text-sm text-gray-500">Secondary color</label>
            <input type="color" className="block mt-1" value={settings.color_secondary}
              onChange={(e) => setSettings({ ...settings, color_secondary: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500">WhatsApp number (with country code, no +)</label>
          <input className="w-full border rounded-lg px-3 py-2 mt-1" placeholder="2348000000000"
            value={settings.whatsapp_number || ""} onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })} />
        </div>

        <button className="bg-brand-red text-white px-4 py-2 rounded-lg font-medium">
          {saved ? "Saved ✓" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
