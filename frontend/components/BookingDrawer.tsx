'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { formatPrice, formatShortDate, nightsBetween } from '@/lib/format';
import { useCreateBooking } from '@/lib/hooks';
import { coverPhoto } from '@/lib/photo';
import type { Listing } from '@/lib/types';
import { Spinner } from './ui';

interface BookingDrawerProps {
    listing: Listing;
    checkIn: string;
    checkOut: string;
    guests: number;
    onClose: () => void;
}

export function BookingDrawer({ listing, checkIn, checkOut, guests, onClose }: BookingDrawerProps) {
    const createBooking = useCreateBooking();
    const [bookingId, setBookingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const nights = nightsBetween(checkIn, checkOut);
    const total = nights * listing.price_per_night;
    const photo = coverPhoto(listing);

    const confirm = async () => {
        setError(null);
        try {
            const booking = await createBooking.mutateAsync({
                listing_id: listing.id,
                check_in: checkIn,
                check_out: checkOut,
                guests,
            });
            setBookingId(booking.id);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Couldn't complete the booking.");
        }
    };

    const confirmed = bookingId !== null;

    return (
        <div className='fixed inset-0 z-[80]'>
            <button
                type='button'
                aria-label='Close booking'
                onClick={onClose}
                className='animate-fade absolute inset-0 backdrop-blur-[3px]'
                style={{ background: 'oklch(0.14 0.012 252 / 0.45)' }}
            />
            <div className='animate-panel absolute bottom-0 right-0 top-0 flex w-[min(480px,100vw)] flex-col border-l border-line bg-surface shadow-porch'>
                <div className='flex items-center justify-between border-b border-line px-5 py-4'>
                    <div>
                        <div className='mono text-[9.5px] tracking-[0.16em] text-ink3'>
                            {confirmed ? 'CONFIRMED' : 'REVIEW YOUR STAY'}
                        </div>
                        <div className='mt-[3px]' style={{ font: '600 17px var(--font-sans)' }}>
                            {confirmed ? "You're booked." : 'Confirm and book'}
                        </div>
                    </div>
                    <button
                        type='button'
                        onClick={onClose}
                        className='grid h-[34px] w-[34px] place-items-center rounded-full border border-line text-[15px] text-ink hover:border-ink3'
                    >
                        ×
                    </button>
                </div>

                <div className='flex-1 overflow-y-auto p-5'>
                    {confirmed ? (
                        <div className='grid justify-items-center gap-3.5 py-10 text-center'>
                            <svg
                                width='76'
                                height='76'
                                viewBox='0 0 76 76'
                                role='img'
                                aria-label='Booking confirmed'
                            >
                                <title>Booking confirmed</title>
                                <circle
                                    cx='38'
                                    cy='38'
                                    r='34'
                                    fill='none'
                                    stroke='var(--accent)'
                                    strokeWidth='2'
                                    strokeDasharray='214'
                                    strokeDashoffset='214'
                                    style={{ animation: 'drawCheck 0.6s ease 0.1s forwards' }}
                                />
                                <path
                                    d='M24 39 L34 49 L53 28'
                                    fill='none'
                                    stroke='var(--accent)'
                                    strokeWidth='3.5'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeDasharray='44'
                                    strokeDashoffset='44'
                                    style={{ animation: 'drawCheck 0.45s ease 0.6s forwards' }}
                                />
                            </svg>
                            <div
                                style={{
                                    font: '600 24px var(--font-sans)',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                You&apos;re booked.
                            </div>
                            <div
                                className='text-ink2'
                                style={{ font: '400 14px/1.5 var(--font-sans)' }}
                            >
                                {listing.title} · {formatShortDate(checkIn)} –{' '}
                                {formatShortDate(checkOut)}
                            </div>
                            <div className='mono rounded-porch border border-line px-3 py-1.5 text-[11px] tracking-[0.1em] text-ink3'>
                                PL-{String(bookingId).padStart(4, '0')}
                            </div>
                            <div className='mt-2 flex gap-2.5'>
                                <Link
                                    href='/trips'
                                    className='rounded-porch bg-ink px-5 py-3 text-bg no-underline transition-transform active:scale-[0.97]'
                                    style={{ font: '600 14px var(--font-sans)' }}
                                >
                                    View my trips
                                </Link>
                                <button
                                    type='button'
                                    onClick={onClose}
                                    className='rounded-porch border border-line px-5 py-3 text-ink'
                                    style={{ font: '500 14px var(--font-sans)' }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className='grid gap-4'>
                            <div className='flex items-center gap-3'>
                                <div className='relative h-16 w-[84px] flex-none overflow-hidden rounded-porch'>
                                    <div
                                        className='absolute inset-0'
                                        style={{ background: photo.background }}
                                    />
                                </div>
                                <div className='min-w-0'>
                                    <div
                                        className='overflow-hidden text-ellipsis whitespace-nowrap'
                                        style={{ font: '600 15px var(--font-sans)' }}
                                    >
                                        {listing.title}
                                    </div>
                                    <div
                                        className='text-[12.5px] text-ink3'
                                        style={{ fontFamily: 'var(--font-sans)' }}
                                    >
                                        {listing.city}, {listing.country}
                                    </div>
                                </div>
                            </div>

                            <div className='grid gap-2.5 rounded-porch border border-line p-3.5'>
                                <Row k='Check-in' v={formatShortDate(checkIn)} />
                                <Row k='Checkout' v={formatShortDate(checkOut)} />
                                <Row
                                    k='Guests'
                                    v={`${guests} ${guests === 1 ? 'guest' : 'guests'}`}
                                />
                            </div>

                            <div className='grid gap-2 rounded-porch border border-line p-3.5'>
                                <Row
                                    k={`${formatPrice(listing.price_per_night)} × ${nights} ${nights === 1 ? 'night' : 'nights'}`}
                                    v={formatPrice(total)}
                                    muted
                                />
                                <div
                                    className='flex justify-between border-t border-line pt-2.5'
                                    style={{ font: '600 15px var(--font-sans)' }}
                                >
                                    <span>Total</span>
                                    <span>{formatPrice(total)}</span>
                                </div>
                            </div>

                            <div className='mono text-[11px] leading-relaxed text-ink3'>
                                FREE CANCELLATION FOR 48 HOURS.
                                <br />
                                THIS IS THE WHOLE PRICE — NO FEES ADDED AT CHECKOUT.
                            </div>

                            {error && (
                                <div
                                    style={{
                                        font: '500 13px var(--font-sans)',
                                        color: 'var(--bad)',
                                    }}
                                >
                                    {error}
                                </div>
                            )}

                            <button
                                type='button'
                                onClick={confirm}
                                disabled={createBooking.isPending}
                                className='flex items-center justify-center gap-2 rounded-porch bg-ink p-4 text-bg transition-transform active:scale-[0.98] disabled:opacity-70'
                                style={{ font: '600 15px var(--font-sans)' }}
                            >
                                {createBooking.isPending && <Spinner size={15} />}
                                Confirm booking · {formatPrice(total)}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
    return (
        <div
            className='flex justify-between'
            style={{
                font: '400 13.5px var(--font-sans)',
                color: muted ? 'var(--ink2)' : 'inherit',
            }}
        >
            <span style={{ color: muted ? 'var(--ink2)' : 'var(--ink3)' }}>{k}</span>
            <span style={{ fontWeight: 500 }}>{v}</span>
        </div>
    );
}
