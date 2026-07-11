// Mirrors the FastAPI response/request schemas in backend/domain/**/types.py.
// If these ever drift, the backend is the source of truth.

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Listing {
  id: number;
  host_id: number;
  title: string;
  description: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  photos: Photo[];
  created_at: string;
}

export interface ListingCreate {
  title: string;
  description: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
}

export type ListingUpdate = Partial<ListingCreate>;

export interface ListingFilters {
  city?: string;
  min_price?: number;
  max_price?: number;
  max_guests?: number;
  min_latitude?: number;
  max_latitude?: number;
  min_longitude?: number;
  max_longitude?: number;
  limit?: number;
  offset?: number;
}

export interface Booking {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  guests: number;
  total_price: number;
  created_at: string;
}

export interface BookingCreate {
  listing_id: number;
  check_in: string;
  check_out: string;
  guests: number;
}

export interface BookingUpdate {
  check_in?: string;
  check_out?: string;
  guests?: number;
}

export interface Review {
  id: number;
  listing_id: number;
  author_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewCreate {
  rating: number;
  comment: string;
}

export interface Photo {
  id: number;
  listing_id: number;
  url: string;
  created_at: string;
}
