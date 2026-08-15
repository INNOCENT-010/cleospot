import Link from "next/link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/meals", label: "Meals" },
  { href: "/admin/discounts", label: "Discount codes" },
  { href: "/admin/delivery", label: "Delivery pricing" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/riders", label: "Riders" },
  { href: "/admin/settings", label: "Settings" },
  {href: "/admin/notifications", label: "Notifications"},
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/content", label: "Content" },
  
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
      <aside className="w-48 shrink-0">
        <p className="font-bold brand-script text-brand-red text-lg mb-4">Admin</p>
        <nav className="flex flex-col gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm py-2 px-3 rounded-lg hover:bg-red-50">
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
