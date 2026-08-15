"use client";

import { useEffect, useState } from "react";

type Video = { id: string; url: string; sort_order: number; is_active: boolean };
type Announcement = {
  id: string; title: string; subtitle?: string;
  emoji: string; bg_color: string; text_color: string;
  is_active: boolean; insert_after: number;
};

export default function AdminContentPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tab, setTab] = useState<"videos" | "announcements">("videos");
  const [vForm, setVForm] = useState({ url: "", sort_order: 0 });
  const [aForm, setAForm] = useState({
    title: "", subtitle: "", emoji: "🎉",
    bg_color: "#1a0a00", text_color: "#ffffff", insert_after: 4
  });
  const [saving, setSaving] = useState(false);

  async function loadVideos() {
    const res = await fetch("/api/admin/content/videos", { credentials: "include" });
    if (res.ok) setVideos(await res.json());
  }

  async function loadAnnouncements() {
    const res = await fetch("/api/admin/content/announcements", { credentials: "include" });
    if (res.ok) setAnnouncements(await res.json());
  }

  useEffect(() => { loadVideos(); loadAnnouncements(); }, []);

  async function saveVideo() {
    if (!vForm.url) return;
    setSaving(true);
    await fetch("/api/admin/content/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(vForm)
    });
    setVForm({ url: "", sort_order: 0 });
    loadVideos();
    setSaving(false);
  }

  async function deleteVideo(id: string) {
    await fetch(`/api/admin/content/videos?id=${id}`, { method: "DELETE", credentials: "include" });
    loadVideos();
  }

  async function toggleVideo(id: string, is_active: boolean) {
    await fetch("/api/admin/content/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, is_active: !is_active })
    });
    loadVideos();
  }

  async function saveAnnouncement() {
    if (!aForm.title) return;
    setSaving(true);
    await fetch("/api/admin/content/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(aForm)
    });
    setAForm({ title: "", subtitle: "", emoji: "🎉", bg_color: "#1a0a00", text_color: "#ffffff", insert_after: 4 });
    loadAnnouncements();
    setSaving(false);
  }

  async function deleteAnnouncement(id: string) {
    await fetch(`/api/admin/content/announcements?id=${id}`, { method: "DELETE", credentials: "include" });
    loadAnnouncements();
  }

  async function toggleAnnouncement(id: string, is_active: boolean) {
    await fetch("/api/admin/content/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, is_active: !is_active })
    });
    loadAnnouncements();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Content</h1>

      <div className="flex gap-1 border-b mb-6">
        {(["videos", "announcements"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize -mb-px border-b-2 transition-colors ${
              tab === t ? "border-brand-red text-brand-red" : "border-transparent text-gray-500"
            }`}>
            {t === "videos" ? "🎬 Hero Videos" : "📣 Announcements"}
          </button>
        ))}
      </div>

      {/* Videos */}
      {tab === "videos" && (
        <div className="space-y-6">
          <div className="border rounded-xl p-4 space-y-3">
            <p className="font-medium text-sm">Add video</p>
            <input
              placeholder="Video URL (mp4, .mov, Cloudinary, etc.)"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={vForm.url}
              onChange={(e) => setVForm({ ...vForm, url: e.target.value })}
            />
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Order"
                className="w-24 border rounded-lg px-3 py-2 text-sm"
                value={vForm.sort_order}
                onChange={(e) => setVForm({ ...vForm, sort_order: Number(e.target.value) })}
              />
              <button onClick={saveVideo} disabled={saving}
                className="flex-1 bg-brand-red text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? "Adding…" : "Add video"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {videos.length === 0 && <p className="text-sm text-gray-500">No videos yet. Static hero will show.</p>}
            {videos.map((v) => (
              <div key={v.id} className={`border rounded-xl p-3 flex items-center justify-between gap-3 ${!v.is_active ? "opacity-50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 truncate">{v.url}</p>
                  <p className="text-xs text-gray-400">Order: {v.sort_order}</p>
                </div>
                <div className="flex gap-2 text-xs shrink-0">
                  <button onClick={() => toggleVideo(v.id, v.is_active)}
                    className={v.is_active ? "text-gray-400" : "text-green-600"}>
                    {v.is_active ? "Hide" : "Show"}
                  </button>
                  <button onClick={() => deleteVideo(v.id)} className="text-gray-300 hover:text-red-400">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Announcements */}
      {tab === "announcements" && (
        <div className="space-y-6">
          <div className="border rounded-xl p-4 space-y-3">
            <p className="font-medium text-sm">New announcement</p>
            <div className="flex gap-2">
              <input placeholder="Emoji" className="w-16 border rounded-lg px-3 py-2 text-sm text-center"
                value={aForm.emoji} onChange={(e) => setAForm({ ...aForm, emoji: e.target.value })} />
              <input placeholder="Title — e.g. Happy New Year 🥳" className="flex-1 border rounded-lg px-3 py-2 text-sm"
                value={aForm.title} onChange={(e) => setAForm({ ...aForm, title: e.target.value })} />
            </div>
            <input placeholder="Subtitle (optional)" className="w-full border rounded-lg px-3 py-2 text-sm"
              value={aForm.subtitle} onChange={(e) => setAForm({ ...aForm, subtitle: e.target.value })} />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400">Background</label>
                <div className="flex gap-2 mt-1">
                  <input type="color" className="w-10 h-9 rounded border cursor-pointer"
                    value={aForm.bg_color} onChange={(e) => setAForm({ ...aForm, bg_color: e.target.value })} />
                  <input className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    value={aForm.bg_color} onChange={(e) => setAForm({ ...aForm, bg_color: e.target.value })} />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400">Text colour</label>
                <div className="flex gap-2 mt-1">
                  <input type="color" className="w-10 h-9 rounded border cursor-pointer"
                    value={aForm.text_color} onChange={(e) => setAForm({ ...aForm, text_color: e.target.value })} />
                  <input className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    value={aForm.text_color} onChange={(e) => setAForm({ ...aForm, text_color: e.target.value })} />
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400">Insert after meal number</label>
              <input type="number" className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={aForm.insert_after} onChange={(e) => setAForm({ ...aForm, insert_after: Number(e.target.value) })} />
            </div>
            <button onClick={saveAnnouncement} disabled={saving}
              className="w-full bg-brand-red text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "Saving…" : "Add announcement"}
            </button>
          </div>

          {/* Preview */}
          {aForm.title && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Preview</p>
              <div className="rounded-2xl overflow-hidden relative"
                style={{ background: aForm.bg_color, color: aForm.text_color }}>
                <div className="px-6 py-8 flex flex-col items-center text-center">
                  <span className="text-4xl mb-3">{aForm.emoji}</span>
                  <h2 className="text-xl font-bold">{aForm.title}</h2>
                  {aForm.subtitle && <p className="mt-1.5 text-sm opacity-80">{aForm.subtitle}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {announcements.length === 0 && <p className="text-sm text-gray-500">No announcements yet.</p>}
            {announcements.map((a) => (
              <div key={a.id} className={`border rounded-xl p-3 flex items-center justify-between ${!a.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{a.emoji}</span>
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-gray-400">After meal #{a.insert_after}</p>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => toggleAnnouncement(a.id, a.is_active)}
                    className={a.is_active ? "text-gray-400" : "text-green-600"}>
                    {a.is_active ? "Hide" : "Show"}
                  </button>
                  <button onClick={() => deleteAnnouncement(a.id)} className="text-gray-300 hover:text-red-400">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}