"use client";

import { useRef, useState } from "react";
import { ApiError, assetUrl } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import {
  useCreateListing,
  useDeletePhoto,
  useUpdateListing,
  useUploadPhoto,
} from "@/lib/hooks";
import { coverPhoto } from "@/lib/photo";
import type { Listing, ListingCreate } from "@/lib/types";
import { useToast } from "./ToastProvider";
import { Spinner, Stepper } from "./ui";

const AMENITY_OPTIONS = [
  "wifi",
  "kitchen",
  "fireplace",
  "free parking",
  "hot tub",
  "workspace",
  "pets ok",
  "ev charger",
  "ac",
];

interface FormState {
  title: string;
  description: string;
  city: string;
  country: string;
  latitude: string;
  longitude: string;
  price: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: Set<string>;
}

function initialState(listing?: Listing): FormState {
  return {
    title: listing?.title ?? "",
    description: listing?.description ?? "",
    city: listing?.city ?? "",
    country: listing?.country ?? "US",
    latitude: listing ? String(listing.latitude) : "36.9",
    longitude: listing ? String(listing.longitude) : "-121.9",
    price: listing ? String(listing.price_per_night) : "",
    maxGuests: listing?.max_guests ?? 2,
    bedrooms: listing?.bedrooms ?? 1,
    bathrooms: listing?.bathrooms ?? 1,
    amenities: new Set(listing?.amenities ?? []),
  };
}

export function HostListingForm({
  listing,
  onDone,
}: {
  listing?: Listing;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(() => initialState(listing));
  const [error, setError] = useState<string | null>(null);
  const create = useCreateListing();
  const update = useUpdateListing();
  const busy = create.isPending || update.isPending;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const valid =
    form.title.trim().length > 0 &&
    form.description.trim().length > 0 &&
    form.city.trim().length > 0 &&
    form.country.trim().length > 0 &&
    Number(form.price) > 0 &&
    form.latitude !== "" &&
    form.longitude !== "";

  const save = async () => {
    setError(null);
    const payload: ListingCreate = {
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      price_per_night: Number(form.price),
      max_guests: form.maxGuests,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      amenities: Array.from(form.amenities),
    };
    try {
      if (listing) {
        await update.mutateAsync({ id: listing.id, payload });
        toast("Listing updated");
      } else {
        await create.mutateAsync(payload);
        toast("Listing published");
      }
      onDone();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't save the listing.",
      );
    }
  };

  return (
    <div className="animate-rise my-5 mb-6 rounded-porch border border-line bg-surface p-[clamp(16px,3vw,26px)]">
      <div className="mono mb-4 text-[10.5px] tracking-[0.18em] text-ink3">
        {listing ? "EDIT LISTING" : "NEW LISTING"}
      </div>
      <div className="flex flex-wrap gap-[clamp(20px,3vw,36px)]">
        {/* left column: fields */}
        <div className="grid min-w-[min(100%,280px)] flex-[1_1_340px] content-start gap-3.5">
          <Text
            label="TITLE"
            value={form.title}
            onChange={(v) => set("title", v)}
            placeholder="e.g. The Blue Barn"
          />
          <div>
            <Label>DESCRIPTION</Label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What makes this place worth the drive?"
              className="min-h-20 w-full resize-y rounded-porch border border-line bg-bg px-3 py-2.5 text-ink outline-none focus:border-ink3"
              style={{ font: "500 14px var(--font-sans)" }}
            />
          </div>
          <div className="flex flex-wrap gap-3.5">
            <div className="min-w-[130px] flex-1">
              <Text
                label="CITY"
                value={form.city}
                onChange={(v) => set("city", v)}
                placeholder="Big Sur"
              />
            </div>
            <div className="min-w-[90px] flex-1">
              <Text
                label="COUNTRY"
                value={form.country}
                onChange={(v) => set("country", v)}
                placeholder="US"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3.5">
            <div className="min-w-[130px] flex-1">
              <Text
                label="LATITUDE"
                value={form.latitude}
                onChange={(v) => set("latitude", v)}
                placeholder="36.27"
                type="number"
              />
            </div>
            <div className="min-w-[130px] flex-1">
              <Text
                label="LONGITUDE"
                value={form.longitude}
                onChange={(v) => set("longitude", v)}
                placeholder="-121.81"
                type="number"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3.5">
            <div className="min-w-[130px] flex-1">
              <Text
                label="PRICE / NIGHT ($)"
                value={form.price}
                onChange={(v) => set("price", v)}
                placeholder="180"
                type="number"
              />
            </div>
            <NumberStepper
              label="SLEEPS"
              value={form.maxGuests}
              min={1}
              onChange={(v) => set("maxGuests", v)}
            />
          </div>
          <div className="flex flex-wrap gap-3.5">
            <NumberStepper
              label="BEDROOMS"
              value={form.bedrooms}
              min={0}
              onChange={(v) => set("bedrooms", v)}
            />
            <NumberStepper
              label="BATHROOMS"
              value={form.bathrooms}
              min={0}
              onChange={(v) => set("bathrooms", v)}
            />
          </div>
          <div>
            <Label>AMENITIES</Label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => {
                const active = form.amenities.has(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      set(
                        "amenities",
                        (() => {
                          const next = new Set(form.amenities);
                          if (next.has(a)) next.delete(a);
                          else next.add(a);
                          return next;
                        })(),
                      )
                    }
                    className="rounded-full border px-3 py-1.5 capitalize transition-colors"
                    style={{
                      font: "500 12.5px var(--font-sans)",
                      borderColor: active ? "var(--ink)" : "var(--line)",
                      background: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--bg)" : "var(--ink)",
                    }}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              style={{ font: "500 13px var(--font-sans)", color: "var(--bad)" }}
            >
              {error}
            </div>
          )}

          <div className="mt-1 flex gap-2.5">
            <button
              type="button"
              onClick={save}
              disabled={!valid || busy}
              className="flex items-center gap-2 rounded-porch bg-ink px-[18px] py-3 text-bg transition-transform active:scale-[0.98] disabled:opacity-45"
              style={{ font: "600 13px var(--font-sans)" }}
            >
              {busy && <Spinner size={13} />}
              {listing ? "Save changes" : "Publish listing"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="rounded-porch border border-line px-[18px] py-3 text-ink2"
              style={{ font: "500 13px var(--font-sans)" }}
            >
              Discard
            </button>
          </div>
        </div>

        {/* right column: preview + photos (photos only when editing) */}
        <div className="min-w-[min(100%,260px)] flex-[0_1_300px]">
          <Label>GUESTS WILL SEE</Label>
          <div className="max-w-[300px] overflow-hidden rounded-porch border border-line bg-bg">
            <div className="relative aspect-[4/3] overflow-hidden bg-surface2">
              <div
                className="absolute inset-0"
                style={{
                  background: listing
                    ? coverPhoto(listing).background
                    : "linear-gradient(145deg, oklch(0.7 0.11 60), oklch(0.52 0.13 30))",
                }}
              />
            </div>
            <div className="grid gap-[3px] px-3.5 pb-3.5 pt-3">
              <div
                className="overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ font: "600 15px var(--font-sans)" }}
              >
                {form.title || "Your listing title"}
              </div>
              <div
                className="text-[13px] text-ink3"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {form.city || "City"}, {form.country || "Country"}
              </div>
              <div
                className="mt-1"
                style={{ font: "500 14px var(--font-sans)" }}
              >
                {form.price ? formatPrice(Number(form.price)) : "$—"}{" "}
                <span className="mono text-[11.5px] text-ink3">/ NIGHT</span>
              </div>
            </div>
          </div>

          {listing && <PhotoManager listing={listing} />}
        </div>
      </div>
    </div>
  );
}

function PhotoManager({ listing }: { listing: Listing }) {
  const upload = useUploadPhoto();
  const del = useDeletePhoto();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-4">
      <Label>PHOTOS</Label>
      <div className="grid grid-cols-3 gap-2">
        {listing.photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-porch border border-line"
          >
            <div
              className="absolute inset-0"
              style={{
                background: `center / cover no-repeat url("${assetUrl(photo.url)}")`,
              }}
            />
            <button
              type="button"
              aria-label="Remove photo"
              disabled={del.isPending}
              onClick={() =>
                del.mutate(
                  { listingId: listing.id, photoId: photo.id },
                  {
                    onSuccess: () => toast("Photo removed"),
                    onError: (err) =>
                      toast(
                        err instanceof ApiError
                          ? err.message
                          : "Couldn't remove photo",
                      ),
                  },
                )
              }
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-[color-mix(in_oklab,var(--surface)_82%,transparent)] text-[13px] text-ink opacity-0 backdrop-blur-[3px] transition-opacity hover:text-bad group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={upload.isPending}
          className="grid aspect-square place-items-center rounded-porch border border-dashed border-line text-ink3 transition-colors hover:border-ink3 hover:text-ink"
          style={{ font: "500 12px var(--font-sans)" }}
        >
          {upload.isPending ? <Spinner size={14} /> : "+ Add"}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          upload.mutate(
            { listingId: listing.id, file },
            {
              onSuccess: () => toast("Photo added"),
              onError: (err) =>
                toast(err instanceof ApiError ? err.message : "Upload failed"),
            },
          );
          e.target.value = "";
        }}
      />
      <div className="mono mt-1.5 text-[9px] text-ink3">
        JPEG / PNG / WEBP / GIF · 5MB MAX
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mono mb-1.5 text-[9.5px] tracking-[0.14em] text-ink3">
      {children}
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-porch border border-line bg-bg px-3 py-2.5 text-ink outline-none focus:border-ink3"
        style={{ font: "500 14px var(--font-sans)" }}
      />
    </div>
  );
}

function NumberStepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="min-w-[130px] flex-1">
      <Label>{label}</Label>
      <div className="py-1.5">
        <Stepper value={value} min={min} max={30} onChange={onChange} />
      </div>
    </div>
  );
}
