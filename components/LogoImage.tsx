// components/LogoImage.tsx  ← new file
"use client";

import { useState } from "react";

export default function LogoImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="text-2xl brand-script text-brand-red font-bold">{alt}</span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-10 w-auto object-contain"
      onError={() => setFailed(true)}
    />
  );
}