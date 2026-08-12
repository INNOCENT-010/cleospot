"use client";

import { useEffect, useState } from "react";

export default function AdminDeliveryPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [form, setForm] = useState({ city: "", fee: "" });

  async function load() {
    const res = await fetch("/api/admin/delivery");
    setZones(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: form.city, fee: parseFloat(form.fee) || 0, is_active: true })
    });
    setForm({ city: "", fee: "" });
    load();
  }

  async function toggle(id: string, is_active: boolean) {
    await fetch(`/api/admin/delivery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !is_active })
    });
    load();
  }

  async function updateFee(id: string, fee: number) {
    await fetch(`/api/admin/delivery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fee })
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this delivery zone?")) return;
    await fetch(`/api/admin/delivery/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Delivery pricing</h1>
      <p className="text-gray-500 text-sm mb-6">
        Set a delivery fee per city/area. Customers pick one of these at checkout and the fee
        is added to their total automatically.
      </p>

      <form onSubmit={handleSubmit} className="border rounded-xl p-4 mb-8 space-y-3 max-w-sm">
        <input required placeholder="City / area (e.g. Wuse 2)" className="w-full border rounded-lg px-3 py-2"
          value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <input required type="number" placeholder="Delivery fee (₦)" className="w-full border rounded-lg px-3 py-2"
          value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} />
        <button className="bg-brand-red text-white px-4 py-2 rounded-lg font-medium">Add zone</button>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">City / area</th><th>Fee</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {zones.map((z) => (
            <tr key={z.id} className="border-b">
              <td className="py-2 font-medium">{z.city}</td>
              <td>
                <input
                  type="number"
                  defaultValue={z.fee}
                  onBlur={(e) => updateFee(z.id, parseFloat(e.target.value) || 0)}
                  className="w-24 border rounded-lg px-2 py-1"
                />
              </td>
              <td>{z.is_active ? "Active" : "Hidden"}</td>
              <td className="space-x-3">
                <button onClick={() => toggle(z.id, z.is_active)} className="text-brand-red">
                  {z.is_active ? "Hide" : "Show"}
                </button>
                <button onClick={() => remove(z.id)} className="text-gray-400">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
