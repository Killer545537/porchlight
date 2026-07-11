import { assetUrl } from './api';
import type { Listing } from './types';

// The design mocks every listing photo as a hue-tinted gradient. Real backend
// listings may have no uploaded photos yet, so we fall back to a deterministic
// gradient derived from the listing — same listing always gets the same look.

function hueFor(seed: number | string): number {
    const n =
        typeof seed === 'number'
            ? seed
            : Array.from(String(seed)).reduce((a, c) => a + c.charCodeAt(0), 0);
    // Spread across the wheel but bias away from muddy greens/yellows.
    return (n * 47) % 360;
}

export function gradientFor(seed: number | string): string {
    const h = hueFor(seed);
    const h2 = (h + 42) % 360;
    return `linear-gradient(145deg, oklch(0.7 0.11 ${h}) 0%, oklch(0.52 0.13 ${h2}) 100%)`;
}

export interface ListingPhoto {
    // A CSS `background` value: either url(...) or a gradient fallback.
    background: string;
    isReal: boolean;
}

export function listingPhotos(listing: Listing): ListingPhoto[] {
    if (listing.photos.length > 0) {
        return listing.photos.map((p) => ({
            background: `center / cover no-repeat url("${assetUrl(p.url)}")`,
            isReal: true,
        }));
    }
    // No uploads yet — synthesize four distinct gradient tiles so galleries and
    // cards still read as intended.
    return [0, 1, 2, 3].map((i) => ({
        background: gradientFor(`${listing.id}-${i}`),
        isReal: false,
    }));
}

export function coverPhoto(listing: Listing): ListingPhoto {
    return listingPhotos(listing)[0];
}
