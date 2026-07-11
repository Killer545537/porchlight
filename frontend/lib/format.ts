// Small formatting + date helpers shared across the app.

export function formatPrice(amount: number): string {
    return `$${Math.round(amount).toLocaleString('en-US')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MONTHS_LONG = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export { MONTHS_LONG };

// Backend dates are plain YYYY-MM-DD. Parse as *local* to avoid the UTC
// off-by-one you get from `new Date("2026-08-01")`.
export function parseISODate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function toISODate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function formatShortDate(iso: string): string {
    const d = parseISODate(iso);
    return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// "Aug 1 – 5" or "Aug 28 – Sep 2"
export function formatDateRange(startISO: string, endISO: string): string {
    const start = parseISODate(startISO);
    const end = parseISODate(endISO);
    const left = `${MONTHS[start.getMonth()]} ${start.getDate()}`;
    const right =
        start.getMonth() === end.getMonth()
            ? `${end.getDate()}`
            : `${MONTHS[end.getMonth()]} ${end.getDate()}`;
    return `${left} – ${right}`;
}

export function nightsBetween(startISO: string, endISO: string): number {
    const start = parseISODate(startISO);
    const end = parseISODate(endISO);
    const ms = end.getTime() - start.getTime();
    return Math.max(0, Math.round(ms / 86_400_000));
}

export function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

export function isPast(iso: string): boolean {
    return parseISODate(iso).getTime() < startOfToday().getTime();
}

// "★ 4.9" style rating label, or a fallback when there are no reviews.
export function ratingLabel(avg: number | null, count: number): string {
    if (count === 0 || avg === null) return '★ New';
    return `★ ${avg.toFixed(1)}`;
}
