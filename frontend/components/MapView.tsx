"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Listing } from "@/lib/types";

// An abstract, tile-free map — the design's "region map" aesthetic. Pins are
// placed by normalizing each listing's real lat/lng into the viewport, so the
// relative geography is honest even though there's no basemap.
export function MapView({
  listings,
  activeId,
  onHover,
}: {
  listings: Listing[];
  activeId?: number | null;
  onHover?: (id: number | null) => void;
}) {
  const router = useRouter();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );

  const positions = useMemo(() => {
    if (listings.length === 0)
      return new Map<number, { x: number; y: number }>();
    const lats = listings.map((l) => l.latitude);
    const lngs = listings.map((l) => l.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const spanLat = maxLat - minLat || 1;
    const spanLng = maxLng - minLng || 1;
    const map = new Map<number, { x: number; y: number }>();
    for (const l of listings) {
      // 12%..88% so pins never hug the edges. Latitude inverts (north = up).
      const x = 12 + ((l.longitude - minLng) / spanLng) * 76;
      const y = 12 + ((maxLat - l.latitude) / spanLat) * 76;
      map.set(l.id, { x, y });
    }
    return map;
  }, [listings]);

  return (
    <div className="relative h-[calc(100vh-190px)] min-h-[420px] overflow-hidden rounded-porch border border-line bg-surface2">
      <div
        className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setPan({
            x: drag.current.px + (e.clientX - drag.current.x),
            y: drag.current.py + (e.clientY - drag.current.y),
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerLeave={() => {
          drag.current = null;
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center",
            transition: drag.current ? "none" : "transform 0.2s ease",
          }}
        >
          {/* Decorative "roads" + a coastline blob, straight from the design. */}
          <div className="absolute left-[-20%] top-[30%] h-[3px] w-[140%] -rotate-[9deg] bg-line" />
          <div className="absolute left-[55%] top-[-20%] h-[140%] w-[3px] rotate-[12deg] bg-line" />
          <div
            className="absolute bottom-[-14%] left-[-12%] h-[52%] w-[46%]"
            style={{
              background:
                "color-mix(in oklab, var(--accent) 7%, var(--surface2))",
              borderRadius: "50% 42% 38% 50%",
            }}
          />
          {listings.map((l) => {
            const pos = positions.get(l.id);
            if (!pos) return null;
            const active = activeId === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onMouseEnter={() => onHover?.(l.id)}
                onMouseLeave={() => onHover?.(null)}
                onClick={() => router.push(`/listings/${l.id}`)}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1 shadow-porch transition-transform hover:scale-105"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  font: "600 12px var(--font-sans)",
                  background: active ? "var(--ink)" : "var(--surface)",
                  color: active ? "var(--bg)" : "var(--ink)",
                  borderColor: active ? "var(--ink)" : "var(--line)",
                  zIndex: active ? 2 : 1,
                }}
              >
                {formatPrice(l.price_per_night)}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="mono pointer-events-none absolute left-2.5 top-2.5 rounded-porch px-2 py-1 text-[9px] tracking-[0.14em] text-ink3"
        style={{
          background: "color-mix(in oklab, var(--surface) 82%, transparent)",
        }}
      >
        REGION MAP
      </div>
      <div className="absolute right-2.5 top-2.5 grid gap-1.5">
        <ZoomBtn
          label="+"
          onClick={() => setZoom((z) => Math.min(2.2, z + 0.25))}
        />
        <ZoomBtn
          label="−"
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.25))}
        />
      </div>
    </div>
  );
}

function ZoomBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-porch border border-line bg-surface text-[16px] text-ink transition-transform active:scale-90"
    >
      {label}
    </button>
  );
}
