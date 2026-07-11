"use client";

import { useEffect, useState } from "react";
import type { ListingPhoto } from "@/lib/photo";

export function GalleryOverlay({
  photos,
  startIndex,
  labels,
  onClose,
}: {
  photos: ListingPhoto[];
  startIndex: number;
  labels?: string[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [photos.length, onClose]);

  const go = (dir: number) =>
    setIndex((i) => (i + dir + photos.length) % photos.length);

  return (
    <div
      className="animate-fade fixed inset-0 z-[90] grid grid-rows-[auto_1fr_auto] backdrop-blur-[8px]"
      style={{ background: "oklch(0.14 0.012 252 / 0.94)" }}
    >
      <div className="flex items-center justify-between px-[18px] py-3.5">
        <span
          className="mono text-[12px]"
          style={{ color: "oklch(0.8 0.005 240)" }}
        >
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full border text-[16px]"
          style={{
            borderColor: "oklch(0.45 0.01 250)",
            color: "oklch(0.9 0.005 240)",
          }}
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[clamp(6px,2vw,16px)] px-[clamp(8px,2vw,20px)]">
        <NavArrow dir="‹" onClick={() => go(-1)} />
        <div className="relative h-[min(66vh,620px)] overflow-hidden rounded-porch">
          <div
            className="absolute inset-0"
            style={{ background: photos[index].background }}
          />
          {labels?.[index] && (
            <div
              className="mono absolute bottom-3 left-3 rounded-porch px-[9px] py-1 text-[10px] tracking-[0.06em]"
              style={{
                background: "oklch(0.97 0.005 240 / 0.85)",
                color: "oklch(0.25 0.01 250)",
              }}
            >
              {labels[index]}
            </div>
          )}
        </div>
        <NavArrow dir="›" onClick={() => go(1)} />
      </div>

      <div className="flex justify-center gap-2 p-4">
        {photos.map((p, i) => (
          <button
            key={`${p.background}-${i}`}
            type="button"
            onClick={() => setIndex(i)}
            className="h-11 w-16 rounded-[2px] transition-opacity"
            style={{
              background: p.background,
              opacity: i === index ? 1 : 0.4,
              outline: i === index ? "2px solid var(--accent)" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function NavArrow({ dir, onClick }: { dir: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full border text-[18px] transition-transform active:scale-90"
      style={{
        borderColor: "oklch(0.45 0.01 250)",
        color: "oklch(0.9 0.005 240)",
      }}
    >
      {dir}
    </button>
  );
}
