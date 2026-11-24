import type { Account, Budget, FinanceData, Transaction } from "./types";
import { addMonths, startOfMonth, toISO } from "./dates";

/** Deterministic PRNG so the sample dataset is stable between reloads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OPENING: Record<string, number> = {
  checking: 1800,
  savings: 6500,
  credit: -600,
  brokerage: 7400,
  crypto: 1200,
  retirement: 38000,
  auto: -16800,
};

const ACCOUNTS: Omit<Account, "balance" | "source">[] = [
  { id: "checking", name: "Everyday Checking", institution: "Sample Bank", type: "checking", mask: "5588" },
  { id: "savings", name: "High-Yield Savings", institution: "Sample Bank", type: "savings", mask: "0713" },
  { id: "credit", name: "Rewards Card", institution: "Sample Card Co.", type: "credit", mask: "1009" },
  { id: "brokerage", name: "Individual Brokerage", institution: "Sample Invest", type: "investment", mask: "7333" },
  { id: "crypto", name: "Crypto", institution: "Sample Invest", type: "crypto", mask: "4640" },
  { id: "retirement", name: "401(k)", institution: "Sample Retirement", type: "retirement", mask: "2210" },
  { id: "auto", name: "Auto Loan", institution: "Sample Auto Finance", type: "loan", mask: "8812" },
];

export const SAMPLE_BUDGETS: Budget[] = [
  { category: "All spending", limit: 4000 },
  { category: "Food and drink", limit: 600 },
  { category: "Shopping", limit: 350 },
  { category: "Entertainment", limit: 80 },
  { category: "Transportation", limit: 200 },
];

export function generateSampleData(ref = new Date()): FinanceData {
  const rand = mulberry32(42);
  const between = (a: number, b: number) => Math.round((a + rand() * (b - a)) * 100) / 100;
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const txs: Transaction[] = [];
  let n = 0;
  const today = toISO(ref);
  const add = (date: Date, description: string, amount: number, category: string, accountId: string, pending = false) => {
    const iso = toISO(date);
    if (iso > today) return;
    txs.push({ id: `sample-${++n}`, date: iso, description, amount, category, accountId: `sample-${accountId}`, source: "sample", pending });
  };

  const first = addMonths(startOfMonth(ref), -12);
  for (let m = 0; m <= 12; m++) {
    const mo = addMonths(first, m);
    const last = m === 12;
    const day = (d: number) => new Date(mo.getFullYear(), mo.getMonth(), Math.min(d, 28));

    // Income: two paychecks; the most recent one a little lower than usual.
    add(day(1), "Acme Corp Payroll", 2300, "Income", "checking");
    add(day(15), "Acme Corp Payroll", last ? 2148.48 : 2300, "Income", "checking");
    add(day(15), "401(k) contribution", 450, "Transfer", "retirement");
    // A side client that pays monthly — skips the current month to show the "no deposit yet" insight.
    if (!last) add(day(5), "Northwind Consulting", 850, "Income", "checking");
    add(day(28), "Interest", between(18, 26), "Income", "savings");
    add(day(28), "Market change", between(-250, 450), "Income", "brokerage");
    add(day(28), "Market change", between(-200, 260), "Income", "crypto");
    add(day(28), "Market change", between(-400, 900), "Income", "retirement");

    // Bills
    add(day(1), "Maple Apartments", -1650, "Rent and utilities", "checking");
    add(day(6), "City Power & Light", -between(60, 130), "Rent and utilities", "checking");
    add(day(9), "Fiber Internet", -65, "Rent and utilities", "credit");
    add(day(26), "Auto Finance Co.", -412.5, "Loan payments", "checking");
    add(day(26), "Loan principal", 340, "Transfer", "auto");
    // Insurance is due on the 21st; this month it hasn't posted yet.
    if (!last) add(day(21), "SafeDrive Insurance", -138.4, "Insurance", "credit");

    // Subscriptions (one price increase four months ago)
    add(day(3), "StreamFlix", m >= 9 ? -17.99 : -15.49, "Entertainment", "credit");
    add(day(8), "Tunes Unlimited", -10.99, "Entertainment", "credit");
    add(day(12), "Cloud Storage", -2.99, "Other general services", "credit");
    add(day(5), "FitLife Gym", -39, "Personal care", "credit");
    if (m === 0 || m === 12) add(day(17), "Annual Membership Fee", -95, "Bank fees", "credit");

    // Savings & investing
    add(day(2), "Transfer to savings", -300, "Transfer", "checking");
    add(day(2), "Transfer from checking", 300, "Transfer", "savings");
    add(day(16), "Transfer to brokerage", -200, "Transfer", "checking");
    add(day(16), "Transfer from checking", 200, "Transfer", "brokerage");

    // Day-to-day spending on the card
    const spend = (d: number, desc: string, amt: number, cat: string) => add(day(d), desc, -amt, cat, "credit");
    for (let w = 0; w < 4; w++) spend(2 + w * 7, pick(["FreshMart", "Green Grocer", "Corner Market"]), between(55, 120), "Food and drink");
    const dining = 6 + Math.floor(rand() * 6);
    for (let i = 0; i < dining; i++)
      spend(1 + Math.floor(rand() * 28), pick(["Noodle House", "Taqueria Sol", "Bean There Coffee", "Pizza Palace", "Sushi Go"]), between(8, 55), "Food and drink");
    for (let i = 0; i < 3; i++) spend(4 + i * 9, pick(["QuickFuel", "Metro Transit", "RideShare"]), between(25, 60), "Transportation");
    const shops = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < shops; i++)
      spend(1 + Math.floor(rand() * 28), pick(["MegaMart", "Online Store", "Home Goods Co.", "Book Nook"]), between(18, 140), "Shopping");
    if (rand() > 0.5) spend(Math.ceil(rand() * 27), pick(["Cinema 8", "Concert Hall"]), between(20, 80), "Entertainment");
    if (rand() > 0.7) spend(Math.ceil(rand() * 27), "City Pharmacy", between(12, 60), "Medical");
    if (m === 5 || m === 10) spend(18, pick(["SkyHigh Airlines", "Seaside Hotel"]), between(350, 900), "Travel");

    // Pay off the card balance on the 28th.
    const mk = toISO(day(1)).slice(0, 7);
    const charged = txs.filter((t) => t.accountId === "sample-credit" && t.date.startsWith(mk)).reduce((s, t) => s - t.amount, 0);
    add(day(28), "Rewards Card Payment", -Math.round(charged * 100) / 100, "Transfer", "checking");
    add(day(28), "Payment received", Math.round(charged * 100) / 100, "Transfer", "credit");
  }

  // Yesterday: a few purchases, two still pending.
  const y = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 1);
  add(y, "Green Grocer", -22.53, "Food and drink", "credit", true);
  add(y, "MegaMart", -64.1, "Shopping", "credit", true);
  add(y, "Bean There Coffee", -6.75, "Food and drink", "credit");

  txs.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const accounts: Account[] = ACCOUNTS.map((a) => ({
    ...a,
    id: `sample-${a.id}`,
    source: "sample",
    balance: Math.round((OPENING[a.id] + txs.filter((t) => t.accountId === `sample-${a.id}`).reduce((s, t) => s + t.amount, 0)) * 100) / 100,
  }));

  return { accounts, transactions: txs, budgets: SAMPLE_BUDGETS };
}
