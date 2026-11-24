/**
 * Recurring-stream detection: finds paychecks, bills and subscriptions by
 * looking for the same payee at a steady interval. Pure and deterministic,
 * so widgets and insights can share it.
 */
import type { FinanceData, Transaction } from "./types";
import { INCOME_CATEGORY, TRANSFER_CATEGORY } from "./types";
import { addDays, parseISO, toISO } from "./dates";

export type Frequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

export interface RecurringStream {
  key: string;
  name: string;
  direction: "in" | "out";
  frequency: Frequency;
  /** Typical amount (positive). */
  amount: number;
  /** Most recent amount (positive). */
  lastAmount: number;
  /** Amount before the most recent one (positive), when there is one. */
  previousAmount: number | null;
  lastDate: string;
  /** Expected date of the next charge or deposit. */
  nextDate: string;
  category: string;
  accountId: string;
  occurrences: Transaction[];
}

const BANDS: { f: Frequency; min: number; max: number; minCount: number; days: number }[] = [
  { f: "weekly", min: 5, max: 9, minCount: 4, days: 7 },
  { f: "biweekly", min: 12, max: 17, minCount: 3, days: 14 },
  { f: "monthly", min: 26, max: 35, minCount: 3, days: 30.44 },
  { f: "quarterly", min: 85, max: 97, minCount: 2, days: 91 },
  { f: "yearly", min: 350, max: 380, minCount: 2, days: 365 },
];

/** Payee key: lower-case, no store numbers or reference codes. */
export function payeeKey(description: string): string {
  return description
    .toLowerCase()
    .replace(/#\s*\d+/g, "")
    .replace(/\b[a-z]*\d{3,}[a-z0-9]*\b/g, "")
    .replace(/[^a-z& ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const dayDiff = (a: string, b: string) => Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);

function nextAfter(last: string, f: Frequency): string {
  const d = parseISO(last);
  switch (f) {
    case "weekly":
      return toISO(addDays(d, 7));
    case "biweekly":
      return toISO(addDays(d, 14));
    case "monthly":
      return toISO(new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()));
    case "quarterly":
      return toISO(new Date(d.getFullYear(), d.getMonth() + 3, d.getDate()));
    case "yearly":
      return toISO(new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()));
  }
}

/** Monthly-equivalent of a stream's amount (yearly ÷ 12, weekly × 52 ÷ 12, …). */
export function monthlyEquivalent(s: Pick<RecurringStream, "amount" | "frequency">): number {
  const per = { weekly: 52 / 12, biweekly: 26 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 }[s.frequency];
  return s.amount * per;
}

export function detectRecurring(data: FinanceData, today = new Date()): RecurringStream[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of data.transactions) {
    if (t.category === TRANSFER_CATEGORY) continue;
    const dir = t.amount < 0 ? "out" : "in";
    if (dir === "in" && t.category !== INCOME_CATEGORY) continue;
    const key = `${dir}|${payeeKey(t.description)}`;
    if (key.endsWith("|")) continue;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  const todayIso = toISO(today);
  const out: RecurringStream[] = [];
  for (const [key, txs] of groups) {
    const sorted = [...txs].sort((a, b) => (a.date < b.date ? -1 : 1));
    // Collapse same-day duplicates (e.g. split payments).
    const dates = [...new Set(sorted.map((t) => t.date))];
    if (dates.length < 2) continue;
    const gaps = dates.slice(1).map((d, i) => dayDiff(dates[i], d));
    const g = median(gaps);
    const band = BANDS.find((b) => g >= b.min && g <= b.max);
    if (!band || dates.length < band.minCount) continue;
    // Most intervals must sit inside the band.
    const steady = gaps.filter((x) => x >= band.min && x <= band.max).length;
    if (steady / gaps.length < 0.7) continue;
    const amounts = sorted.map((t) => Math.abs(t.amount));
    const typical = median(amounts);
    // Bills and subscriptions keep a steady price; paychecks may vary more.
    const tolerance = key.startsWith("out") ? 0.3 : 0.5;
    if (amounts.filter((a) => Math.abs(a - typical) <= typical * tolerance).length / amounts.length < 0.7) continue;
    const last = sorted[sorted.length - 1];
    // Drop streams that have stopped (missed more than ~2 cycles).
    if (dayDiff(last.date, todayIso) > band.days * 2 + 7) continue;
    out.push({
      key,
      name: last.description,
      direction: key.startsWith("out") ? "out" : "in",
      frequency: band.f,
      amount: Math.round(typical * 100) / 100,
      lastAmount: Math.abs(last.amount),
      previousAmount: sorted.length > 1 ? Math.abs(sorted[sorted.length - 2].amount) : null,
      lastDate: last.date,
      nextDate: nextAfter(last.date, band.f),
      category: last.category,
      accountId: last.accountId,
      occurrences: sorted,
    });
  }
  return out.sort((a, b) => (a.nextDate < b.nextDate ? -1 : 1));
}

/** Categories treated as "bills" rather than subscriptions. */
export const BILL_CATEGORIES = new Set(["Loan payments", "Rent and utilities"]);

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};
