"use client";

import { useState, useEffect } from "react";

type Category = { id: string; name: string; emoji: string };

export default function CategoryNav({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    // Dispatch event so MealsGrid can filter
    window.dispatchEvent(new CustomEvent("category-filter", { detail: active }));
  }, [active]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide -mx-4 px-4">
      <button
        onClick={() => setActive(null)}
        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
          active === null
            ? "bg-brand-red text-white border-brand-red"
            : "bg-white text-gray-600 border-gray-200 hover:border-brand-red hover:text-brand-red"
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => setActive(active === c.id ? null : c.id)}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
            active === c.id
              ? "bg-brand-red text-white border-brand-red"
              : "bg-white text-gray-600 border-gray-200 hover:border-brand-red hover:text-brand-red"
          }`}
        >
          <span>{c.emoji}</span>
          <span>{c.name}</span>
        </button>
      ))}
    </div>
  );
}