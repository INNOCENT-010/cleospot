"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const { items, updateQty, remove, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <Link href="/" className="text-brand-red font-medium mt-3 inline-block">Browse the menu →</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.meal_id} className="flex items-center gap-4 border-b pb-4">
            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
            )}
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-brand-red font-semibold">₦{item.price.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.meal_id, item.quantity - 1)}
                className="w-8 h-8 border rounded-full"
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => updateQty(item.meal_id, item.quantity + 1)}
                className="w-8 h-8 border rounded-full"
              >
                +
              </button>
            </div>
            <button onClick={() => remove(item.meal_id)} className="text-gray-400 hover:text-brand-red text-sm">
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-6 text-lg font-bold">
        <span>Subtotal</span>
        <span>₦{subtotal.toLocaleString()}</span>
      </div>
      <Link
        href="/checkout"
        className="block text-center mt-6 bg-brand-red text-white font-medium py-3 rounded-lg hover:bg-brand-dark"
      >
        Checkout
      </Link>
    </div>
  );
}
