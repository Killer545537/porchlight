'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ListingCard } from '@/components/ListingCard';
import { MapView } from '@/components/MapView';
import { SearchWidget } from '@/components/SearchWidget';
import { CenterLoader, EmptyState, Spinner } from '@/components/ui';
import { useInfiniteListings, useListings } from '@/lib/hooks';
import {
    citiesFrom,
    datesLabel,
    destLabel,
    guestsLabel,
    paramsToSearch,
    type SearchState,
    searchToParams,
    totalGuests,
} from '@/lib/search';
import type { ListingFilters } from '@/lib/types';

const PRICE_RANGES = [
    { key: 'any', label: 'Any price', min: undefined, max: undefined },
    { key: 'lt150', label: '< $150', min: undefined, max: 150 },
    { key: '150-250', label: '$150–250', min: 150, max: 250 },
    { key: '250-400', label: '$250–400', min: 250, max: 400 },
    { key: 'gt400', label: '$400+', min: 400, max: undefined },
] as const;

type BboxFilters = Pick<
    ListingFilters,
    'min_latitude' | 'max_latitude' | 'min_longitude' | 'max_longitude'
>;

function ExploreInner() {
    const router = useRouter();
    const params = useSearchParams();
    const search = useMemo(() => paramsToSearch(new URLSearchParams(params.toString())), [params]);

    const [draft, setDraft] = useState<SearchState>(search);
    const [searchOpen, setSearchOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [priceKey, setPriceKey] = useState<(typeof PRICE_RANGES)[number]['key']>('any');
    const [amenities, setAmenities] = useState<Set<string>>(new Set());
    const [view, setView] = useState<'grid' | 'map'>('grid');
    const [hovered, setHovered] = useState<number | null>(null);
    const [bbox, setBbox] = useState<BboxFilters | null>(null);
    const [isDesktop, setIsDesktop] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const update = () => setIsDesktop(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        const onScroll = () => setShowBackToTop(window.scrollY > window.innerHeight * 2);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // All listings power the destination + amenity option lists.
    const { data: allListings } = useListings({ limit: 100 });

    const price = PRICE_RANGES.find((p) => p.key === priceKey) ?? PRICE_RANGES[0];
    const mapActive = view === 'map';
    const bboxApplies = bbox && (isDesktop || mapActive);
    const filters: Omit<ListingFilters, 'offset' | 'limit'> = {
        city: search.city ?? undefined,
        max_guests: totalGuests(search) || undefined,
        min_price: price.min,
        max_price: price.max,
        ...(bboxApplies ? bbox : {}),
    };
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteListings(filters);

    const listings = useMemo(() => data?.pages.flat() ?? [], [data]);

    // Amenities aren't a backend filter, so refine client-side.
    const results = useMemo(() => {
        if (amenities.size === 0) return listings;
        return listings.filter((l) => Array.from(amenities).every((a) => l.amenities.includes(a)));
    }, [listings, amenities]);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasNextPage || isFetchingNextPage) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) fetchNextPage();
            },
            { rootMargin: '200px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const cities = citiesFrom(allListings);
    const amenityOptions = useMemo(
        () => Array.from(new Set((allListings ?? []).flatMap((l) => l.amenities))).sort(),
        [allListings],
    );

    const activeFilterCount = (priceKey !== 'any' ? 1 : 0) + amenities.size;

    const submitSearch = () => {
        setSearchOpen(false);
        router.replace(`/explore?${searchToParams(draft).toString()}`);
    };

    const clearAll = () => {
        setPriceKey('any');
        setAmenities(new Set());
        setBbox(null);
        setDraft({ ...draft, city: null, checkIn: null, checkOut: null });
        router.replace('/explore');
    };

    const listingGrid = (
        <>
            <div className='grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-[18px] lg:grid-cols-1 lg:gap-3.5 xl:grid-cols-2'>
                {results.map((listing) => (
                    <div
                        key={listing.id}
                        onMouseEnter={() => setHovered(listing.id)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <ListingCard listing={listing} highlighted={hovered === listing.id} />
                    </div>
                ))}
            </div>
            {hasNextPage && (
                <div ref={sentinelRef} className='flex justify-center py-8'>
                    {isFetchingNextPage && <Spinner />}
                </div>
            )}
        </>
    );

    const mapPanel = (
        <MapView
            listings={results}
            activeId={hovered}
            onHover={setHovered}
            onBoundsChange={setBbox}
            className='lg:h-[calc(100vh-140px)] lg:min-h-0'
        />
    );

    return (
        <div className='mx-auto w-full max-w-[1440px] px-[clamp(14px,3vw,28px)] pb-20 pt-3.5'>
            {/* control bar */}
            <div className='flex flex-wrap items-center gap-2.5 pb-3.5 pt-1'>
                <button
                    type='button'
                    onClick={() => setSearchOpen((o) => !o)}
                    className='flex max-w-full items-center gap-2.5 overflow-hidden rounded-full border border-line bg-surface px-4 py-2.5 text-ink transition-colors hover:border-ink3'
                    style={{ font: '500 13.5px var(--font-sans)' }}
                >
                    <span className='whitespace-nowrap'>{destLabel(search)}</span>
                    <span className='text-line'>|</span>
                    <span className='whitespace-nowrap text-ink2'>{datesLabel(search)}</span>
                    <span className='text-line'>|</span>
                    <span className='whitespace-nowrap text-ink2'>{guestsLabel(search)}</span>
                    <span className='mono text-[9.5px] tracking-[0.1em] text-accent'>EDIT</span>
                </button>

                <button
                    type='button'
                    onClick={() => setFiltersOpen((o) => !o)}
                    className='flex items-center gap-[7px] rounded-full border border-line px-[15px] py-2.5 text-ink transition-colors hover:border-ink3'
                    style={{ font: '500 13px var(--font-sans)' }}
                >
                    Filters
                    {activeFilterCount > 0 && (
                        <span className='mono rounded-full bg-ink px-[7px] py-0.5 text-[10px] text-bg'>
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                <button
                    type='button'
                    onClick={() =>
                        setView((v) => {
                            if (v === 'map') setBbox(null);
                            return v === 'map' ? 'grid' : 'map';
                        })
                    }
                    className='rounded-full border border-line px-[15px] py-2.5 text-ink transition-colors hover:border-ink3 lg:hidden'
                    style={{ font: '500 13px var(--font-sans)' }}
                >
                    {view === 'map' ? 'Show list' : 'Show map'}
                </button>

                <div className='flex-1' />
                <div className='mono text-[10.5px] tracking-[0.12em] text-ink3'>
                    {results.length} {results.length === 1 ? 'STAY' : 'STAYS'}
                </div>
            </div>

            {searchOpen && (
                <div className='animate-rise mb-4'>
                    <SearchWidget
                        value={draft}
                        onChange={setDraft}
                        cities={cities}
                        onSubmit={submitSearch}
                        submitLabel='Update'
                    />
                </div>
            )}

            {filtersOpen && (
                <div className='animate-rise mb-4 grid gap-3 rounded-porch border border-line bg-surface p-4'>
                    <FilterRow label='PRICE'>
                        {PRICE_RANGES.map((p) => (
                            <FilterPill
                                key={p.key}
                                label={p.label}
                                active={priceKey === p.key}
                                onClick={() => setPriceKey(p.key)}
                            />
                        ))}
                    </FilterRow>
                    {amenityOptions.length > 0 && (
                        <FilterRow label='HAS'>
                            {amenityOptions.map((a) => (
                                <FilterPill
                                    key={a}
                                    label={a}
                                    active={amenities.has(a)}
                                    onClick={() =>
                                        setAmenities((prev) => {
                                            const next = new Set(prev);
                                            if (next.has(a)) next.delete(a);
                                            else next.add(a);
                                            return next;
                                        })
                                    }
                                />
                            ))}
                        </FilterRow>
                    )}
                    <div className='flex justify-end'>
                        <button
                            type='button'
                            onClick={clearAll}
                            className='mono cursor-pointer text-[11px] text-ink3 underline underline-offset-[3px] hover:text-ink'
                        >
                            Clear all
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <CenterLoader />
            ) : results.length === 0 ? (
                <EmptyState
                    title='Nothing matches that combination.'
                    body='Try loosening a filter or two — the collection is small on purpose.'
                    action={
                        <button
                            type='button'
                            onClick={clearAll}
                            className='rounded-porch bg-ink px-5 py-2.5 text-bg transition-transform active:scale-[0.97]'
                            style={{ font: '600 14px var(--font-sans)' }}
                        >
                            Clear filters &amp; dates
                        </button>
                    }
                />
            ) : (
                <>
                    {/* Desktop: split list + map */}
                    <div className='hidden lg:grid lg:grid-cols-[1fr_minmax(380px,42%)] lg:gap-4'>
                        <div>{listingGrid}</div>
                        <div className='sticky top-[76px] self-start'>{mapPanel}</div>
                    </div>

                    {/* Mobile: toggle between grid and map */}
                    <div className='lg:hidden'>{mapActive ? mapPanel : listingGrid}</div>
                </>
            )}

            {showBackToTop && (
                <button
                    type='button'
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className='fixed bottom-6 right-6 z-50 rounded-full border border-line bg-surface px-4 py-2.5 shadow-porch transition-transform active:scale-95'
                    style={{ font: '500 13px var(--font-sans)' }}
                >
                    ↑ Top
                </button>
            )}
        </div>
    );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className='flex flex-wrap items-center gap-2'>
            <span className='mono min-w-[72px] text-[9.5px] tracking-[0.14em] text-ink3'>
                {label}
            </span>
            {children}
        </div>
    );
}

function FilterPill({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            className='rounded-full border px-3 py-1.5 capitalize transition-colors'
            style={{
                font: '500 12.5px var(--font-sans)',
                borderColor: active ? 'var(--ink)' : 'var(--line)',
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--bg)' : 'var(--ink)',
            }}
        >
            {label}
        </button>
    );
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<CenterLoader />}>
            <ExploreInner />
        </Suspense>
    );
}
