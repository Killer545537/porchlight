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
