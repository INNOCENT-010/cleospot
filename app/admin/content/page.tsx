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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
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

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress("Uploading…");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/content/videos/upload", {
      method: "POST",
      credentials: "include",
      body: fd
    });
    const data = await res.json();
    if (res.ok) {
      setVForm((prev) => ({ ...prev, url: data.url }));
      setUploadProgress("✓ Uploaded");
    } else {
      setUploadProgress(`Error: ${data.error}`);
    }
    setUploading(false);
  }

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
    setUploadProgress(null);
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
            <p className="font-medium text-sm">Add hero video</p>

            {/* Upload area */}
            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl px-4 py-8 cursor-pointer transition-colors ${
              uploading ? "border-brand-red bg-red-50" : "border-gray-200 hover:border-brand-red hover:bg-red-50"
            }`}>
              <input
                type="file"
                accept="video/mp4,video/mov,video/quicktime,video/webm"
                className="hidden"
                onChange={handleVideoUpload}
                disabled={uploading}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 animate-spin text-brand-red" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span className="text-sm text-brand-red font-medium">Uploading…</span>
                </div>
              ) : vForm.url ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">✅</span>
                  <span className="text-sm text-green-600 font-medium">Video ready</span>
                  <span className="text-xs text-gray-400 text-center truncate max-w-xs">{vForm.url}</span>
                  <span className="text-xs text-brand-red underline cursor-pointer" onClick={(e) => { e.preventDefault(); setVForm({ ...vForm, url: "" }); setUploadProgress(null); }}>
                    Replace
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">Tap to upload video</span>
                  <span className="text-xs text-gray-400">MP4, MOV, WebM · max 50MB recommended</span>
                </div>
              )}
            </label>

            <div className="flex gap-2 items-center">
              <div className="flex flex-col gap-0.5">
                <label className="text-xs text-gray-400">Play order</label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-24 border rounded-lg px-3 py-2 text-sm"
                  value={vForm.sort_order}
                  onChange={(e) => setVForm({ ...vForm, sort_order: Number(e.target.value) })}
                />
              </div>
              <button
                onClick={saveVideo}
                disabled={saving || !vForm.url || uploading}
                className="flex-1 mt-4 bg-brand-red text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving…" : "Add to hero"}
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