"use client";

import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { RequireAuth } from "@/components/RequireAuth";
import { CenterLoader, EmptyState } from "@/components/ui";
import { useFavorites } from "@/lib/hooks";

function FavoritesInner() {
  const { data: favorites, isLoading } = useFavorites();

  if (isLoading) return <CenterLoader />;

  return (
    <div className="mx-auto w-full max-w-[1360px] px-[clamp(14px,3.5vw,32px)] pb-20 pt-7">
      <h1
        className="mb-1"
        style={{
          font: "600 clamp(26px,4vw,36px)/1.1 var(--font-sans)",
          letterSpacing: "-0.03em",
        }}
      >
        Saved
      </h1>
      <div
        className="mb-6 text-[14px] text-ink2"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        The places you keep coming back to.
      </div>

      {(favorites?.length ?? 0) === 0 ? (
        <EmptyState
          title="Nothing saved yet."
          body="Tap the heart on any place to keep it here."
          action={
            <Link
              href="/explore"
              className="rounded-porch bg-ink px-5 py-2.5 text-bg no-underline transition-transform active:scale-[0.97]"
              style={{ font: "600 14px var(--font-sans)" }}
            >
              Browse stays →
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(250px,100%),1fr))] gap-[18px]">
          {favorites?.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <FavoritesInner />
    </RequireAuth>
  );
}
