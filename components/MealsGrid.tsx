"use client";

import MealCard from "@/components/MealCard";
import { useCart } from "@/components/CartProvider";
import type { Meal } from "@/lib/types";

export default function MealsGrid({ meals }: { meals: Meal[] }) {
  const { add } = useCart();

  function handleAdd(meal: Meal) {
    const finalPrice = meal.discount_active
      ? meal.price - (meal.price * meal.discount_percent) / 100
      : meal.price;
    add({ meal_id: meal.id, name: meal.name, price: finalPrice, quantity: 1, image_url: meal.image_url });
  }

  if (meals.length === 0) {
    return <p className="text-center text-gray-500 py-12">No meals available right now — check back soon.</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} onAdd={handleAdd} />
      ))}
    </div>
  );
}
