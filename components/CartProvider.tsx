"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem } from "@/lib/types";

type CartContextType = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (mealId: string) => void;
  updateQty: (mealId: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "cleos-pot-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) setItems(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function add(item: CartItem) {
    setItems((prev) => {
      const existing = prev.find((i) => i.meal_id === item.meal_id);
      if (existing) {
        return prev.map((i) =>
          i.meal_id === item.meal_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function remove(mealId: string) {
    setItems((prev) => prev.filter((i) => i.meal_id !== mealId));
  }

  function updateQty(mealId: string, qty: number) {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.meal_id !== mealId)
        : prev.map((i) => (i.meal_id === mealId ? { ...i, quantity: qty } : i))
    );
  }

  function clear() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
