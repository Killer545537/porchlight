"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import { SearchWidget } from "@/components/SearchWidget";
import { Kicker } from "@/components/ui";
import { useListings } from "@/lib/hooks";
import { gradientFor } from "@/lib/photo";
import {
  citiesFrom,
  emptySearch,
  type SearchState,
  searchToParams,
} from "@/lib/search";

export default function LandingPage() {
  const router = useRouter();
  const { data: listings } = useListings({ limit: 100 });
  const [search, setSearch] = useState<SearchState>(emptySearch);

  const cities = citiesFrom(listings);
  const featured = (listings ?? []).slice(0, 3);

  // Cities become the "pick a direction" tiles, each with a real count.
  const cityCounts = (listings ?? []).reduce<Record<string, number>>(
    (acc, l) => {
      acc[l.city] = (acc[l.city] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const directions = Object.entries(cityCounts).slice(0, 4);

  const runSearch = () => {
    const params = searchToParams(search);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <div>
      {/* ---------------------------------- hero -------------------------------- */}
      <section className="relative grid content-center justify-items-center overflow-hidden px-[clamp(16px,4vw,32px)] py-[clamp(46px,8vh,90px)] pb-[clamp(64px,10vh,120px)] text-center [min-height:min(720px,86vh)]">
        <div
          className="pointer-events-none absolute -inset-x-[10%] -inset-y-[20%]"
          style={{
            background:
              "radial-gradient(46% 34% at 50% 14%, var(--accent-soft), transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(62% 58% at 50% 42%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(62% 58% at 50% 42%, black, transparent)",
          }}
        />
        <div className="relative z-[1] grid w-[min(920px,100%)] justify-items-center gap-5">
          <Kicker>A SMALL COLLECTION OF GOOD PLACES</Kicker>
          <h1
            className="m-0"
            style={{
              font: "600 clamp(40px,7vw,74px)/1.03 var(--font-sans)",
              letterSpacing: "-0.035em",
            }}
          >
            Somewhere worth
            <br />
            the drive.
          </h1>
          <p
            className="m-0 max-w-[520px] text-ink2"
            style={{ font: "400 clamp(15px,1.6vw,17px)/1.55 var(--font-sans)" }}
          >
            Coast houses, cabins, lofts and stranger stays — hand-picked,
            honestly priced. Pick your dates, book in a minute.
          </p>
          <div className="mt-3 w-[min(840px,100%)]">
            <SearchWidget
              value={search}
              onChange={setSearch}
              cities={cities}
              onSubmit={runSearch}
            />
          </div>
        </div>
      </section>

      {/* ------------------------------- featured ------------------------------- */}
      <section className="mx-auto max-w-[1360px] px-[clamp(16px,4vw,32px)] py-[clamp(36px,6vw,72px)]">
        <div className="mb-[22px] flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <Kicker>WORTH A DETOUR</Kicker>
            <h2
              className="mt-1.5"
              style={{
                font: "600 clamp(24px,3.4vw,36px)/1.12 var(--font-sans)",
                letterSpacing: "-0.025em",
              }}
            >
              Stays we keep coming back to
            </h2>
          </div>
          <Link
            href="/explore"
            className="text-ink2 no-underline hover:text-accent"
            style={{ font: "500 14px var(--font-sans)" }}
          >
            See all →
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-5">
          {featured.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* ------------------------------ directions ------------------------------ */}
      {directions.length > 0 && (
        <section className="mx-auto max-w-[1360px] px-[clamp(16px,4vw,32px)] pb-[clamp(36px,6vw,72px)]">
          <Kicker>WHERE TO?</Kicker>
          <h2
            className="mb-[22px] mt-1.5"
            style={{
              font: "600 clamp(24px,3.4vw,36px)/1.12 var(--font-sans)",
              letterSpacing: "-0.025em",
            }}
          >
            Pick a direction
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-4">
            {directions.map(([city, count]) => (
              <Link
                key={city}
                href={`/explore?city=${encodeURIComponent(city)}`}
                className="relative aspect-[5/4] overflow-hidden rounded-porch border border-line no-underline transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px] hover:shadow-porch"
              >
                <div
                  className="absolute inset-0"
                  style={{ background: gradientFor(city) }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, var(--surface) 4%, transparent 52%)",
                  }}
                />
                <div className="absolute bottom-3 left-3.5">
                  <div
                    className="text-ink"
                    style={{
                      font: "600 17px var(--font-sans)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {city}
                  </div>
                  <div className="mono mt-0.5 text-[10px] tracking-[0.1em] text-ink3">
                    {count} {count === 1 ? "STAY" : "STAYS"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------ value props ----------------------------- */}
      <section className="mx-auto max-w-[1360px] px-[clamp(16px,4vw,32px)] pb-[clamp(36px,6vw,72px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-5">
          {[
            {
              n: "01",
              h: "Every host, met in person",
              p: "Nobody lists here we haven't visited. If the photos oversell it, we don't list it.",
            },
            {
              n: "02",
              h: "48 hours to change your mind",
              p: "Every booking cancels free for two days. Plans move; your money shouldn't be stuck.",
            },
            {
              n: "03",
              h: "A person answers",
              p: "Something wrong at 11pm? You get a human on the line, not a ticket number.",
            },
          ].map((item) => (
            <div key={item.n} className="border-t-2 border-ink pt-4">
              <div className="mono text-[11px] text-ink3">{item.n}</div>
              <h3
                className="mb-1.5 mt-2"
                style={{ font: "600 17px var(--font-sans)" }}
              >
                {item.h}
              </h3>
              <p
                className="m-0 text-ink2"
                style={{ font: "400 14px/1.55 var(--font-sans)" }}
              >
                {item.p}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------- CTAs --------------------------------- */}
      <section className="mx-auto max-w-[1360px] px-[clamp(16px,4vw,32px)] pb-[clamp(48px,7vw,84px)]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
          <div className="grid content-start gap-3 rounded-porch bg-ink p-[clamp(26px,4vw,40px)] text-bg">
            <div className="mono text-[10px] tracking-[0.2em] opacity-60">
              GUESTS
            </div>
            <h3
              className="m-0"
              style={{
                font: "600 clamp(22px,2.6vw,30px)/1.15 var(--font-sans)",
                letterSpacing: "-0.02em",
              }}
            >
              Got dates in mind?
            </h3>
            <p
              className="m-0 opacity-75"
              style={{ font: "400 14px/1.55 var(--font-sans)" }}
            >
              A small, hand-picked collection. One of them fits.
            </p>
            <Link
              href="/explore"
              className="mt-1.5 justify-self-start rounded-porch bg-accent px-[22px] py-3 text-on-accent no-underline transition-transform active:scale-[0.97]"
              style={{ font: "600 15px var(--font-sans)" }}
            >
              Start exploring →
            </Link>
          </div>
          <div className="grid content-start gap-3 rounded-porch border border-line bg-surface p-[clamp(26px,4vw,40px)]">
            <div className="mono text-[10px] tracking-[0.2em] text-ink3">
              HOSTS
            </div>
            <h3
              className="m-0"
              style={{
                font: "600 clamp(22px,2.6vw,30px)/1.15 var(--font-sans)",
                letterSpacing: "-0.02em",
              }}
            >
              Have a place with a porch?
            </h3>
            <p
              className="m-0 text-ink2"
              style={{ font: "400 14px/1.55 var(--font-sans)" }}
            >
              List it, set your price, keep your calendar yours.
            </p>
            <Link
              href="/host"
              className="mt-1.5 justify-self-start rounded-porch border border-ink px-[22px] py-3 text-ink no-underline transition-colors hover:bg-surface2"
              style={{ font: "600 15px var(--font-sans)" }}
            >
              Become a host →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
