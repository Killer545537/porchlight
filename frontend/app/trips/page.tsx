"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RequireAuth } from "@/components/RequireAuth";
import { useToast } from "@/components/ToastProvider";
import { CenterLoader, EmptyState, Kicker, Spinner } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatDateRange, isPast } from "@/lib/format";
import {
  useCancelBooking,
  useCreateReview,
  useListings,
  useMyTrips,
  useReviews,
} from "@/lib/hooks";
import { coverPhoto } from "@/lib/photo";
import type { Booking, Listing } from "@/lib/types";

function TripsInner() {
  const { data: trips, isLoading } = useMyTrips();
  const { data: listings } = useListings({ limit: 100 });

  const byId = useMemo(() => {
    const map = new Map<number, Listing>();
    for (const l of listings ?? []) map.set(l.id, l);
    return map;
  }, [listings]);

  const { upcoming, past } = useMemo(() => {
    const up: Booking[] = [];
    const pa: Booking[] = [];
    for (const t of trips ?? []) {
      if (isPast(t.check_out)) pa.push(t);
      else up.push(t);
    }
    up.sort((a, b) => a.check_in.localeCompare(b.check_in));
    pa.sort((a, b) => b.check_in.localeCompare(a.check_in));
    return { upcoming: up, past: pa };
  }, [trips]);

  if (isLoading) return <CenterLoader />;

  return (
    <div className="mx-auto w-full max-w-[860px] px-[clamp(14px,3.5vw,32px)] pb-20 pt-7">
      <h1
        className="mb-1"
        style={{
          font: "600 clamp(26px,4vw,36px)/1.1 var(--font-sans)",
          letterSpacing: "-0.03em",
        }}
      >
        Trips
      </h1>
      <div
        className="mb-6 text-[14px] text-ink2"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        Quick reassurance — what&apos;s booked, and when.
      </div>

      {(trips?.length ?? 0) === 0 ? (
        <EmptyState
          title="No trips yet."
          body="Porchlight is better with somewhere to go."
          action={
            <Link
              href="/explore"
              className="rounded-porch bg-accent px-5 py-3 text-on-accent no-underline transition-transform active:scale-[0.97]"
              style={{ font: "600 14px var(--font-sans)" }}
            >
              Start exploring →
            </Link>
          }
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <Kicker>UPCOMING</Kicker>
              <div className="mb-8 mt-3 grid gap-3.5">
                {upcoming.map((t) => (
                  <UpcomingCard
                    key={t.id}
                    booking={t}
                    listing={byId.get(t.listing_id)}
                  />
                ))}
              </div>
            </>
          )}
          {past.length > 0 && (
            <>
              <Kicker>PAST</Kicker>
              <div className="mt-3 grid gap-3.5">
                {past.map((t) => (
                  <PastCard
                    key={t.id}
                    booking={t}
                    listing={byId.get(t.listing_id)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function TripPhoto({ listing }: { listing?: Listing }) {
  return (
    <div className="relative min-h-[112px] flex-[0_0_clamp(96px,18vw,170px)]">
      <div
        className="absolute inset-0"
        style={{
          background: listing
            ? coverPhoto(listing).background
            : "var(--surface2)",
        }}
      />
    </div>
  );
}

function UpcomingCard({
  booking,
  listing,
}: {
  booking: Booking;
  listing?: Listing;
}) {
  const [confirming, setConfirming] = useState(false);
  const cancel = useCancelBooking();
  const { toast } = useToast();

  return (
    <div className="overflow-hidden rounded-porch border border-line bg-surface">
      <div className="flex">
        <TripPhoto listing={listing} />
        <div className="flex flex-1 flex-wrap items-center justify-between gap-2.5 p-4">
          <div className="min-w-0">
            <Link
              href={`/listings/${booking.listing_id}`}
              className="block overflow-hidden text-ellipsis whitespace-nowrap text-ink no-underline hover:text-accent"
              style={{
                font: "600 16px var(--font-sans)",
                letterSpacing: "-0.01em",
              }}
            >
              {listing?.title ?? "Your stay"}
            </Link>
            <div
              className="mt-0.5 text-[13px] text-ink3"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {listing ? `${listing.city}, ${listing.country}` : ""}
            </div>
            <div className="mono mt-1.5 text-[12px] text-ink2">
              {formatDateRange(booking.check_in, booking.check_out)} ·{" "}
              {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
            </div>
            <div className="mono mt-[3px] text-[10px] text-ink3">
              PL-{String(booking.id).padStart(4, "0")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {confirming ? (
              <>
                <span
                  className="text-ink2"
                  style={{ font: "500 12.5px var(--font-sans)" }}
                >
                  Cancel this trip?
                </span>
                <button
                  type="button"
                  onClick={() =>
                    cancel.mutate(booking.id, {
                      onSuccess: () => toast("Booking cancelled"),
                      onError: (e) =>
                        toast(
                          e instanceof ApiError ? e.message : "Couldn't cancel",
                        ),
                    })
                  }
                  disabled={cancel.isPending}
                  className="rounded-porch px-3.5 py-2.5 text-white transition-transform active:scale-95"
                  style={{
                    background: "var(--bad)",
                    font: "600 12.5px var(--font-sans)",
                  }}
                >
                  Cancel booking
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-porch border border-line px-3.5 py-2.5 text-ink"
                  style={{ font: "500 12.5px var(--font-sans)" }}
                >
                  Keep
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="rounded-porch border border-line px-3.5 py-2.5 text-ink2 transition-colors hover:border-ink3 hover:text-ink"
                style={{ font: "500 12.5px var(--font-sans)" }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PastCard({
  booking,
  listing,
}: {
  booking: Booking;
  listing?: Listing;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reviews } = useReviews(booking.listing_id);
  const createReview = useCreateReview();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const alreadyReviewed = !!reviews?.some((r) => r.author_id === user?.id);

  const submit = () => {
    createReview.mutate(
      {
        listingId: booking.listing_id,
        payload: { rating, comment: text.trim() },
      },
      {
        onSuccess: () => {
          toast("Thanks for the review");
          setOpen(false);
        },
        onError: (e) =>
          toast(e instanceof ApiError ? e.message : "Couldn't submit review"),
      },
    );
  };

  return (
    <div className="overflow-hidden rounded-porch border border-line bg-surface">
      <div className="flex">
        <div className="relative min-h-[96px] flex-[0_0_clamp(96px,18vw,170px)] opacity-75">
          <div
            className="absolute inset-0"
            style={{
              background: listing
                ? coverPhoto(listing).background
                : "var(--surface2)",
            }}
          />
        </div>
        <div className="min-w-0 flex-1 p-4">
          <Link
            href={`/listings/${booking.listing_id}`}
            className="block overflow-hidden text-ellipsis whitespace-nowrap text-ink no-underline hover:text-accent"
            style={{ font: "600 16px var(--font-sans)" }}
          >
            {listing?.title ?? "Past stay"}
          </Link>
          <div
            className="mt-0.5 text-[13px] text-ink3"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {listing ? `${listing.city}, ${listing.country}` : ""}
          </div>
          <div className="mono mt-1.5 text-[12px] text-ink2">
            {formatDateRange(booking.check_in, booking.check_out)}
          </div>
        </div>
      </div>

      {alreadyReviewed ? (
        <div
          className="mono border-t border-dashed border-line px-4 py-3 text-[12px]"
          style={{ color: "var(--good)" }}
        >
          ✓ YOU REVIEWED THIS STAY
        </div>
      ) : open ? (
        <div className="animate-rise grid gap-2.5 border-t border-dashed border-line p-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="text-[20px] leading-none transition-transform active:scale-90"
                style={{ color: n <= rating ? "var(--accent)" : "var(--ink3)" }}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="A sentence or two — what should the next guest know?"
            className="min-h-16 resize-y rounded-porch border border-line bg-bg px-3 py-2.5 text-ink outline-none focus:border-ink3"
            style={{ font: "400 13.5px var(--font-sans)" }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={text.trim().length === 0 || createReview.isPending}
              className="flex items-center gap-2 rounded-porch bg-ink px-4 py-2.5 text-bg transition-transform active:scale-95 disabled:opacity-45"
              style={{ font: "600 12.5px var(--font-sans)" }}
            >
              {createReview.isPending && <Spinner size={13} />}
              Submit review
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-porch border border-line px-4 py-2.5 text-ink2"
              style={{ font: "500 12.5px var(--font-sans)" }}
            >
              Not now
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-dashed border-line px-4 py-3">
          <span style={{ font: "500 13.5px var(--font-sans)" }}>
            How was your stay?
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-porch bg-ink px-3.5 py-2.5 text-bg transition-transform active:scale-95"
            style={{ font: "600 12.5px var(--font-sans)" }}
          >
            Leave a review
          </button>
        </div>
      )}
    </div>
  );
}

export default function TripsPage() {
  return (
    <RequireAuth>
      <TripsInner />
    </RequireAuth>
  );
}
