"use client";

import { useEffect, useState } from "react";
import type { Meal } from "@/lib/types";

type Category = { id: string; name: string; emoji: string };

const empty = {
  name: "", description: "", image_url: "", price: 0,
  discount_percent: 0, discount_active: false, is_available: true,
  category_id: ""
};

export default function AdminMealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const [mealsRes, catsRes] = await Promise.all([
      fetch("/api/admin/meals").then((r) => r.json()),
      fetch("/api/admin/categories", { credentials: "include" }).then((r) => r.json()),
    ]);
    setMeals(mealsRes);
    setCategories(Array.isArray(catsRes) ? catsRes : []);
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
    const payload = { ...form, category_id: form.category_id || null };
    if (editingId) {
      await fetch(`/api/admin/meals/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      await fetch("/api/admin/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
    setForm(empty);
    setEditingId(null);
    load();
  }

  function edit(meal: any) {
    setForm({ ...meal, category_id: meal.category_id || "" });
    setEditingId(meal.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!confirm("Delete this meal?")) return;
    await fetch(`/api/admin/meals/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleAvailable(meal: any) {
    await fetch(`/api/admin/meals/${meal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_available: !meal.is_available })
    });
    setMeals((prev) => prev.map((m) =>
      m.id === meal.id ? { ...m, is_available: !meal.is_available } : m
    ));
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

        {/* Category */}
        <div>
          <label className="text-sm text-gray-500">Category</label>
          <select
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
        </div>

        {/* Image */}
        <div>
          <label className="text-sm text-gray-500">Meal image</label>
          <input type="file" accept="image/*" onChange={handleUpload} className="block mt-1" />
          {uploading && <p className="text-xs text-gray-400">Uploading…</p>}
          {form.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image_url} alt="" className="w-20 h-20 object-cover rounded-lg mt-2" />
          )}
        </div>

        {/* Discount */}
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.discount_active}
            onChange={(e) => setForm({ ...form, discount_active: e.target.checked })} />
          <label className="text-sm">Discount active</label>
          <input type="number" placeholder="%" className="w-20 border rounded-lg px-2 py-1 ml-auto text-sm"
            value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: parseFloat(e.target.value) })} />
        </div>

        {/* Available */}
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_available}
            onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
          <label className="text-sm">Available for sale</label>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 bg-brand-red text-white px-4 py-2 rounded-lg font-medium">
            {editingId ? "Save changes" : "Add meal"}
          </button>
          {editingId && (
            <button type="button" className="border px-4 py-2 rounded-lg text-sm text-gray-500"
              onClick={() => { setForm(empty); setEditingId(null); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Meals grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {meals.map((meal: any) => {
          const cat = categories.find((c) => c.id === meal.category_id);
          return (
            <div key={meal.id} className={`border rounded-xl p-3 relative transition-opacity ${!meal.is_available ? "opacity-50" : ""}`}>
              {/* Sold out badge */}
              {!meal.is_available && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <span className="bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-wide">
                    SOLD OUT
                  </span>
                </div>
              )}

              {meal.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={meal.image_url} alt={meal.name}
                  className="w-full h-28 object-cover rounded-lg mb-2" />
              )}

              <p className="font-medium text-sm">{meal.name}</p>

              {cat && (
                <p className="text-xs text-gray-400 mb-0.5">{cat.emoji} {cat.name}</p>
              )}

              <p className="text-sm text-gray-500">
                ₦{meal.price.toLocaleString()}
                {meal.discount_active ? ` (-${meal.discount_percent}%)` : ""}
              </p>

              <div className="flex gap-2 mt-2 text-xs flex-wrap">
                <button onClick={() => edit(meal)} className="text-brand-red">Edit</button>
                <button
                  onClick={() => toggleAvailable(meal)}
                  className={meal.is_available ? "text-gray-400 hover:text-orange-500" : "text-green-600"}
                >
                  {meal.is_available ? "Mark sold out" : "Mark available"}
                </button>
                <button onClick={() => remove(meal.id)} className="text-gray-300 hover:text-red-400">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}