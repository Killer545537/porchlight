'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice, ratingLabel } from '@/lib/format';
import { useAddFavorite, useFavorites, useRemoveFavorite } from '@/lib/hooks';
import { coverPhoto } from '@/lib/photo';
import type { Listing } from '@/lib/types';
import { useAuth } from './AuthProvider';
import { useToast } from './ToastProvider';

export function ListingCard({
    listing,
    highlighted,
    onMouseEnter,
    onMouseLeave,
}: {
    listing: Listing;
    highlighted?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}) {
    const router = useRouter();
    const { isAuthed } = useAuth();
    const { toast } = useToast();
    const { data: favorites } = useFavorites(isAuthed);
    const addFavorite = useAddFavorite();
    const removeFavorite = useRemoveFavorite();

    const photo = coverPhoto(listing);
    const isFav = !!favorites?.some((f) => f.id === listing.id);

    const toggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthed) {
            toast('Sign in to save places', {
                label: 'Sign in',
                run: () => router.push('/auth'),
            });
            return;
        }
        if (isFav) {
            removeFavorite.mutate(listing.id);
            toast('Removed from saved');
        } else {
            addFavorite.mutate(listing.id);
            toast('Saved to your list');
        }
    };

    return (
        <Link
            href={`/listings/${listing.id}`}
            className={`group block overflow-hidden rounded-porch border bg-surface no-underline transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-[3px] hover:shadow-porch ${
                highlighted ? 'border-ink shadow-porch' : 'border-line'
            }`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className='relative aspect-[4/3] overflow-hidden bg-surface2'>
                <div className='absolute inset-0' style={{ background: photo.background }} />
                <div
                    className='mono absolute left-2 top-2 rounded-porch px-[7px] py-[3px] text-[9px] tracking-[0.06em] text-ink2 backdrop-blur-[3px]'
                    style={{
                        background: 'color-mix(in oklab, var(--surface) 80%, transparent)',
                    }}
                >
                    {listing.city.toUpperCase()}
                </div>
                <button
                    type='button'
                    onClick={toggleFavorite}
                    title='Save'
                    className='absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full text-[15px] leading-none backdrop-blur-[3px] transition-transform active:scale-[0.85]'
                    style={{
                        background: 'color-mix(in oklab, var(--surface) 78%, transparent)',
                    }}
                >
                    <span style={{ color: isFav ? 'var(--accent)' : 'var(--ink2)' }}>
                        {isFav ? '♥' : '♡'}
                    </span>
                </button>
            </div>
            <div className='grid gap-[3px] px-3.5 pb-3.5 pt-3'>
                <div className='flex items-baseline justify-between gap-2.5'>
                    <div
                        className='overflow-hidden text-ellipsis whitespace-nowrap text-ink'
                        style={{
                            font: '600 15px var(--font-sans)',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {listing.title}
                    </div>
                    <div className='mono flex-none text-[12px] text-ink2'>
                        {ratingLabel(listing.avg_rating, listing.review_count)}
                    </div>
                </div>
                <div className='flex items-baseline justify-between gap-2.5'>
                    <div
                        className='text-[13px] text-ink3'
                        style={{ fontFamily: 'var(--font-sans)' }}
                    >
                        {listing.city}, {listing.country}
                    </div>
                    <div className='mono flex-none text-[12px] text-ink2'>
                        Sleeps {listing.max_guests}
                    </div>
                </div>
                <div className='mt-1 text-ink' style={{ font: '500 14px var(--font-sans)' }}>
                    {formatPrice(listing.price_per_night)}{' '}
                    <span className='mono text-[11.5px] text-ink3'>/ NIGHT</span>
                </div>
            </div>
        </Link>
    );
}
