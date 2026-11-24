/** Small date helpers that work on ISO YYYY-MM-DD strings in local time. */

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISO(new Date());
}

/** "2026-11" for a date string. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), 28));
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Last `n` month keys ending with the current month, oldest first. */
export function lastMonthKeys(n: number, ref = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(monthKey(toISO(addMonths(startOfMonth(ref), -i))));
  }
  return keys;
}

export function monthLabel(key: string, style: "short" | "long" = "short"): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: style, year: style === "long" ? "numeric" : undefined });
}

export function formatDate(iso: string): string {
  return parseISO(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export interface Period {
  id: PeriodId;
  label: string;
  start: string;
  end: string;
}

export type PeriodId = "this-month" | "last-month" | "3m" | "12m";

export const PERIOD_OPTIONS: { id: PeriodId; label: string }[] = [
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "3m", label: "Last 3 months" },
  { id: "12m", label: "Last 12 months" },
];

export function resolvePeriod(id: PeriodId, ref = new Date()): Period {
  const label = PERIOD_OPTIONS.find((p) => p.id === id)!.label;
  switch (id) {
    case "this-month":
      return { id, label, start: toISO(startOfMonth(ref)), end: toISO(ref) };
    case "last-month": {
      const s = addMonths(startOfMonth(ref), -1);
      return { id, label, start: toISO(s), end: toISO(endOfMonth(s)) };
    }
    case "3m":
      return { id, label, start: toISO(addMonths(startOfMonth(ref), -2)), end: toISO(ref) };
    case "12m":
      return { id, label, start: toISO(addMonths(startOfMonth(ref), -11)), end: toISO(ref) };
  }
}
