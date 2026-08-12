import type { StoreSettings } from "@/lib/types";

export default function Footer({ settings }: { settings: StoreSettings | null }) {
  return (
    <footer className="bg-brand-red text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm flex flex-col md:flex-row justify-between gap-3">
        <p className="brand-script text-lg">{settings?.brand_name || "CLeo's Pot"}</p>
        <p>&copy; {new Date().getFullYear()} {settings?.brand_name || "CLeo's Pot"}. All rights reserved.</p>
      </div>
    </footer>
  );
}
