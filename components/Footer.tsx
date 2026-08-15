import Link from "next/link";
import type { StoreSettings } from "@/lib/types";
import LogoImage from "@/components/LogoImage";

export default function Footer({ settings }: { settings: StoreSettings | null }) {
  return (
    <footer className="bg-brand-red text-white mt-16">
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center mb-8">
          {settings?.logo_url ? (
            <LogoImage src={settings.logo_url} alt={settings?.brand_name || "CLeo's Pot"} size="footer" />
          ) : (
            <span className="brand-script text-4xl text-white">{settings?.brand_name || "CLeo's Pot"}</span>
          )}
          <p className="text-white/70 text-xs tracking-widest uppercase mt-2">Foodies & Snacks</p>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 mb-6" />

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/70">
          <p>&copy; {new Date().getFullYear()} {settings?.brand_name || "CLeo's Pot"}. All rights reserved.</p>
          <Link
            href="https://innocentdev-v2.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Web design by InnocentDevs
          </Link>
        </div>
      </div>
    </footer>
  );
}