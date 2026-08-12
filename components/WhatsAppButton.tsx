"use client";

export default function WhatsAppButton({ number }: { number?: string | null }) {
  if (!number) return null;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(
    "Hi CLeo's Pot, I need help with my order."
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-50 bg-[#25D366] text-white rounded-full shadow-lg
                 w-14 h-14 flex items-center justify-center text-2xl hover:scale-105 transition-transform"
      aria-label="Chat with us on WhatsApp"
    >
      💬
    </a>
  );
}
