"use client";

import { useCart } from "@/components/CartProvider";
import { usePathname, useRouter } from "next/navigation";

export default function StickyCart() {
  const { items, subtotal } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const hidden = count === 0 || pathname === "/cart" || pathname === "/checkout" || pathname.startsWith("/admin") || pathname.startsWith("/rider");

  if (hidden) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-4">
      <button
        onClick={() => router.push("/cart")}
        className="w-full bg-brand-red text-white rounded-2xl shadow-2xl flex items-center justify-between px-5 py-4 active:scale-95 transition-transform"
      >
        <div className="flex items-center gap-3">
          <span className="bg-white text-brand-red text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
            {count}
          </span>
          <span className="font-semibold text-sm">View cart</span>
        </div>
        <span className="font-bold text-sm">₦{subtotal.toLocaleString()}</span>
      </button>
    </div>
  );
}