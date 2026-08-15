"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/admin", label: "Overview", emoji: "📊" },
  { href: "/admin/meals", label: "Meals", emoji: "🍲" },
  { href: "/admin/orders", label: "Orders", emoji: "📦" },
  { href: "/admin/riders", label: "Riders", emoji: "🛵" },
  { href: "/admin/discounts", label: "Discounts", emoji: "🎟️" },
  { href: "/admin/delivery", label: "Delivery", emoji: "📍" },
  { href: "/admin/categories", label: "Categories", emoji: "🗂️" },
  { href: "/admin/content", label: "Content", emoji: "🎬" },
  { href: "/admin/notifications", label: "Notifications", emoji: "📣" },
  { href: "/admin/settings", label: "Settings", emoji: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const current = links.find((l) =>
    l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href)
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-[73px] z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">{current?.emoji}</span>
          <span className="font-semibold text-sm">{current?.label || "Admin"}</span>
        </div>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex flex-col gap-1.5 p-1.5"
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-gray-700 transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-20 top-[121px]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <div className="relative bg-white border-b shadow-xl">
            <nav className="grid grid-cols-2 gap-1 p-3">
              {links.map((l) => {
                const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      active ? "bg-brand-red text-white" : "hover:bg-red-50 text-gray-700"
                    }`}
                  >
                    <span>{l.emoji}</span>
                    <span>{l.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex gap-8">

        {/* Desktop sidebar */}
        <aside className="hidden md:block w-48 shrink-0">
          <p className="font-bold brand-script text-brand-red text-xl mb-5">Admin</p>
          <nav className="flex flex-col gap-0.5">
            {links.map((l) => {
              const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-2.5 text-sm py-2 px-3 rounded-lg transition-colors ${
                    active
                      ? "bg-brand-red text-white font-medium"
                      : "text-gray-600 hover:bg-red-50 hover:text-brand-red"
                  }`}
                >
                  <span className="text-base">{l.emoji}</span>
                  <span>{l.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}