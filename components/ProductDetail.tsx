"use client";

import { useCart } from "@/components/CartProvider";
import type { Meal } from "@/lib/types";
import { useState } from "react";

export default function ProductDetail({ meal }: { meal: Meal }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const hasDiscount = meal.discount_active && meal.discount_percent > 0;
  const finalPrice = hasDiscount ? meal.price - (meal.price * meal.discount_percent) / 100 : meal.price;

  function handleAdd() {
    add({ meal_id: meal.id, name: meal.name, price: finalPrice, quantity: 1, image_url: meal.image_url });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
        {meal.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
        )}
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{meal.name}</h1>
        <p className="text-gray-600 mt-2">{meal.description}</p>
        <div className="flex items-baseline gap-3 mt-4">
          <span className="text-2xl font-bold text-brand-red">₦{finalPrice.toLocaleString()}</span>
          {hasDiscount && (
            <span className="text-gray-400 line-through">₦{meal.price.toLocaleString()}</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={!meal.is_available}
          className="mt-6 bg-brand-red text-white font-medium px-6 py-3 rounded-lg
                     hover:bg-brand-dark disabled:opacity-40 transition-colors"
        >
          {added ? "Added ✓" : meal.is_available ? "Add to cart" : "Sold out"}
        </button>
      </div>
    </div>
  );
}
