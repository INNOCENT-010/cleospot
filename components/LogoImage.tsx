"use client";

export default function LogoImage({ src, alt, size = "header" }: { src: string; alt: string; size?: "header" | "footer" }) {
  if (size === "footer") {
    return (
      <img
        src={src}
        alt={alt}
        className="h-20 w-auto object-contain"
        style={{ filter: "brightness(0) invert(1)" }}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="h-16 w-auto object-contain"
    />
  );
}