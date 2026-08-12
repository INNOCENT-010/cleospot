"use client";

import { useEffect, useState } from "react";

const empty = { code: "", percent_off: "", amount_off: "", max_uses: "", expires_at: "", is_active: true };

export default function AdminDiscountsPage() {
  const [codes, setCodes] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);

  async function load() {
    const res = await fetch("/api/admin/discounts");
    setCodes(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code.toUpperCase(),
        percent_off: form.percent_off ? parseFloat(form.percent_off) : null,
        amount_off: form.amount_off ? parseFloat(form.amount_off) : null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
        is_active: form.is_active
      })
    });
    setForm(empty);
    load();
  }

  async function toggle(id: string, is_active: boolean) {
    await fetch(`/api/admin/discounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !is_active })
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Discount codes</h1>
      <p className="text-gray-500 text-sm mb-6">
        For blanket app-wide or seasonal promos, use the discount fields on each meal in the
        Meals tab instead — this page is for one-off codes customers type in at checkout.
      </p>

      <form onSubmit={handleSubmit} className="border rounded-xl p-4 mb-8 space-y-3 max-w-sm">
        <input required placeholder="CODE (e.g. WELCOME10)" className="w-full border rounded-lg px-3 py-2 uppercase"
          value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <input type="number" placeholder="% off" className="w-full border rounded-lg px-3 py-2"
          value={form.percent_off} onChange={(e) => setForm({ ...form, percent_off: e.target.value })} />
        <input type="number" placeholder="Or fixed ₦ off" className="w-full border rounded-lg px-3 py-2"
          value={form.amount_off} onChange={(e) => setForm({ ...form, amount_off: e.target.value })} />
        <input type="number" placeholder="Max uses (optional)" className="w-full border rounded-lg px-3 py-2"
          value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} />
        <input type="date" className="w-full border rounded-lg px-3 py-2"
          value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
        <button className="bg-brand-red text-white px-4 py-2 rounded-lg font-medium">Create code</button>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Code</th><th>Off</th><th>Used</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="py-2 font-medium">{c.code}</td>
              <td>{c.percent_off ? `${c.percent_off}%` : `₦${c.amount_off}`}</td>
              <td>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
              <td>{c.is_active ? "Active" : "Disabled"}</td>
              <td>
                <button onClick={() => toggle(c.id, c.is_active)} className="text-brand-red">
                  {c.is_active ? "Disable" : "Enable"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
