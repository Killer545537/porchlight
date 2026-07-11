'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { HostListingForm } from '@/components/HostListingForm';
import { RequireAuth } from '@/components/RequireAuth';
import { useToast } from '@/components/ToastProvider';
import { CenterLoader, EmptyState } from '@/components/ui';
import { ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useDeleteListing, useHostingBookings, useListings } from '@/lib/hooks';
import { coverPhoto } from '@/lib/photo';
import type { Listing } from '@/lib/types';

function HostInner() {
    const { user } = useAuth();
    const { data: allListings, isLoading } = useListings({ limit: 100 });
    const { data: hostingBookings } = useHostingBookings();

    const myListings = useMemo(
        () => (allListings ?? []).filter((l) => l.host_id === user?.id),
        [allListings, user?.id],
    );

    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Listing | null>(null);

    if (isLoading) return <CenterLoader />;

    const reservationCount = hostingBookings?.length ?? 0;

    return (
        <div className='mx-auto w-full max-w-[1060px] px-[clamp(14px,3.5vw,32px)] pb-20 pt-7'>
            <div className='mb-2 flex flex-wrap items-end justify-between gap-3.5'>
                <div>
                    <h1
                        className='mb-1'
                        style={{
                            font: '600 clamp(26px,4vw,36px)/1.1 var(--font-sans)',
                            letterSpacing: '-0.03em',
                        }}
                    >
                        {user ? `Hello, ${user.name.split(' ')[0]}` : 'Host'}
                    </h1>
                    <div className='mono text-[11px] tracking-[0.14em] text-ink3'>
                        {myListings.length} {myListings.length === 1 ? 'LISTING' : 'LISTINGS'} ·{' '}
                        {reservationCount} {reservationCount === 1 ? 'RESERVATION' : 'RESERVATIONS'}
                    </div>
                </div>
                {!creating && !editing && (
                    <button
                        type='button'
                        onClick={() => setCreating(true)}
                        className='rounded-porch bg-ink px-5 py-3 text-bg transition-transform active:scale-[0.97]'
                        style={{ font: '600 14px var(--font-sans)' }}
                    >
                        + New listing
                    </button>
                )}
            </div>

            {creating && <HostListingForm onDone={() => setCreating(false)} />}
            {editing && <HostListingForm listing={editing} onDone={() => setEditing(null)} />}

            {myListings.length === 0 && !creating ? (
                <EmptyState
                    title='No listings yet.'
                    body='Put your place on the map — set a price, keep your calendar yours.'
                    action={
                        <button
                            type='button'
                            onClick={() => setCreating(true)}
                            className='rounded-porch bg-accent px-5 py-3 text-on-accent transition-transform active:scale-[0.97]'
                            style={{ font: '600 14px var(--font-sans)' }}
                        >
                            Create your first listing →
                        </button>
                    }
                />
            ) : (
                <div className='mt-4 grid gap-3.5'>
                    {myListings.map((listing) => (
                        <HostListingRow
                            key={listing.id}
                            listing={listing}
                            reservations={
                                hostingBookings?.filter((b) => b.listing_id === listing.id)
                                    .length ?? 0
                            }
                            onEdit={() => {
                                setCreating(false);
                                setEditing(listing);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function HostListingRow({
    listing,
    reservations,
    onEdit,
}: {
    listing: Listing;
    reservations: number;
    onEdit: () => void;
}) {
    const del = useDeleteListing();
    const { toast } = useToast();
    const [confirming, setConfirming] = useState(false);

    return (
        <div className='flex flex-wrap overflow-hidden rounded-porch border border-line bg-surface'>
            <Link
                href={`/listings/${listing.id}`}
                className='relative min-h-[104px] flex-[0_0_clamp(96px,16vw,150px)]'
            >
                <div
                    className='absolute inset-0'
                    style={{ background: coverPhoto(listing).background }}
                />
            </Link>
            <div className='flex min-w-[min(100%,220px)] flex-1 flex-wrap items-center justify-between gap-3 p-4'>
                <div className='min-w-0'>
                    <div
                        style={{
                            font: '600 16px var(--font-sans)',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {listing.title}
                    </div>
                    <div
                        className='mt-0.5 text-[13px] text-ink3'
                        style={{ fontFamily: 'var(--font-sans)' }}
                    >
                        {listing.city}, {listing.country} · {formatPrice(listing.price_per_night)}
                        /night
                    </div>
                    <div
                        className='mono mt-1.5 text-[10.5px] tracking-[0.1em]'
                        style={{ color: 'var(--good)' }}
                    >
                        LISTED · {reservations}{' '}
                        {reservations === 1 ? 'RESERVATION' : 'RESERVATIONS'}
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                    {confirming ? (
                        <>
                            <span
                                className='text-ink2'
                                style={{ font: '500 12.5px var(--font-sans)' }}
                            >
                                Delete this listing?
                            </span>
                            <button
                                type='button'
                                onClick={() =>
                                    del.mutate(listing.id, {
                                        onSuccess: () => toast('Listing deleted'),
                                        onError: (e) =>
                                            toast(
                                                e instanceof ApiError
                                                    ? e.message
                                                    : "Couldn't delete",
                                            ),
                                    })
                                }
                                className='rounded-porch px-3.5 py-2.5 text-white transition-transform active:scale-95'
                                style={{
                                    background: 'var(--bad)',
                                    font: '600 12.5px var(--font-sans)',
                                }}
                            >
                                Delete
                            </button>
                            <button
                                type='button'
                                onClick={() => setConfirming(false)}
                                className='rounded-porch border border-line px-3.5 py-2.5 text-ink'
                                style={{ font: '500 12.5px var(--font-sans)' }}
                            >
                                Keep
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type='button'
                                onClick={onEdit}
                                className='rounded-porch border border-line px-3.5 py-2.5 text-ink transition-colors hover:border-ink3'
                                style={{ font: '500 12.5px var(--font-sans)' }}
                            >
                                Edit
                            </button>
                            <button
                                type='button'
                                onClick={() => setConfirming(true)}
                                className='rounded-porch border border-line px-3.5 py-2.5 text-ink2 transition-colors hover:text-bad'
                                style={{ font: '500 12.5px var(--font-sans)' }}
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function HostPage() {
    return (
        <RequireAuth>
            <HostInner />
        </RequireAuth>
    );
}
