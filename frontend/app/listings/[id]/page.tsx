"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BookingDrawer } from "@/components/BookingDrawer";
import { Calendar } from "@/components/Calendar";
import { GalleryOverlay } from "@/components/GalleryOverlay";
import { MapView } from "@/components/MapView";
import { useToast } from "@/components/ToastProvider";
import { CenterLoader, EmptyState, Stepper } from "@/components/ui";
import { type DateRange, pickDate } from "@/lib/dateRange";
import { formatPrice, formatShortDate, nightsBetween } from "@/lib/format";
import {
  useAddFavorite,
  useFavorites,
  useListing,
  useRemoveFavorite,
  useReviews,
} from "@/lib/hooks";
import { listingPhotos } from "@/lib/photo";

export default function ListingPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const { isAuthed, user } = useAuth();
  const { toast } = useToast();

  const {
    data: listing,
    isLoading,
    isError,
  } = useListing(Number.isFinite(id) ? id : null);
  const { data: reviews } = useReviews(Number.isFinite(id) ? id : null);
  const { data: favorites } = useFavorites(isAuthed);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const [descOpen, setDescOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const [range, setRange] = useState<DateRange>({
    checkIn: null,
    checkOut: null,
  });
  const [guests, setGuests] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState<number | null>(null);

  const photos = useMemo(
    () => (listing ? listingPhotos(listing) : []),
    [listing],
  );
  const photoLabels = useMemo(
    () => photos.map((_, i) => `VIEW ${i + 1}`),
    [photos],
  );

  if (isLoading) return <CenterLoader />;
  if (isError || !listing) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-24">
        <EmptyState
          title="We couldn't find that place."
          body="It may have been removed by the host."
          action={
            <Link
              href="/explore"
              className="rounded-porch bg-ink px-5 py-2.5 text-bg no-underline"
              style={{ font: "600 14px var(--font-sans)" }}
            >
              Back to explore
            </Link>
          }
        />
      </div>
    );
  }

  const isFav = !!favorites?.some((f) => f.id === listing.id);
  const isOwnListing = user?.id === listing.host_id;
  const nights =
    range.checkIn && range.checkOut
      ? nightsBetween(range.checkIn, range.checkOut)
      : 0;
  const total = nights * listing.price_per_night;
  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  const toggleFavorite = () => {
    if (!isAuthed) {
      toast("Sign in to save places", {
        label: "Sign in",
        run: () => router.push("/auth"),
      });
      return;
    }
    if (isFav) {
      removeFavorite.mutate(listing.id);
      toast("Removed from saved");
    } else {
      addFavorite.mutate(listing.id);
      toast("Saved to your list");
    }
  };

  const reserve = () => {
    if (!isAuthed) {
      toast("Sign in to book", {
        label: "Sign in",
        run: () => router.push(`/auth?next=/listings/${listing.id}`),
      });
      return;
    }
    if (!range.checkIn || !range.checkOut) return;
    setDrawerOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-[clamp(14px,3.5vw,32px)] pb-[120px] pt-4">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-[7px] py-1.5 text-ink2 hover:text-ink"
        style={{ font: "500 13px var(--font-sans)" }}
      >
        ← Back
      </button>

      {/* header */}
      <div className="my-2 mb-3.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            style={{
              font: "600 clamp(24px,3.6vw,34px)/1.12 var(--font-sans)",
              letterSpacing: "-0.025em",
            }}
          >
            {listing.title}
          </h1>
          <div className="mono mt-1.5 flex flex-wrap gap-2.5 text-[12.5px] text-ink2">
            <span>{avgRating ? `★ ${avgRating.toFixed(2)}` : "★ New"}</span>
            <span className="text-line">·</span>
            <span>
              {reviews?.length ?? 0}{" "}
              {reviews?.length === 1 ? "review" : "reviews"}
            </span>
            <span className="text-line">·</span>
            <span>
              {listing.city}, {listing.country}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleFavorite}
          className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-ink transition-transform hover:border-ink3 active:scale-95"
          style={{ font: "500 13px var(--font-sans)" }}
        >
          <span style={{ color: isFav ? "var(--accent)" : "var(--ink)" }}>
            {isFav ? "♥" : "♡"}
          </span>
          {isFav ? "Saved" : "Save"}
        </button>
      </div>

      {/* gallery */}
      <div className="relative">
        <div className="grid h-[clamp(260px,40vw,420px)] grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr]">
          <button
            type="button"
            onClick={() => setGalleryStart(0)}
            className="relative overflow-hidden rounded-porch"
          >
            <div
              className="absolute inset-0"
              style={{ background: photos[0]?.background }}
            />
          </button>
          <div className="hidden grid-rows-2 gap-2 sm:grid">
            {[1, 2].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGalleryStart(i % photos.length)}
                className="relative overflow-hidden rounded-porch"
              >
                <div
                  className="absolute inset-0"
                  style={{ background: photos[i % photos.length]?.background }}
                />
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setGalleryStart(0)}
          className="mono absolute bottom-2.5 right-2.5 rounded-porch border border-line bg-surface px-3 py-2 text-[11px] tracking-[0.08em] text-ink shadow-porch transition-transform active:scale-95"
        >
          ALL {photos.length} PHOTOS
        </button>
      </div>

      {/* body */}
      <div className="mt-6 flex flex-wrap items-start gap-[clamp(24px,4vw,52px)]">
        <div className="min-w-[min(100%,320px)] flex-[1_1_540px]">
          {/* host */}
          <div className="flex items-center justify-between gap-3.5 border-b border-line pb-[18px]">
            <div>
              <div style={{ font: "600 17px var(--font-sans)" }}>
                Hosted stay · sleeps {listing.max_guests}
              </div>
              <div
                className="mt-[3px] text-[13px] text-ink3"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {listing.bedrooms}{" "}
                {listing.bedrooms === 1 ? "bedroom" : "bedrooms"} ·{" "}
                {listing.bathrooms} {listing.bathrooms === 1 ? "bath" : "baths"}
              </div>
            </div>
            <div
              className="grid h-11 w-11 flex-none place-items-center rounded-full border border-line bg-surface2 text-ink2"
              style={{ font: "600 16px var(--font-sans)" }}
            >
              ◆
            </div>
          </div>

          {/* description */}
          <div className="border-b border-line py-5">
            <p
              className="m-0 text-ink2"
              style={{
                font: "400 15px/1.65 var(--font-sans)",
                display: descOpen ? "block" : "-webkit-box",
                WebkitLineClamp: descOpen ? "unset" : 4,
                WebkitBoxOrient: "vertical",
                overflow: descOpen ? "visible" : "hidden",
              }}
            >
              {listing.description}
            </p>
            {listing.description.length > 220 && (
              <button
                type="button"
                onClick={() => setDescOpen((o) => !o)}
                className="mt-3 text-ink underline underline-offset-4 hover:text-accent"
                style={{ font: "500 13px var(--font-sans)" }}
              >
                {descOpen ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          {/* amenities */}
          {listing.amenities.length > 0 && (
            <div className="border-b border-line py-5">
              <div className="mono mb-3 text-[10.5px] tracking-[0.18em] text-ink3">
                WHAT&apos;S HERE
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2.5">
                {listing.amenities.map((a) => (
                  <div
                    key={a}
                    className="flex items-baseline gap-2.5 capitalize text-ink2"
                    style={{ font: "400 14px var(--font-sans)" }}
                  >
                    <span className="text-[11px] text-accent">◆</span>
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* reviews */}
          <div className="border-b border-line py-5">
            <div className="mono mb-3.5 text-[10.5px] tracking-[0.18em] text-ink3">
              {reviews && reviews.length > 0
                ? `${avgRating?.toFixed(2)} · ${reviews.length} ${reviews.length === 1 ? "REVIEW" : "REVIEWS"}`
                : "NO REVIEWS YET"}
            </div>
            <div className="grid gap-[18px]">
              {reviews?.map((r) => (
                <div key={r.id} className="grid gap-1.5">
                  <div className="flex items-baseline gap-2.5">
                    <span style={{ font: "600 14px var(--font-sans)" }}>
                      Guest
                    </span>
                    <span className="mono text-[10.5px] text-ink3">
                      {formatShortDate(r.created_at.slice(0, 10))}
                    </span>
                    <span className="mono text-[11px] text-accent">
                      {"★".repeat(r.rating)}
                    </span>
                  </div>
                  <p
                    className="m-0 max-w-[560px] text-ink2"
                    style={{ font: "400 14px/1.55 var(--font-sans)" }}
                  >
                    {r.comment}
                  </p>
                </div>
              ))}
              {reviews?.length === 0 && (
                <p
                  className="m-0 text-ink3"
                  style={{ font: "400 14px var(--font-sans)" }}
                >
                  Be the first to stay and review.
                </p>
              )}
            </div>
          </div>

          {/* location */}
          <div className="py-5">
            <div className="mono mb-3 text-[10.5px] tracking-[0.18em] text-ink3">
              WHERE YOU&apos;LL BE
            </div>
            <MapView listings={[listing]} compact />
          </div>
        </div>

        {/* booking widget */}
        <div className="sticky top-[76px] min-w-[min(100%,300px)] max-w-[420px] flex-[1_1_340px]">
          <div className="rounded-porch border border-line bg-surface p-[18px] shadow-porch">
            <div className="flex items-baseline justify-between">
              <div>
                <span style={{ font: "600 22px var(--font-sans)" }}>
                  {formatPrice(listing.price_per_night)}
                </span>{" "}
                <span className="mono text-[11.5px] text-ink3">/ NIGHT</span>
              </div>
              <div className="mono text-[11px] text-ink2">
                {avgRating ? `★ ${avgRating.toFixed(1)}` : "★ New"}
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2">
              <DateBox
                label="CHECK-IN"
                value={
                  range.checkIn ? formatShortDate(range.checkIn) : "Add date"
                }
              />
              <DateBox
                label="CHECKOUT"
                value={
                  range.checkOut ? formatShortDate(range.checkOut) : "Add date"
                }
              />
            </div>

            <div className="mt-3.5">
              <Calendar
                monthDate={month}
                onMonthChange={setMonth}
                range={range}
                onPickDay={(iso) => setRange((r) => pickDate(r, iso))}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="mono text-[10px] text-ink3">
                  FREE CANCELLATION · 48H
                </span>
                <button
                  type="button"
                  onClick={() => setRange({ checkIn: null, checkOut: null })}
                  className="mono cursor-pointer text-[11px] text-ink3 underline underline-offset-[3px] hover:text-ink"
                >
                  Clear dates
                </button>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between border-t border-line pt-3.5">
              <div>
                <div style={{ font: "500 14px var(--font-sans)" }}>Guests</div>
                <div className="mono text-[10.5px] text-ink3">
                  MAX {listing.max_guests}
                </div>
              </div>
              <Stepper
                value={guests}
                min={1}
                max={listing.max_guests}
                onChange={setGuests}
              />
            </div>

            {nights > 0 && (
              <div className="animate-rise mt-3.5 grid gap-2 border-t border-line pt-3.5">
                <div
                  className="flex justify-between text-ink2"
                  style={{ font: "400 13.5px var(--font-sans)" }}
                >
                  <span>
                    {formatPrice(listing.price_per_night)} × {nights}{" "}
                    {nights === 1 ? "night" : "nights"}
                  </span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div
                  className="flex justify-between border-t border-line pt-2"
                  style={{ font: "600 15px var(--font-sans)" }}
                >
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            )}

            {isOwnListing ? (
              <Link
                href="/host"
                className="mt-3.5 block rounded-porch border border-line px-5 py-3.5 text-center text-ink2 no-underline"
                style={{ font: "500 14px var(--font-sans)" }}
              >
                This is your listing → manage
              </Link>
            ) : (
              <button
                type="button"
                onClick={reserve}
                disabled={!range.checkIn || !range.checkOut}
                className="mt-3.5 w-full rounded-porch bg-ink px-5 py-3.5 text-bg transition-transform active:scale-[0.98] disabled:opacity-45"
                style={{ font: "600 15px var(--font-sans)" }}
              >
                {range.checkIn && range.checkOut
                  ? `Reserve · ${formatPrice(total)}`
                  : "Select dates"}
              </button>
            )}
          </div>
        </div>
      </div>

      {galleryStart !== null && (
        <GalleryOverlay
          photos={photos}
          startIndex={galleryStart}
          labels={photoLabels}
          onClose={() => setGalleryStart(null)}
        />
      )}

      {drawerOpen && range.checkIn && range.checkOut && (
        <BookingDrawer
          listing={listing}
          checkIn={range.checkIn}
          checkOut={range.checkOut}
          guests={guests}
          onClose={() => {
            setDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function DateBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-porch border border-line px-[11px] py-2">
      <div className="mono text-[8.5px] tracking-[0.12em] text-ink3">
        {label}
      </div>
      <div className="mt-0.5" style={{ font: "500 13.5px var(--font-sans)" }}>
        {value}
      </div>
    </div>
  );
}
