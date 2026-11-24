/**
 * Pure functions that turn raw data into what widgets display.
 * Put shared calculations here so custom widgets can reuse them.
 */
import type { Account, FinanceData, Transaction } from "./types";
import { INCOME_CATEGORY, LIABILITY_TYPES, TRANSFER_CATEGORY } from "./types";
import { addDays, lastMonthKeys, monthKey, parseISO, toISO, type Period } from "./dates";

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

export function totals(accounts: Account[]) {
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    if (LIABILITY_TYPES.includes(a.type)) liabilities += -a.balance;
    else assets += a.balance;
  }
  return { assets, liabilities, netWorth: assets - liabilities };
}

/**
 * Net worth at the end of each of the last `months` months, reconstructed by
 * walking back from today's balances through the transaction history.
 */
export function netWorthHistory(data: FinanceData, months = 12) {
  const keys = lastMonthKeys(months);
  const current = totals(data.accounts).netWorth;
  // Sum of transaction amounts per month, across all accounts.
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
  for (const t of cashFlowTransactions(data)) {
    if (!inPeriod(t, p) || !isSpending(t)) continue;
    map.set(t.category, (map.get(t.category) ?? 0) - t.amount);
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .filter((r) => r.amount > 0.005)
    .sort((a, b) => b.amount - a.amount);
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

export function topMerchants(data: FinanceData, p: Period, limit = 5) {
  const map = new Map<string, { name: string; amount: number; count: number }>();
  for (const t of cashFlowTransactions(data)) {
    if (!inPeriod(t, p) || !isSpending(t) || t.amount >= 0) continue;
    const key = t.description.trim().toLowerCase();
    const row = map.get(key) ?? { name: t.description, amount: 0, count: 0 };
    row.amount -= t.amount;
    row.count++;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount).slice(0, limit);
}

/**
 * Recurring charges: same merchant, charged in at least 3 of the last 4
 * months, with amounts within 10% of each other.
 */
export function recurringCharges(data: FinanceData) {
  const recent = new Set(lastMonthKeys(4));
  const groups = new Map<string, Transaction[]>();
  for (const t of data.transactions) {
    if (t.amount >= 0 || isTransfer(t) || !recent.has(monthKey(t.date))) continue;
    const key = t.description.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  const out: { name: string; amount: number; lastDate: string; nextDate: string; category: string }[] = [];
  for (const txs of groups.values()) {
    const months = new Set(txs.map((t) => monthKey(t.date)));
    if (months.size < 3 || txs.length > months.size + 1) continue;
    const amounts = txs.map((t) => -t.amount);
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    if (amounts.some((a) => Math.abs(a - avg) > avg * 0.1)) continue;
    const last = txs.reduce((m, t) => (t.date > m.date ? t : m));
    const d = parseISO(last.date);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
    out.push({ name: last.description, amount: -last.amount, lastDate: last.date, nextDate: toISO(next), category: last.category });
  }
  return out.sort((a, b) => b.amount - a.amount);
}

export function budgetProgress(data: FinanceData, p: Period) {
  const spent = new Map(spendingByCategory(data, p).map((r) => [r.category, r.amount]));
  return data.budgets.map((b) => ({ ...b, spent: spent.get(b.category) ?? 0 }));
}
