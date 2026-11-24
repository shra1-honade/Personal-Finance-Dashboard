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
  checking: 3200,
  savings: 12500,
  credit: -900,
  brokerage: 31000,
  retirement: 52000,
  auto: -14200,
};

const ACCOUNTS: Omit<Account, "balance" | "source">[] = [
  { id: "checking", name: "Everyday Checking", institution: "Sample Bank", type: "checking" },
  { id: "savings", name: "High-Yield Savings", institution: "Sample Bank", type: "savings" },
  { id: "credit", name: "Rewards Card", institution: "Sample Card Co.", type: "credit" },
  { id: "brokerage", name: "Brokerage", institution: "Sample Invest", type: "investment" },
  { id: "retirement", name: "401(k)", institution: "Sample Invest", type: "retirement" },
  { id: "auto", name: "Auto Loan", institution: "Sample Auto Finance", type: "loan" },
];

export const SAMPLE_BUDGETS: Budget[] = [
  { category: "Groceries", limit: 650 },
  { category: "Dining", limit: 350 },
  { category: "Transportation", limit: 220 },
  { category: "Shopping", limit: 300 },
  { category: "Entertainment", limit: 120 },
  { category: "Subscriptions", limit: 60 },
  { category: "Utilities", limit: 220 },
];

export function generateSampleData(ref = new Date()): FinanceData {
  const rand = mulberry32(42);
  const between = (a: number, b: number) => Math.round((a + rand() * (b - a)) * 100) / 100;
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const txs: Transaction[] = [];
  let n = 0;
  const today = toISO(ref);
  const add = (date: Date, description: string, amount: number, category: string, accountId: string) => {
    const iso = toISO(date);
    if (iso > today) return;
    txs.push({ id: `sample-${++n}`, date: iso, description, amount, category, accountId: `sample-${accountId}`, source: "sample" });
  };

  const first = addMonths(startOfMonth(ref), -12);
  for (let m = 0; m <= 12; m++) {
    const mo = addMonths(first, m);
    const day = (d: number) => new Date(mo.getFullYear(), mo.getMonth(), d);

    // Income
    add(day(1), "Payroll — Acme Corp", 2600, "Income", "checking");
    add(day(15), "Payroll — Acme Corp", 2600, "Income", "checking");
    add(day(15), "401(k) contribution", 600, "Transfer", "retirement");
    if (m % 3 === 2) add(day(20), "Freelance invoice", between(400, 900), "Income", "checking");
    add(day(28), "Interest", between(35, 55), "Income", "savings");
    add(day(28), "Dividends & market change", between(-400, 900), "Income", "brokerage");
    add(day(28), "Market change", between(-500, 1100), "Income", "retirement");

    // Fixed bills
    add(day(1), "Rent — Maple Apartments", -1850, "Housing", "checking");
    add(day(6), "City Power & Light", -between(70, 140), "Utilities", "checking");
    add(day(9), "Fiber Internet", -70, "Utilities", "credit");
    add(day(12), "Mobile Phone", -55, "Utilities", "credit");
    add(day(3), "StreamFlix", -15.99, "Subscriptions", "credit");
    add(day(8), "Tunes Unlimited", -10.99, "Subscriptions", "credit");
    add(day(21), "Cloud Storage", -2.99, "Subscriptions", "credit");
    add(day(5), "FitLife Gym", -39, "Health", "credit");
    add(day(10), "Auto loan payment", -385, "Transfer", "checking");
    add(day(10), "Auto loan payment", 330, "Transfer", "auto");
    add(day(10), "Auto loan interest", -55, "Fees", "auto");

    // Savings & investing
    add(day(2), "Transfer to savings", -500, "Transfer", "checking");
    add(day(2), "Transfer from checking", 500, "Transfer", "savings");
    add(day(16), "Transfer to brokerage", -400, "Transfer", "checking");
    add(day(16), "Transfer from checking", 400, "Transfer", "brokerage");

    // Variable spending on the card
    const spend = (d: number, desc: string, amt: number, cat: string) => {
      if (d > 28) d = 28;
      add(day(d), desc, -amt, cat, "credit");
    };
    for (let w = 0; w < 4; w++) spend(2 + w * 7, pick(["FreshMart", "Green Grocer", "Corner Market"]), between(85, 165), "Groceries");
    const dining = 6 + Math.floor(rand() * 6);
    for (let i = 0; i < dining; i++)
      spend(1 + Math.floor(rand() * 28), pick(["Noodle House", "Taqueria Sol", "Bean There Coffee", "Pizza Palace", "Sushi Go"]), between(8, 70), "Dining");
    for (let i = 0; i < 3; i++) spend(4 + i * 9, pick(["QuickFuel", "Metro Transit", "RideShare"]), between(25, 60), "Transportation");
    const shops = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < shops; i++)
      spend(1 + Math.floor(rand() * 28), pick(["MegaMart", "Online Store", "Home Goods Co.", "Book Nook"]), between(18, 160), "Shopping");
    if (rand() > 0.4) spend(Math.ceil(rand() * 27), pick(["Cinema 8", "Concert Hall", "Game Shop"]), between(20, 95), "Entertainment");
    if (rand() > 0.7) spend(Math.ceil(rand() * 27), "City Pharmacy", between(12, 60), "Health");
    if (rand() > 0.6) spend(Math.ceil(rand() * 27), "Hair Studio", between(30, 70), "Personal care");
    if (m === 5 || m === 10) spend(18, pick(["SkyHigh Airlines", "Seaside Hotel"]), between(350, 900), "Travel");

    // Pay off everything charged to the card this month
    const mk = toISO(day(1)).slice(0, 7);
    const charged = txs.filter((t) => t.accountId === "sample-credit" && t.date.startsWith(mk)).reduce((s, t) => s - t.amount, 0);
    const payDate = day(28);
    add(payDate, "Credit card payment", -Math.round(charged), "Transfer", "checking");
    add(payDate, "Payment received", Math.round(charged), "Transfer", "credit");
  }

  txs.sort((a, b) => (a.date < b.date ? 1 : -1));
  const accounts: Account[] = ACCOUNTS.map((a) => ({
    ...a,
    id: `sample-${a.id}`,
    source: "sample",
    balance: Math.round((OPENING[a.id] + txs.filter((t) => t.accountId === `sample-${a.id}`).reduce((s, t) => s + t.amount, 0)) * 100) / 100,
  }));

  return { accounts, transactions: txs, budgets: SAMPLE_BUDGETS };
}
