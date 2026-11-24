/**
 * Pure functions that turn raw data into what widgets display.
 * Put shared calculations here so custom widgets can reuse them.
 */
import type { Account, FinanceData, Transaction } from "./types";
import { ALL_SPENDING, INCOME_CATEGORY, INVESTMENT_TYPES, LIABILITY_TYPES, TRANSFER_CATEGORY } from "./types";
import { addDays, lastMonthKeys, monthKey, parseISO, toISO, type Period } from "./dates";
import { BILL_CATEGORIES, detectRecurring, monthlyEquivalent, type RecurringStream } from "./recurring";

export const isTransfer = (t: Transaction) => t.category === TRANSFER_CATEGORY;
export const isIncome = (t: Transaction) => t.category === INCOME_CATEGORY && t.amount > 0;
/** Spending = money out that isn't a transfer between your own accounts. Refunds reduce it. */
export const isSpending = (t: Transaction) => !isTransfer(t) && t.category !== INCOME_CATEGORY;

/** Investment market moves aren't spending or salary; keep them out of cash flow. */
const CASH_FLOW_TYPES = new Set<Account["type"]>(["checking", "savings", "credit", "cash", "loan"]);

export function cashFlowTransactions(data: FinanceData): Transaction[] {
  const types = new Map(data.accounts.map((a) => [a.id, a.type]));
  return data.transactions.filter((t) => CASH_FLOW_TYPES.has(types.get(t.accountId) ?? "checking"));
}

export function inPeriod(t: Transaction, p: Period) {
  return t.date >= p.start && t.date <= p.end;
}

export function spendingTransactions(data: FinanceData, p: Period, category?: string) {
  return cashFlowTransactions(data).filter((t) => inPeriod(t, p) && isSpending(t) && (!category || t.category === category));
}

export function totalSpending(data: FinanceData, p: Period, category?: string) {
  return -spendingTransactions(data, p, category).reduce((s, t) => s + t.amount, 0);
}

export function totals(accounts: Account[]) {
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    if (LIABILITY_TYPES.includes(a.type)) liabilities += -a.balance;
    else assets += a.balance;
  }
  return { assets, liabilities, netWorth: assets - liabilities };
}

export const investmentAccounts = (data: FinanceData) => data.accounts.filter((a) => INVESTMENT_TYPES.includes(a.type));
export const liabilityAccounts = (data: FinanceData) => data.accounts.filter((a) => LIABILITY_TYPES.includes(a.type));
export const assetAccounts = (data: FinanceData) => data.accounts.filter((a) => !LIABILITY_TYPES.includes(a.type));

/**
 * Net worth at the end of each of the last `months` months, reconstructed by
 * walking back from today's balances through the transaction history.
 */
export function netWorthHistory(data: FinanceData, months = 12) {
  const keys = lastMonthKeys(months);
  const current = totals(data.accounts).netWorth;
  const byMonth = new Map<string, number>();
  for (const t of data.transactions) byMonth.set(monthKey(t.date), (byMonth.get(monthKey(t.date)) ?? 0) + t.amount);
  const out: { month: string; netWorth: number }[] = [];
  let value = current;
  for (let i = keys.length - 1; i >= 0; i--) {
    out.unshift({ month: keys[i], netWorth: value });
    value -= byMonth.get(keys[i]) ?? 0;
  }
  return out;
}

/** Net worth change over the last `days` days. */
export function netWorthChange(data: FinanceData, days = 30) {
  const since = toISO(addDays(new Date(), -days));
  const delta = data.transactions.filter((t) => t.date > since).reduce((s, t) => s + t.amount, 0);
  const now = totals(data.accounts).netWorth;
  const before = now - delta;
  return { delta, pct: before !== 0 ? delta / Math.abs(before) : 0 };
}

export function spendingByCategory(data: FinanceData, p: Period) {
  const map = new Map<string, number>();
  for (const t of spendingTransactions(data, p)) map.set(t.category, (map.get(t.category) ?? 0) - t.amount);
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .filter((r) => r.amount > 0.005)
    .sort((a, b) => b.amount - a.amount);
}

/** Money in, money out and net for a period (transfers excluded). */
export function cashFlow(data: FinanceData, p: Period) {
  let moneyIn = 0;
  let moneyOut = 0;
  for (const t of cashFlowTransactions(data)) {
    if (!inPeriod(t, p) || isTransfer(t)) continue;
    if (isIncome(t)) moneyIn += t.amount;
    else if (isSpending(t)) moneyOut -= t.amount;
  }
  return { moneyIn, moneyOut, net: moneyIn - moneyOut };
}

export function monthlyCashFlow(data: FinanceData, months = 6) {
  const keys = lastMonthKeys(months);
  const rows = new Map(keys.map((k) => [k, { month: k, income: 0, spending: 0 }]));
  for (const t of cashFlowTransactions(data)) {
    const row = rows.get(monthKey(t.date));
    if (!row) continue;
    if (isIncome(t)) row.income += t.amount;
    else if (isSpending(t)) row.spending -= t.amount;
  }
  return [...rows.values()].map((r) => ({ ...r, net: r.income - r.spending }));
}

export function topMerchants(data: FinanceData, p: Period) {
  const map = new Map<string, { name: string; amount: number; count: number }>();
  for (const t of spendingTransactions(data, p)) {
    if (t.amount >= 0) continue;
    const key = t.description.trim().toLowerCase();
    const row = map.get(key) ?? { name: t.description, amount: 0, count: 0 };
    row.amount -= t.amount;
    row.count++;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

/**
 * Same-days comparison: spending from the 1st to today this month vs the
 * same span last month (e.g. Nov 1–24 vs Oct 1–24).
 */
export function monthToDateComparison(data: FinanceData, category?: string, ref = new Date()) {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const prevStart = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
  const prevEnd = new Date(ref.getFullYear(), ref.getMonth() - 1, Math.min(ref.getDate(), new Date(ref.getFullYear(), ref.getMonth(), 0).getDate()));
  const current = totalSpending(data, { id: "this-month", label: "", start: toISO(start), end: toISO(ref) }, category);
  const previous = totalSpending(data, { id: "last-month", label: "", start: toISO(prevStart), end: toISO(prevEnd) }, category);
  return { current, previous, change: previous > 0 ? (current - previous) / previous : null, prevStart: toISO(prevStart), prevEnd: toISO(prevEnd) };
}

/** Cumulative spending by day of month for this month and last month. */
export function cumulativeSpending(data: FinanceData, ref = new Date()) {
  const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const curKey = monthKey(toISO(ref));
  const prevKey = monthKey(toISO(new Date(y, m - 1, 1)));
  const perDay = (key: string) => {
    const arr = new Array(32).fill(0);
    for (const t of cashFlowTransactions(data)) if (monthKey(t.date) === key && isSpending(t)) arr[parseISO(t.date).getDate()] -= t.amount;
    return arr;
  };
  const cur = perDay(curKey);
  const prev = perDay(prevKey);
  const n = daysIn(y, m);
  const prevN = daysIn(y, m - 1);
  const rows: { day: number; thisMonth: number | null; lastMonth: number | null }[] = [];
  let a = 0;
  let b = 0;
  for (let d = 1; d <= n; d++) {
    a += cur[d];
    b += d <= prevN ? prev[d] : 0;
    rows.push({ day: d, thisMonth: d <= ref.getDate() ? Math.round(a * 100) / 100 : null, lastMonth: d <= prevN ? Math.round(b * 100) / 100 : null });
  }
  return rows;
}

export function budgetProgress(data: FinanceData, p: Period) {
  const byCat = new Map(spendingByCategory(data, p).map((r) => [r.category, r.amount]));
  const total = [...byCat.values()].reduce((s, v) => s + v, 0);
  return data.budgets.map((b) => ({ ...b, spent: b.category === ALL_SPENDING ? total : (byCat.get(b.category) ?? 0) }));
}

/* ---------- recurring ---------- */

export function subscriptions(data: FinanceData, today = new Date()) {
  const rows = detectRecurring(data, today).filter((s) => s.direction === "out" && !BILL_CATEGORIES.has(s.category));
  return { rows, monthlyTotal: rows.reduce((s, r) => s + monthlyEquivalent({ amount: r.lastAmount, frequency: r.frequency }), 0) };
}

/** Bills (loans, rent, utilities) due in the next `days` days, plus any that are overdue. */
export function upcomingBills(data: FinanceData, days = 45, today = new Date()) {
  const until = toISO(addDays(today, days));
  const rows = detectRecurring(data, today).filter((s) => s.direction === "out" && BILL_CATEGORIES.has(s.category) && s.nextDate <= until);
  return { rows, total: rows.reduce((s, r) => s + r.amount, 0) };
}

export interface Insight {
  id: string;
  tone: "info" | "warning" | "good";
  text: string;
  detail?: string;
}

/**
 * Rule-based insights, in the spirit of "your paycheck hasn't arrived" or
 * "a bill is late". Add your own rules here.
 */
export function insights(data: FinanceData, today = new Date()): Insight[] {
  const todayIso = toISO(today);
  const out: Insight[] = [];
  const streams = detectRecurring(data, today);
  const fmt = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });
  const dateFmt = (iso: string) => parseISO(iso).toLocaleDateString(undefined, { month: "long", day: "numeric" });
  const thisMonth = monthKey(todayIso);

  for (const s of streams.filter((x) => x.direction === "in")) {
    const monthly = monthlyEquivalent(s);
    // 1. A regular payer hasn't paid this month yet, and it's past their usual day.
    const paidThisMonth = s.occurrences.some((t) => monthKey(t.date) === thisMonth);
    const usualDay = Math.max(...s.occurrences.slice(-3).map((t) => parseISO(t.date).getDate()));
    if (s.frequency === "monthly" && !paidThisMonth && today.getDate() > usualDay + 3) {
      out.push({ id: `missing-${s.key}`, tone: "warning", text: `No deposit yet this month from ${s.name}, which sends you about ${fmt(monthly)} a month.` });
    }
    // 2. The latest deposit differs from the usual amount by 5% or more.
    const prior = s.occurrences.slice(0, -1).map((t) => t.amount);
    if (prior.length >= 2) {
      const usual = [...prior].sort((a, b) => a - b)[Math.floor(prior.length / 2)];
      const diff = (s.lastAmount - usual) / usual;
      if (Math.abs(diff) >= 0.05 && s.lastDate >= toISO(addDays(today, -31))) {
        out.push({
          id: `deposit-${s.key}`,
          tone: diff < 0 ? "warning" : "good",
          text: `A deposit from ${s.name} came to ${fmt(s.lastAmount)}, ${diff > 0 ? "+" : "−"}${Math.round(Math.abs(diff) * 100)}% against your usual ${fmt(usual)}.`,
        });
      }
    }
  }

  for (const s of streams.filter((x) => x.direction === "out")) {
    // 3. An expected charge is a few days late.
    const late = Math.round((today.getTime() - parseISO(s.nextDate).getTime()) / 86400000);
    if (late >= 2 && late <= 20) {
      out.push({ id: `late-${s.key}`, tone: "info", text: `${s.name} is expected around ${dateFmt(s.nextDate)} for about ${fmt(s.amount)} but has not posted yet.` });
    }
    // 4. A subscription changed price in the last ~4 months.
    if (!BILL_CATEGORIES.has(s.category)) {
      const occ = s.occurrences;
      const since = toISO(addDays(today, -120));
      for (let i = occ.length - 1; i > 0 && occ[i].date >= since; i--) {
        const now = Math.abs(occ[i].amount);
        const before = Math.abs(occ[i - 1].amount);
        if (Math.abs(now - before) >= 0.5) {
          out.push({ id: `price-${s.key}`, tone: "info", text: `${s.name} went from ${fmt(before)} to ${fmt(now)} on ${dateFmt(occ[i].date)}.` });
          break;
        }
      }
    }
  }

  // 5. Spending pace vs last month.
  const cmp = monthToDateComparison(data, undefined, today);
  if (cmp.change !== null && Math.abs(cmp.change) >= 0.2) {
    out.push({
      id: "pace",
      tone: cmp.change > 0 ? "warning" : "good",
      text: `You've spent ${fmt(cmp.current)} so far this month, ${Math.round(Math.abs(cmp.change) * 100)}% ${cmp.change > 0 ? "more" : "less"} than by this point last month.`,
    });
  }
  return out;
}

export type { RecurringStream };
