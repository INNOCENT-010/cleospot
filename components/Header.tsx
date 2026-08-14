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
          <Link href="/account" className="hover:text-brand-red transition-colors" aria-label="Account">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </Link>
          <CartIcon />
        </nav>
      </div>
    </header>
  );
}