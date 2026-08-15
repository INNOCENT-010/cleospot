"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartIcon({ scrolled }: { scrolled?: boolean }) {
  const { items } = useCart();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Link href="/cart" className="relative flex items-center hover:opacity-80" aria-label="Cart">
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-colors ${scrolled === false ? "text-white" : "text-gray-900"}`}
      >
        <circle cx="9" cy="21" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="19" cy="21" r="1.4" fill="currentColor" stroke="none" />
        <path d="M2.5 3h2l2.6 12.6a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21.5 8H6" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-brand-red text-white text-[11px] font-bold
                         min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
          {count}
        </span>
      )}
    </Link>
  );
}