"use client";

import { type DateRange, isInRange, iso, monthCells } from "@/lib/dateRange";
import { MONTHS_LONG, startOfToday } from "@/lib/format";

const DOW = [
  { key: "sun", label: "S" },
  { key: "mon", label: "M" },
  { key: "tue", label: "T" },
  { key: "wed", label: "W" },
  { key: "thu", label: "T" },
  { key: "fri", label: "F" },
  { key: "sat", label: "S" },
];

interface CalendarProps {
  monthDate: Date;
  onMonthChange: (date: Date) => void;
  range: DateRange;
  onPickDay: (iso: string) => void;
  // ISO dates that are unavailable (rendered struck-out, non-selectable).
  blocked?: Set<string>;
}

export function Calendar({
  monthDate,
  onMonthChange,
  range,
  onPickDay,
  blocked,
}: CalendarProps) {
  const cells = monthCells(monthDate);
  const today = startOfToday().getTime();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            onMonthChange(
              new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1),
            )
          }
          className="grid h-7 w-7 place-items-center rounded-full border border-line text-[14px] text-ink"
        >
          ‹
        </button>
        <div style={{ font: "600 14px var(--font-sans)" }}>
          {MONTHS_LONG[monthDate.getMonth()]} {monthDate.getFullYear()}
        </div>
        <button
          type="button"
          onClick={() =>
            onMonthChange(
              new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1),
            )
          }
          className="grid h-7 w-7 place-items-center rounded-full border border-line text-[14px] text-ink"
        >
          ›
        </button>
      </div>

      <div className="mono mb-1 grid grid-cols-7 gap-0.5 text-center text-[9px] text-ink3">
        {DOW.map((d) => (
          <span key={d.key}>{d.label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map(({ date: cell, key }) => {
          if (!cell) return <span key={key} />;
          const isoStr = iso(cell);
          const isPastDay = cell.getTime() < today;
          const isBlocked = blocked?.has(isoStr) ?? false;
          const disabled = isPastDay || isBlocked;
          const isStart = range.checkIn === isoStr;
          const isEnd = range.checkOut === isoStr;
          const inRange = isInRange(isoStr, range);
          const selected = isStart || isEnd;

          return (
            <button
              key={isoStr}
              type="button"
              disabled={disabled}
              onClick={() => onPickDay(isoStr)}
              className="relative aspect-square rounded-porch text-[12.5px] transition-colors"
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: selected ? 600 : 500,
                cursor: disabled ? "default" : "pointer",
                border: "none",
                color: disabled
                  ? "var(--ink3)"
                  : selected
                    ? "var(--bg)"
                    : "var(--ink)",
                background: selected
                  ? "var(--ink)"
                  : inRange
                    ? "var(--accent-soft)"
                    : "transparent",
                opacity: isPastDay ? 0.35 : 1,
                textDecoration: isBlocked ? "line-through" : "none",
              }}
            >
              {cell.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
