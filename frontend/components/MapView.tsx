'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import {
    Map as MapCanvas,
    MapControls,
    MapMarker,
    MarkerContent,
    useMap,
} from '@/components/ui/map';
import { formatPrice } from '@/lib/format';
import {
    bboxFromMap,
    boundsFromListings,
    centerFromListings,
    debounce,
    defaultCenter,
} from '@/lib/map';
import type { Listing, ListingFilters } from '@/lib/types';

export function MapView({
    listings,
    activeId,
    onHover,
    onBoundsChange,
    className,
    compact = false,
}: {
    listings: Listing[];
    activeId?: number | null;
    onHover?: (id: number | null) => void;
    onBoundsChange?: (
        bbox: Pick<
            ListingFilters,
            'min_latitude' | 'max_latitude' | 'min_longitude' | 'max_longitude'
        >,
    ) => void;
    className?: string;
    /** Shorter fixed height for listing detail pages. */
    compact?: boolean;
}) {
    const router = useRouter();
    const { theme } = useTheme();

    const center = useMemo(() => centerFromListings(listings), [listings]);
    const initialZoom = listings.length <= 1 ? 11 : 7;

    const heightClass = compact ? 'h-[280px]' : 'h-[calc(100vh-190px)] min-h-[420px]';

    return (
        <div
            className={`relative overflow-hidden rounded-porch border border-line bg-surface2 ${heightClass} ${className ?? ''}`}
        >
            <MapCanvas
                theme={theme}
                center={listings.length > 0 ? center : defaultCenter}
                zoom={initialZoom}
                className='h-full w-full'
                attributionControl={{ compact: true }}
            >
                <FitBounds listings={listings} compact={compact} />
                {onBoundsChange && <BoundsReporter onBoundsChange={onBoundsChange} />}
                {listings.map((listing) => {
                    const active = activeId === listing.id;
                    return (
                        <MapMarker
                            key={listing.id}
                            longitude={listing.longitude}
                            latitude={listing.latitude}
                            onMouseEnter={() => onHover?.(listing.id)}
                            onMouseLeave={() => onHover?.(null)}
                            onClick={() => router.push(`/listings/${listing.id}`)}
                        >
                            <MarkerContent>
                                <button
                                    type='button'
                                    className='cursor-pointer rounded-full border px-2.5 py-1 shadow-porch transition-transform hover:scale-105'
                                    style={{
                                        font: '600 12px var(--font-sans)',
                                        background: active ? 'var(--ink)' : 'var(--surface)',
                                        color: active ? 'var(--bg)' : 'var(--ink)',
                                        borderColor: active ? 'var(--ink)' : 'var(--line)',
                                    }}
                                >
                                    {formatPrice(listing.price_per_night)}
                                </button>
                            </MarkerContent>
                        </MapMarker>
                    );
                })}
                <MapControls
                    position='top-right'
                    showZoom
                    showCompass={false}
                    showLocate={false}
                    showFullscreen={false}
                />
            </MapCanvas>
        </div>
    );
}

function FitBounds({ listings, compact }: { listings: Listing[]; compact: boolean }) {
    const { map, isLoaded } = useMap();
    const prevKey = useRef('');

    useEffect(() => {
        if (!map || !isLoaded || listings.length === 0) return;

        const key = listings.map((l) => l.id).join(',');
        if (key === prevKey.current) return;
        prevKey.current = key;

        const bounds = boundsFromListings(listings);
        if (!bounds) return;

        map.fitBounds(bounds, {
            padding: compact ? 40 : 56,
            maxZoom: listings.length === 1 ? 12 : 11,
            duration: 0,
        });
    }, [map, isLoaded, listings, compact]);

    return null;
}

function BoundsReporter({
    onBoundsChange,
}: {
    onBoundsChange: (
        bbox: Pick<
            ListingFilters,
            'min_latitude' | 'max_latitude' | 'min_longitude' | 'max_longitude'
        >,
    ) => void;
}) {
    const { map, isLoaded } = useMap();
    const onBoundsChangeRef = useRef(onBoundsChange);
    onBoundsChangeRef.current = onBoundsChange;

    const report = useMemo(
        () =>
            debounce(() => {
                if (!map) return;
                onBoundsChangeRef.current(bboxFromMap(map));
            }, 300),
        [map],
    );

    useEffect(() => {
        if (!map || !isLoaded) return;

        const handleMoveEnd = () => report();
        map.on('moveend', handleMoveEnd);
        report();

        return () => {
            map.off('moveend', handleMoveEnd);
        };
    }, [map, isLoaded, report]);

    return null;
}
