import {
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { apiFetch, setToken } from './api';
import type {
    Booking,
    BookingCreate,
    BookingUpdate,
    Listing,
    ListingAvailability,
    ListingCreate,
    ListingFilters,
    ListingUpdate,
    Photo,
    Review,
    ReviewCreate,
    Token,
    User,
} from './types';

const INFINITE_PAGE_SIZE = 20;

export const queryKeys = {
    me: ['me'] as const,
    listings: (filters: ListingFilters) => ['listings', filters] as const,
    infiniteListings: (filters: ListingFilters) => ['listings', 'infinite', filters] as const,
    listing: (id: number) => ['listing', id] as const,
    availability: (listingId: number) => ['availability', listingId] as const,
    reviews: (listingId: number) => ['reviews', listingId] as const,
    trips: ['trips'] as const,
    hosting: ['hosting'] as const,
    favorites: ['favorites'] as const,
};

/* ---------------------------------- auth --------------------------------- */

export function useCurrentUser() {
    return useQuery({
        queryKey: queryKeys.me,
        queryFn: () => apiFetch<User>('/users/me', { auth: true }),
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
}

export function useSignup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: { email: string; password: string; name: string }) =>
            apiFetch<Token>('/users/signup', { method: 'POST', body: payload }),
        onSuccess: (token) => {
            setToken(token.access_token);
            qc.invalidateQueries();
        },
    });
}

export function useLogin() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: { email: string; password: string }) => {
            // The login endpoint is OAuth2 password flow: form-encoded, email in
            // the `username` field.
            const form = new URLSearchParams();
            form.set('username', payload.email);
            form.set('password', payload.password);
            return apiFetch<Token>('/users/login', { method: 'POST', raw: form });
        },
        onSuccess: (token) => {
            setToken(token.access_token);
            qc.invalidateQueries();
        },
    });
}

/* -------------------------------- listings ------------------------------- */

export function useListings(filters: ListingFilters = {}) {
    return useQuery({
        queryKey: queryKeys.listings(filters),
        queryFn: () =>
            apiFetch<Listing[]>('/listings', {
                query: filters as Record<string, string | number | undefined>,
            }),
        placeholderData: keepPreviousData,
    });
}

export function useInfiniteListings(filters: Omit<ListingFilters, 'offset' | 'limit'> = {}) {
    const pageFilters = { ...filters, limit: INFINITE_PAGE_SIZE };
    return useInfiniteQuery({
        queryKey: queryKeys.infiniteListings(pageFilters),
        queryFn: ({ pageParam }) =>
            apiFetch<Listing[]>('/listings', {
                query: {
                    ...pageFilters,
                    offset: pageParam,
                } as Record<string, string | number | undefined>,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) =>
            lastPage.length === INFINITE_PAGE_SIZE
                ? allPages.length * INFINITE_PAGE_SIZE
                : undefined,
        placeholderData: keepPreviousData,
    });
}

export function useListing(id: number | null) {
    return useQuery({
        queryKey: queryKeys.listing(id ?? -1),
        queryFn: () => apiFetch<Listing>(`/listings/${id}`),
        enabled: id !== null,
    });
}

export function useCreateListing() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: ListingCreate) =>
            apiFetch<Listing>('/listings', {
                method: 'POST',
                body: payload,
                auth: true,
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['listings'] });
        },
    });
}

export function useUpdateListing() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: ListingUpdate }) =>
            apiFetch<Listing>(`/listings/${id}`, {
                method: 'PATCH',
                body: payload,
                auth: true,
            }),
        onSuccess: (listing) => {
            qc.invalidateQueries({ queryKey: ['listings'] });
            qc.invalidateQueries({ queryKey: queryKeys.listing(listing.id) });
        },
    });
}

export function useDeleteListing() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<void>(`/listings/${id}`, { method: 'DELETE', auth: true }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['listings'] });
        },
    });
}

/* -------------------------------- bookings ------------------------------- */

export function useMyTrips(enabled = true) {
    return useQuery({
        queryKey: queryKeys.trips,
        queryFn: () => apiFetch<Booking[]>('/bookings/me', { auth: true }),
        enabled,
    });
}

export function useHostingBookings(enabled = true) {
    return useQuery({
        queryKey: queryKeys.hosting,
        queryFn: () => apiFetch<Booking[]>('/bookings/hosting', { auth: true }),
        enabled,
    });
}

export function useCreateBooking() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: BookingCreate) =>
            apiFetch<Booking>('/bookings', {
                method: 'POST',
                body: payload,
                auth: true,
            }),
        onSuccess: (_booking, payload) => {
            qc.invalidateQueries({ queryKey: queryKeys.trips });
            qc.invalidateQueries({ queryKey: queryKeys.hosting });
            qc.invalidateQueries({ queryKey: queryKeys.availability(payload.listing_id) });
        },
    });
}

export function useUpdateBooking() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: BookingUpdate }) =>
            apiFetch<Booking>(`/bookings/${id}`, {
                method: 'PATCH',
                body: payload,
                auth: true,
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.trips });
        },
    });
}

export function useCancelBooking() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) =>
            apiFetch<void>(`/bookings/${id}`, { method: 'DELETE', auth: true }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: queryKeys.trips });
        },
    });
}

/* -------------------------------- reviews -------------------------------- */

export function useListingAvailability(listingId: number | null) {
    return useQuery({
        queryKey: queryKeys.availability(listingId ?? -1),
        queryFn: () => apiFetch<ListingAvailability>(`/listings/${listingId}/availability`),
        enabled: listingId !== null,
    });
}

export function useReviews(listingId: number | null) {
    return useQuery({
        queryKey: queryKeys.reviews(listingId ?? -1),
        queryFn: () => apiFetch<Review[]>(`/listings/${listingId}/reviews`),
        enabled: listingId !== null,
    });
}

export function useCreateReview() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ listingId, payload }: { listingId: number; payload: ReviewCreate }) =>
            apiFetch<Review>(`/listings/${listingId}/reviews`, {
                method: 'POST',
                body: payload,
                auth: true,
            }),
        onSuccess: (review) => {
            qc.invalidateQueries({ queryKey: queryKeys.reviews(review.listing_id) });
        },
    });
}

/* ------------------------------- favorites ------------------------------- */

export function useFavorites(enabled = true) {
    return useQuery({
        queryKey: queryKeys.favorites,
        queryFn: () => apiFetch<Listing[]>('/favorites/me', { auth: true }),
        enabled,
    });
}

export function useAddFavorite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (listingId: number) =>
            apiFetch<Listing>('/favorites', {
                method: 'POST',
                body: { listing_id: listingId },
                auth: true,
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.favorites }),
    });
}

export function useRemoveFavorite() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (listingId: number) =>
            apiFetch<void>(`/favorites/${listingId}`, {
                method: 'DELETE',
                auth: true,
            }),
        onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.favorites }),
    });
}

/* --------------------------------- photos -------------------------------- */

export function useUploadPhoto() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ listingId, file }: { listingId: number; file: File }) => {
            const form = new FormData();
            form.set('file', file);
            return apiFetch<Photo>(`/listings/${listingId}/photos`, {
                method: 'POST',
                raw: form,
                auth: true,
            });
        },
        onSuccess: (photo) => {
            qc.invalidateQueries({ queryKey: ['listings'] });
            qc.invalidateQueries({ queryKey: queryKeys.listing(photo.listing_id) });
        },
    });
}

export function useDeletePhoto() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ listingId, photoId }: { listingId: number; photoId: number }) =>
            apiFetch<void>(`/listings/${listingId}/photos/${photoId}`, {
                method: 'DELETE',
                auth: true,
            }),
        onSuccess: (_data, { listingId }) => {
            qc.invalidateQueries({ queryKey: ['listings'] });
            qc.invalidateQueries({ queryKey: queryKeys.listing(listingId) });
        },
    });
}
