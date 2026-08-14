"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Address = { id: string; label: string; address: string; delivery_zone_id: string | null; is_default: boolean };
type Zone = { id: string; city: string; fee: number };

export default function SavedAddressPicker({
  zones,
  onSelect
}: {
  zones: Zone[];
  onSelect: (address: string, zoneId: string) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: rows } = await supabaseBrowser
        .from("saved_addresses")
        .select("*")
        .eq("customer_id", data.user.id)
        .order("is_default", { ascending: false })
        .order("created_at");
      if (!rows?.length) return;
      setAddresses(rows);
      const def = rows.find((r) => r.is_default) || rows[0];
      setSelected(def.id);
      if (def.delivery_zone_id) onSelect(def.address, def.delivery_zone_id);
    });
  }, []);

  if (!addresses.length) return null;

  function pick(addr: Address) {
    setSelected(addr.id);
    if (addr.delivery_zone_id) onSelect(addr.address, addr.delivery_zone_id);
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Deliver to a saved address</p>
      <div className="flex flex-col gap-2">
        {addresses.map((addr) => (
          <button
            key={addr.id}
            type="button"
            onClick={() => pick(addr)}
            className={`text-left border rounded-xl px-4 py-3 transition-colors ${
              selected === addr.id
                ? "border-brand-red bg-[#fef2f2]"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <p className="font-medium text-sm">{addr.label}</p>
            <p className="text-xs text-gray-500">{addr.address}</p>
            {addr.delivery_zone_id && (
              <p className="text-xs text-brand-red mt-0.5">
                {zones.find((z) => z.id === addr.delivery_zone_id)?.city} — ₦{zones.find((z) => z.id === addr.delivery_zone_id)?.fee.toLocaleString()}
              </p>
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Manage addresses in <a href="/account" className="underline">My account</a>
      </p>
    </div>
  );
}