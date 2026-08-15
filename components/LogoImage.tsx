"use client";

export default function LogoImage({ src, alt, size = "header" }: { 
  src: string; 
  alt: string; 
  size?: "header" | "footer" 
}) {
  if (size === "footer") {
    return (
      <img
        src={src}
        alt={alt}
        className="h-24 w-auto object-contain"
        style={{ mixBlendMode: "screen" }}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="h-16 w-auto object-contain"
      style={{ mixBlendMode: "multiply" }}
    />
  );
}