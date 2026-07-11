"use client";

import { useState } from "react";
import { pickDate } from "@/lib/dateRange";
import {
  datesLabel,
  destLabel,
  guestsLabel,
  type SearchState,
} from "@/lib/search";
import { Calendar } from "./Calendar";
import { Stepper } from "./ui";

type Segment = "where" | "when" | "who" | null;

interface SearchWidgetProps {
  value: SearchState;
  onChange: (next: SearchState) => void;
  cities: string[];
  onSubmit: () => void;
  submitLabel?: string;
}

export function SearchWidget({
  value,
  onChange,
  cities,
  onSubmit,
  submitLabel = "Search",
}: SearchWidgetProps) {
  const [open, setOpen] = useState<Segment>(null);
  const [month, setMonth] = useState(() => new Date());

  const seg = (key: Exclude<Segment, null>, label: string, sub: string) => (
    <button
      type="button"
      onClick={() => setOpen((o) => (o === key ? null : key))}
      className="relative grid min-w-[130px] flex-1 gap-[3px] rounded-[2px] px-3.5 py-2.5 text-left transition-colors hover:bg-surface2"
      style={{ flexBasis: "160px" }}
    >
      <span className="mono text-[9.5px] tracking-[0.14em] text-ink3">
        {label}
      </span>
      <span
        className="overflow-hidden text-ellipsis whitespace-nowrap text-ink"
        style={{ font: "500 14px var(--font-sans)" }}
      >
        {sub}
      </span>
      {open === key && (
        <span className="absolute bottom-[3px] left-3.5 right-3.5 h-0.5 bg-accent" />
      )}
    </button>
  );

  return (
    <div className="relative w-full text-left">
      <div className="flex flex-wrap gap-0.5 rounded-porch border border-line bg-surface p-1.5 shadow-porch">
        {seg("where", "WHERE", destLabel(value))}
        {seg("when", "WHEN", datesLabel(value))}
        {seg("who", "WHO", guestsLabel(value))}
        <button
          type="button"
          onClick={() => {
            setOpen(null);
            onSubmit();
          }}
          className="flex-none self-stretch rounded-[2px] bg-ink px-[26px] py-3 text-bg transition-transform active:scale-[0.97]"
          style={{ font: "600 15px var(--font-sans)" }}
        >
          {submitLabel}
        </button>
      </div>

      {open && (
        <div className="animate-rise absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-porch border border-line bg-surface p-[18px] shadow-porch">
          {open === "where" && (
            <div className="flex flex-wrap gap-2">
              <Pill
                label="Anywhere"
                active={value.city === null}
                onClick={() => {
                  onChange({ ...value, city: null });
                  setOpen(null);
                }}
              />
              {cities.map((c) => (
                <Pill
                  key={c}
                  label={c}
                  active={value.city === c}
                  onClick={() => {
                    onChange({ ...value, city: c });
                    setOpen(null);
                  }}
                />
              ))}
            </div>
          )}

          {open === "when" && (
            <div className="max-w-[340px]">
              <Calendar
                monthDate={month}
                onMonthChange={setMonth}
                range={{ checkIn: value.checkIn, checkOut: value.checkOut }}
                onPickDay={(iso) => {
                  const next = pickDate(
                    { checkIn: value.checkIn, checkOut: value.checkOut },
                    iso,
                  );
                  onChange({
                    ...value,
                    checkIn: next.checkIn,
                    checkOut: next.checkOut,
                  });
                }}
              />
              <div className="mono mt-2.5 flex items-center justify-between text-[12px] text-ink2">
                <span>{datesLabel(value)}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...value, checkIn: null, checkOut: null })
                  }
                  className="cursor-pointer text-ink3 underline underline-offset-[3px] hover:text-ink"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {open === "who" && (
            <div className="max-w-[320px]">
              <GuestRow
                title="Adults"
                sub="AGE 13+"
                value={value.adults}
                min={1}
                onChange={(adults) => onChange({ ...value, adults })}
              />
              <GuestRow
                title="Children"
                sub="UNDER 13"
                value={value.children}
                min={0}
                onChange={(children) => onChange({ ...value, children })}
                last
              />
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="mt-1.5 rounded-porch bg-ink px-[18px] py-2.5 text-bg transition-transform active:scale-[0.97]"
                style={{ font: "600 13px var(--font-sans)" }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Pill({
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
      type="button"
      onClick={onClick}
      className="rounded-full border px-3.5 py-2 transition-colors"
      style={{
        font: "500 13px var(--font-sans)",
        borderColor: active ? "var(--ink)" : "var(--line)",
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--bg)" : "var(--ink)",
      }}
    >
      {label}
    </button>
  );
}

function GuestRow({
  title,
  sub,
  value,
  min,
  onChange,
  last,
}: {
  title: string;
  sub: string;
  value: number;
  min: number;
  onChange: (n: number) => void;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 ${last ? "" : "border-b border-line"}`}
    >
      <div>
        <div style={{ font: "500 14px var(--font-sans)" }}>{title}</div>
        <div className="mono text-[10.5px] text-ink3">{sub}</div>
      </div>
      <Stepper value={value} min={min} max={16} onChange={onChange} />
    </div>
  );
}
