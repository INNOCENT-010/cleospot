"use client";

import { useEffect, useState } from "react";

type Template = { id: string; name: string; title: string; body: string; url: string };
type Log = { id: string; title: string; body: string; sent_count: number; sent_at: string };

export default function AdminNotificationsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [log, setLog] = useState<Log[]>([]);
  const [tab, setTab] = useState<"broadcast" | "templates" | "log">("broadcast");

  // Broadcast state
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [broadcastForm, setBroadcastForm] = useState({ title: "", body: "", url: "/" });
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; total: number } | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Template state
  const [templateForm, setTemplateForm] = useState({ name: "", title: "", body: "", url: "/" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchLog();
  }, []);

  async function fetchTemplates() {
    const res = await fetch("/api/admin/notifications/templates");
    if (res.ok) setTemplates(await res.json());
  }

  async function fetchLog() {
    const res = await fetch("/api/admin/notifications/log");
    if (res.ok) setLog(await res.json());
  }

  function pickTemplate(t: Template) {
    setSelectedTemplate(t);
    setBroadcastForm({ title: t.title, body: t.body, url: t.url });
    setBroadcastResult(null);
    setBroadcastError(null);
  }

  async function handleBroadcast() {
    if (!broadcastForm.title || !broadcastForm.body) {
      setBroadcastError("Title and message are required.");
      return;
    }
    setBroadcasting(true);
    setBroadcastResult(null);
    setBroadcastError(null);
    const res = await fetch("/api/push/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-session": getCookie("cleos_admin_session")
      },
      body: JSON.stringify({
        ...broadcastForm,
        template_id: selectedTemplate?.id || null
      })
    });
    const data = await res.json();
    if (!res.ok) {
      setBroadcastError(data.error || "Broadcast failed.");
    } else {
      setBroadcastResult(data);
      fetchLog();
    }
    setBroadcasting(false);
  }

  async function saveTemplate() {
    if (!templateForm.name || !templateForm.title || !templateForm.body) return;
    setSavingTemplate(true);
    const res = await fetch("/api/admin/notifications/templates", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...templateForm } : templateForm)
    });
    if (res.ok) {
      setTemplateForm({ name: "", title: "", body: "", url: "/" });
      setEditingId(null);
      fetchTemplates();
    }
    setSavingTemplate(false);
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/admin/notifications/templates?id=${id}`, { method: "DELETE" });
    fetchTemplates();
  }

  function editTemplate(t: Template) {
    setEditingId(t.id);
    setTemplateForm({ name: t.name, title: t.title, body: t.body, url: t.url });
    setTab("templates");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6">
        {(["broadcast", "templates", "log"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize -mb-px border-b-2 transition-colors ${
              tab === t ? "border-brand-red text-brand-red" : "border-transparent text-gray-500"
            }`}>
            {t === "broadcast" ? "📣 Broadcast" : t === "templates" ? "📝 Templates" : "📊 Log"}
          </button>
        ))}
      </div>

      {/* ── BROADCAST ── */}
      {tab === "broadcast" && (
        <div className="space-y-5">
          {/* Template picker */}
          {templates.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Load a template</p>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <button key={t.id} onClick={() => pickTemplate(t)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedTemplate?.id === t.id
                        ? "bg-brand-red text-white border-brand-red"
                        : "border-gray-300 hover:border-brand-red hover:text-brand-red"
                    }`}>
                    {t.name}
                  </button>
                ))}
                {selectedTemplate && (
                  <button onClick={() => { setSelectedTemplate(null); setBroadcastForm({ title: "", body: "", url: "/" }); }}
                    className="px-3 py-1.5 rounded-full text-sm border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400">
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Compose */}
          <div className="border rounded-xl p-4 space-y-3">
            <p className="font-medium text-sm">
              {selectedTemplate ? `Using: ${selectedTemplate.name}` : "Compose message"}
            </p>
            <div>
              <label className="text-xs text-gray-500">Notification title</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Today's plates are ready 🍲"
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Message body</label>
              <textarea
                rows={3}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="e.g. Jollof, Spaghetti & more are available now. Order before it sells out!"
                value={broadcastForm.body}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Link (tap destination)</label>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="/"
                value={broadcastForm.url}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, url: e.target.value })}
              />
            </div>

            {broadcastError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {broadcastError}
              </p>
            )}

            {broadcastResult && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                ✅ Sent to {broadcastResult.sent} of {broadcastResult.total} subscribers.
              </p>
            )}

            <button
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="w-full bg-brand-red text-white font-bold py-3 rounded-xl hover:bg-brand-dark disabled:opacity-50 transition-colors"
            >
              {broadcasting ? "Sending…" : "📣 Send to all subscribers"}
            </button>
          </div>
        </div>
      )}

      {/* ── TEMPLATES ── */}
      {tab === "templates" && (
        <div className="space-y-6">
          {/* Form */}
          <div className="border rounded-xl p-4 space-y-3">
            <p className="font-medium text-sm">{editingId ? "Edit template" : "New template"}</p>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder='Template name — e.g. "Daily menu drop"'
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
            />
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Notification title"
              value={templateForm.title}
              onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
            />
            <textarea
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              placeholder="Message body"
              value={templateForm.body}
              onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
            />
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Link — e.g. /"
              value={templateForm.url}
              onChange={(e) => setTemplateForm({ ...templateForm, url: e.target.value })}
            />
            <div className="flex gap-2">
              <button onClick={saveTemplate} disabled={savingTemplate}
                className="flex-1 bg-brand-red text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {savingTemplate ? "Saving…" : editingId ? "Update template" : "Save template"}
              </button>
              {editingId && (
                <button onClick={() => { setEditingId(null); setTemplateForm({ name: "", title: "", body: "", url: "/" }); }}
                  className="flex-1 border py-2 rounded-lg text-sm">
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {templates.length === 0 && <p className="text-sm text-gray-500">No templates yet.</p>}
            {templates.map((t) => (
              <div key={t.id} className="border rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.body}</p>
                  </div>
                  <div className="flex gap-2 text-xs shrink-0 ml-3">
                    <button onClick={() => { pickTemplate(t); setTab("broadcast"); }}
                      className="text-brand-red hover:underline">Use</button>
                    <button onClick={() => editTemplate(t)}
                      className="text-gray-500 hover:underline">Edit</button>
                    <button onClick={() => deleteTemplate(t.id)}
                      className="text-gray-300 hover:text-red-400">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LOG ── */}
      {tab === "log" && (
        <div className="space-y-3">
          {log.length === 0 && <p className="text-sm text-gray-500">No notifications sent yet.</p>}
          {log.map((l) => (
            <div key={l.id} className="border rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{l.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{l.body}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xs font-medium text-green-600">{l.sent_count} sent</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(l.sent_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getCookie(name: string) {
  return document.cookie.split("; ").find((r) => r.startsWith(name + "="))?.split("=")[1] ?? "";
}