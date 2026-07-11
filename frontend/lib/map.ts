import type { Map as MapLibreMap } from "maplibre-gl";
import type { ListingFilters } from "./types";
import type { Listing } from "./types";

/** Default center — California coast, near seeded listings. */
export const defaultCenter: [number, number] = [-121.5, 37.5];

const SINGLE_POINT_PADDING = 0.08;

export function boundsFromListings(
  listings: Listing[],
): [[number, number], [number, number]] | null {
  if (listings.length === 0) return null;

  const lats = listings.map((l) => l.latitude);
  const lngs = listings.map((l) => l.longitude);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  // Single listing: pad so fitBounds doesn't over-zoom.
  if (listings.length === 1) {
    minLat -= SINGLE_POINT_PADDING;
    maxLat += SINGLE_POINT_PADDING;
    minLng -= SINGLE_POINT_PADDING;
    maxLng += SINGLE_POINT_PADDING;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function centerFromListings(listings: Listing[]): [number, number] {
  const bounds = boundsFromListings(listings);
  if (!bounds) return defaultCenter;
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  return [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
}

export function bboxFromMap(map: MapLibreMap): Pick<
  ListingFilters,
  "min_latitude" | "max_latitude" | "min_longitude" | "max_longitude"
> {
  const b = map.getBounds();
  return {
    min_latitude: b.getSouth(),
    max_latitude: b.getNorth(),
    min_longitude: b.getWest(),
    max_longitude: b.getEast(),
  };
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
