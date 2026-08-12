// components/Header.tsx
import Link from "next/link";
import type { StoreSettings } from "@/lib/types";
import CartIcon from "@/components/CartIcon";
import LogoImage from "@/components/LogoImage";

export default function Header({ settings }: { settings: StoreSettings | null }) {
  const brandName = settings?.brand_name || "CLeo's Pot";

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-brand-red">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {settings?.logo_url ? (
            <LogoImage src={settings.logo_url} alt={brandName} />
          ) : (
            <span className="text-2xl brand-script text-brand-red font-bold">
              {brandName}
            </span>
          )}
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-brand-red transition-colors">Menu</Link>
          <Link href="/support" className="hover:text-brand-red transition-colors">Support</Link>
          <CartIcon />
        </nav>
      </div>
    </header>
  );
}