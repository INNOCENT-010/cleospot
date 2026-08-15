"use client";

import { useEffect, useState } from "react";

type Category = { id: string; name: string; emoji: string; sort_order: number; is_active: boolean };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", emoji: "🍽️", sort_order: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/categories", { credentials: "include" });
    if (res.ok) setCategories(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.name) return;
    setSaving(true);
    const res = await fetch("/api/admin/categories", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(editingId ? { id: editingId, ...form } : form)
    });
    if (res.ok) {
      setForm({ name: "", emoji: "🍽️", sort_order: 0 });
      setEditingId(null);
      load();
    }
    setSaving(false);
  }

  async function toggle(id: string, is_active: boolean) {
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, is_active: !is_active })
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/admin/categories?id=${id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      {/* Form */}
      <div className="border rounded-xl p-4 space-y-3 mb-8">
        <p className="font-medium text-sm">{editingId ? "Edit category" : "New category"}</p>
        <div className="flex gap-2">
          <input
            placeholder="Emoji"
            className="w-16 border rounded-lg px-3 py-2 text-sm text-center"
            value={form.emoji}
            onChange={(e) => setForm({ ...form, emoji: e.target.value })}
          />
          <input
            placeholder="Category name — e.g. Trays, Rice dishes, Snacks"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Order"
            className="w-20 border rounded-lg px-3 py-2 text-sm"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving}
            className="flex-1 bg-brand-red text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? "Saving…" : editingId ? "Update" : "Add category"}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setForm({ name: "", emoji: "🍽️", sort_order: 0 }); }}
              className="flex-1 border py-2 rounded-lg text-sm">
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {categories.length === 0 && <p className="text-sm text-gray-500">No categories yet.</p>}
        {categories.map((c) => (
          <div key={c.id} className={`border rounded-xl p-3 flex items-center justify-between ${!c.is_active ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{c.emoji}</span>
              <div>
                <p className="font-medium text-sm">{c.name}</p>
                <p className="text-xs text-gray-400">Order: {c.sort_order}</p>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <button onClick={() => { setEditingId(c.id); setForm({ name: c.name, emoji: c.emoji, sort_order: c.sort_order }); }}
                className="text-gray-500 hover:text-brand-red">Edit</button>
              <button onClick={() => toggle(c.id, c.is_active)}
                className={c.is_active ? "text-gray-400" : "text-green-600"}>
                {c.is_active ? "Hide" : "Show"}
              </button>
              <button onClick={() => remove(c.id)} className="text-gray-300 hover:text-red-400">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}