import { parseISODate, toISODate } from './format';

export interface DateRange {
    checkIn: string | null;
    checkOut: string | null;
}

// Airbnb-style range picking against a single running selection:
//  - no selection or a complete range  -> start a new range at `iso`
//  - a start but no end, `iso` after it -> close the range
//  - a start but `iso` on/before it     -> restart at `iso`
export function pickDate(range: DateRange, iso: string): DateRange {
    const { checkIn, checkOut } = range;
    if (!checkIn || checkOut) {
        return { checkIn: iso, checkOut: null };
    }
    if (parseISODate(iso).getTime() > parseISODate(checkIn).getTime()) {
        return { checkIn, checkOut: iso };
    }
    return { checkIn: iso, checkOut: null };
}

// Expand booking ranges into blocked night ISO strings (check_in inclusive, check_out exclusive).
export function blockedNights(bookings: { check_in: string; check_out: string }[]): Set<string> {
    const blocked = new Set<string>();
    for (const { check_in, check_out } of bookings) {
        let d = parseISODate(check_in);
        const end = parseISODate(check_out);
        while (d.getTime() < end.getTime()) {
            blocked.add(iso(d));
            d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        }
    }
    return blocked;
}

function rangeHasBlockedNight(checkIn: string, checkOut: string, blocked: Set<string>): boolean {
    let d = parseISODate(checkIn);
    const end = parseISODate(checkOut);
    while (d.getTime() < end.getTime()) {
        if (blocked.has(iso(d))) return true;
        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    return false;
}

// Like pickDate, but rejects ranges that span a blocked night.
export function pickDateAvoidingBlocked(
    range: DateRange,
    isoDay: string,
    blocked: Set<string>,
): DateRange {
    if (blocked.has(isoDay)) return range;
    const next = pickDate(range, isoDay);
    if (
        next.checkIn &&
        next.checkOut &&
        rangeHasBlockedNight(next.checkIn, next.checkOut, blocked)
    ) {
        return { checkIn: isoDay, checkOut: null };
    }
    return next;
}

export function isInRange(iso: string, range: DateRange): boolean {
    if (!range.checkIn || !range.checkOut) return false;
    const t = parseISODate(iso).getTime();
    return t > parseISODate(range.checkIn).getTime() && t < parseISODate(range.checkOut).getTime();
}

export interface MonthCell {
    // null for the leading blank pad cells that align day-of-week columns.
    date: Date | null;
    // Stable, index-free React key (an ISO date — real days and pad days alike).
    key: string;
}

// Build the month grid, padded with leading blanks so the day-of-week columns
// line up. Pad cells borrow the previous month's real dates purely as keys.
export function monthCells(monthDate: Date): MonthCell[] {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = first.getDay();
    const cells: MonthCell[] = [];
    for (let i = lead; i > 0; i--) {
        cells.push({ date: null, key: `pad-${iso(new Date(year, month, 1 - i))}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        cells.push({ date, key: iso(date) });
    }
    return cells;
}

export function addMonths(date: Date, delta: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function iso(date: Date): string {
    return toISODate(date);
}
