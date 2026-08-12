"use client";

import Link from "next/link";
import type { Meal } from "@/lib/types";

export default function MealCard({ meal, onAdd }: { meal: Meal; onAdd?: (m: Meal) => void }) {
  const hasDiscount = meal.discount_active && meal.discount_percent > 0;
  const finalPrice = hasDiscount
    ? meal.price - (meal.price * meal.discount_percent) / 100
    : meal.price;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/product/${meal.id}`}>
        <div className="relative aspect-square bg-gray-100">
          {meal.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
          )}
          {hasDiscount && (
            <span className="absolute top-2 left-2 bg-brand-red text-white text-xs font-bold px-2 py-1 rounded-full">
              -{meal.discount_percent}%
            </span>
          )}
          {!meal.is_available && (
            <span className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
              Sold out
            </span>
          )}
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/product/${meal.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-1">{meal.name}</h3>
        </Link>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-bold text-brand-red">₦{finalPrice.toLocaleString()}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">₦{meal.price.toLocaleString()}</span>
          )}
        </div>
        <button
          disabled={!meal.is_available}
          onClick={() => onAdd?.(meal)}
          className="mt-2 w-full bg-brand-red text-white text-sm font-medium py-2 rounded-lg
                     hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
