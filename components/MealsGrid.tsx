"use client";

import { useEffect, useState } from "react";
import MealCard from "@/components/MealCard";
import AnnouncementCard from "@/components/AnnouncementCard";
import { useCart } from "@/components/CartProvider";
import type { Meal } from "@/lib/types";

type Category = { id: string; name: string; emoji: string };
type Announcement = {
  id: string;
  title: string;
  subtitle?: string | null;
  emoji: string;
  bg_color: string;
  text_color: string;
  insert_after: number;
};

export default function MealsGrid({
  meals,
  categories = [],
  announcements = [],
}: {
  meals: Meal[];
  categories?: Category[];
  announcements?: Announcement[];
}) {
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

  // Build grid items with announcements injected
  const gridItems: React.ReactNode[] = [];
  filtered.forEach((meal, i) => {
    gridItems.push(<MealCard key={meal.id} meal={meal} onAdd={handleAdd} />);
    // Check if any announcement should be inserted after this index
    announcements.forEach((a) => {
      if (a.insert_after === i + 1) {
        gridItems.push(<AnnouncementCard key={`ann-${a.id}`} announcement={a} />);
      }
    });
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {gridItems}
    </div>
  );
}