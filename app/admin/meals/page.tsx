"use client";

import { useEffect, useState } from "react";
import type { Meal } from "@/lib/types";

const empty = {
  name: "", description: "", image_url: "", price: 0,
  discount_percent: 0, discount_active: false, is_available: true
};

export default function AdminMealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/meals");
    setMeals(await res.json());
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
    if (data.url) setForm((f: any) => ({ ...f, image_url: data.url }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      await fetch(`/api/admin/meals/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
    } else {
      await fetch("/api/admin/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
    }
    setForm(empty);
    setEditingId(null);
    load();
  }

  function edit(meal: Meal) {
    setForm(meal);
    setEditingId(meal.id);
  }

  async function remove(id: string) {
    if (!confirm("Delete this meal?")) return;
    await fetch(`/api/admin/meals/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Meals</h1>

      <form onSubmit={handleSubmit} className="border rounded-xl p-4 mb-8 space-y-3 max-w-md">
        <p className="font-semibold">{editingId ? "Edit meal" : "Add a meal"}</p>
        <input required placeholder="Name" className="w-full border rounded-lg px-3 py-2"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <textarea placeholder="Description" className="w-full border rounded-lg px-3 py-2"
          value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="number" required placeholder="Price (₦)" className="w-full border rounded-lg px-3 py-2"
          value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} />

        <div>
          <label className="text-sm text-gray-500">Meal image</label>
          <input type="file" accept="image/*" onChange={handleUpload} className="block mt-1" />
          {uploading && <p className="text-xs text-gray-400">Uploading…</p>}
          {form.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="" className="w-20 h-20 object-cover rounded-lg mt-2" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.discount_active}
            onChange={(e) => setForm({ ...form, discount_active: e.target.checked })} />
          <label>Discount active</label>
          <input type="number" placeholder="%" className="w-20 border rounded-lg px-2 py-1 ml-auto"
            value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: parseFloat(e.target.value) })} />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_available}
            onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
          <label>Available for sale</label>
        </div>

        <button className="bg-brand-red text-white px-4 py-2 rounded-lg font-medium">
          {editingId ? "Save changes" : "Add meal"}
        </button>
        {editingId && (
          <button type="button" className="ml-2 text-sm text-gray-500"
            onClick={() => { setForm(empty); setEditingId(null); }}>
            Cancel
          </button>
        )}
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {meals.map((meal) => (
          <div key={meal.id} className="border rounded-xl p-3">
            {meal.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={meal.image_url} alt={meal.name} className="w-full h-28 object-cover rounded-lg mb-2" />
            )}
            <p className="font-medium">{meal.name}</p>
            <p className="text-sm text-gray-500">
              ₦{meal.price.toLocaleString()}
              {meal.discount_active ? ` (-${meal.discount_percent}%)` : ""}
            </p>
            <div className="flex gap-3 mt-2 text-sm">
              <button onClick={() => edit(meal)} className="text-brand-red">Edit</button>
              <button onClick={() => remove(meal.id)} className="text-gray-400">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
