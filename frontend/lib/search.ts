import { formatDateRange } from "./format";
import type { Listing } from "./types";

export interface SearchState {
  city: string | null;
  checkIn: string | null;
  checkOut: string | null;
  adults: number;
  children: number;
}

export const emptySearch: SearchState = {
  city: null,
  checkIn: null,
  checkOut: null,
  adults: 2,
  children: 0,
};

export function totalGuests(s: SearchState): number {
  return s.adults + s.children;
}

export function searchToParams(s: SearchState): URLSearchParams {
  const p = new URLSearchParams();
  if (s.city) p.set("city", s.city);
  if (s.checkIn) p.set("checkin", s.checkIn);
  if (s.checkOut) p.set("checkout", s.checkOut);
  if (s.adults !== emptySearch.adults) p.set("adults", String(s.adults));
  if (s.children) p.set("children", String(s.children));
  return p;
}

export function paramsToSearch(p: URLSearchParams): SearchState {
  return {
    city: p.get("city"),
    checkIn: p.get("checkin"),
    checkOut: p.get("checkout"),
    adults: Number(p.get("adults")) || emptySearch.adults,
    children: Number(p.get("children")) || 0,
  };
}

export function destLabel(s: SearchState): string {
  return s.city ?? "Anywhere";
}

export function datesLabel(s: SearchState): string {
  if (s.checkIn && s.checkOut) return formatDateRange(s.checkIn, s.checkOut);
  if (s.checkIn) return "Add checkout";
  return "Any week";
}

export function guestsLabel(s: SearchState): string {
  const total = totalGuests(s);
  return total === 1 ? "1 guest" : `${total} guests`;
}

// Distinct cities from a set of listings, for destination pills.
export function citiesFrom(listings: Listing[] | undefined): string[] {
  if (!listings) return [];
  return Array.from(new Set(listings.map((l) => l.city))).sort();
}
