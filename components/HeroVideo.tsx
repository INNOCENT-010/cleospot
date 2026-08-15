"use client";

import { useEffect, useRef, useState } from "react";

type Video = { id: string; url: string };

export default function HeroVideo({ videos }: { videos: Video[] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!videos.length) return;
    const v = videoRef.current;
    if (!v) return;
    v.src = videos[current].url;
    v.load();
    v.play().catch(() => {});
  }, [current, videos]);

  function handleEnded() {
    setCurrent((c) => (c + 1) % videos.length);
  }

  if (!videos.length) return null;

  return (
    <div className="relative w-full h-[55vh] md:h-[70vh] overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Hero text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <p className="text-xs uppercase tracking-[0.25em] text-[#e8a87c] font-medium mb-3">
          Fresh · Home-cooked · Ready now
        </p>
        <h1 className="brand-script text-5xl md:text-7xl text-white leading-tight mb-4 drop-shadow-lg">
          Today&apos;s Plates
        </h1>
        <p className="text-white/80 text-sm md:text-base max-w-md">
          Made with care, packed with flavour — order your favourite Nigerian meal delivered straight to you.
        </p>
      </div>

      {/* Video dots */}
      {videos.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {videos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === current ? "bg-white w-4" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}