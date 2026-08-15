"use client";

import { useEffect, useState } from "react";
import MealCard from "@/components/MealCard";
import { useCart } from "@/components/CartProvider";
import type { Meal } from "@/lib/types";

type Category = { id: string; name: string; emoji: string };

export default function MealsGrid({ meals, categories = [] }: { meals: Meal[]; categories?: Category[] }) {
  const { add } = useCart();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    function onFilter(e: Event) {
      setActiveCategory((e as CustomEvent).detail);
    }
    window.addEventListener("category-filter", onFilter);
    return () => window.removeEventListener("category-filter", onFilter);
  }, []);

  function handleAdd(meal: Meal) {
    const finalPrice = meal.discount_active
      ? meal.price - (meal.price * meal.discount_percent) / 100
      : meal.price;
    add({ meal_id: meal.id, name: meal.name, price: finalPrice, quantity: 1, image_url: meal.image_url });
  }

  const filtered = activeCategory
    ? meals.filter((m) => (m as any).category_id === activeCategory)
    : meals;

  if (meals.length === 0) {
    return <p className="text-center text-gray-500 py-12">No meals available right now — check back soon.</p>;
  }

  if (filtered.length === 0) {
    return <p className="text-center text-gray-500 py-12">No meals in this category right now.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filtered.map((meal) => (
        <MealCard key={meal.id} meal={meal} onAdd={handleAdd} />
      ))}
    </div>
  );
}