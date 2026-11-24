import Papa from "papaparse";
import { CATEGORIES } from "./types";

export interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface CsvParseResult {
  rows: ParsedRow[];
  skipped: number;
  columns: { date?: string; description?: string; amount?: string; debit?: string; credit?: string; category?: string };
}

const find = (headers: string[], ...names: string[]) =>
  headers.find((h) => names.some((n) => h.trim().toLowerCase() === n)) ??
  headers.find((h) => names.some((n) => h.trim().toLowerCase().includes(n)));

function parseDate(s: string): string | null {
  s = s.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/); // US: MM/DD/YYYY
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function parseAmount(s: string | undefined): number | null {
  if (s == null || s.trim() === "") return null;
  const neg = /^\(.*\)$/.test(s.trim()) || s.includes("-");
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (isNaN(n)) return null;
  return neg ? -n : n;
}

/** Simple keyword rules for files without a category column. Extend as you like. */
const RULES: [RegExp, string][] = [
  [/credit card payment|card pmt|autopay|online pmt|payment thank you|epay/i, "Transfer"],
  [/payroll|salary|direct dep|paycheck|interest paid|dividend/i, "Income"],
  [/transfer|zelle|venmo/i, "Transfer"],
  [/rent|electric|power|water|gas co|utility|internet|comcast|verizon|at&t|t-mobile|phone/i, "Rent and utilities"],
  [/loan|mortgage|financial services/i, "Loan payments"],
  [/insurance|geico|progressive|state farm|allstate/i, "Insurance"],
  [/grocery|groceries|market|whole foods|trader joe|safeway|kroger|aldi|costco|restaurant|cafe|coffee|starbucks|pizza|grill|doordash|uber eats|grubhub|mcdonald/i, "Food and drink"],
  [/uber|lyft|shell|chevron|exxon|fuel|parking|transit|metro/i, "Transportation"],
  [/netflix|spotify|hulu|disney|youtube|cinema|movie|concert/i, "Entertainment"],
  [/amazon|target|walmart|best buy|store/i, "Shopping"],
  [/pharmacy|cvs|walgreens|doctor|dental|clinic/i, "Medical"],
  [/gym|fitness|salon|barber|spa/i, "Personal care"],
  [/airline|hotel|airbnb|expedia/i, "Travel"],
  [/fee\b|overdraft|membership fee/i, "Bank fees"],
];

export function guessCategory(description: string): string {
  for (const [re, cat] of RULES) if (re.test(description)) return cat;
  return "Other"; // unknown credits (e.g. refunds) count as negative spending, not income
}

function normaliseCategory(c: string | undefined): string | null {
  if (!c) return null;
  const hit = CATEGORIES.find((k) => k.toLowerCase() === c.trim().toLowerCase());
  return hit ?? null;
}

/**
 * Parse a bank CSV export. Handles a single signed "Amount" column or
 * separate Debit/Credit columns. `flipSign` is for files (typically credit
 * cards) where purchases are positive numbers.
 */
export function parseCsv(text: string, flipSign = false): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(text.trim(), { header: true, skipEmptyLines: true });
  const headers = parsed.meta.fields ?? [];
  const columns = {
    date: find(headers, "date", "transaction date", "posted date", "posting date"),
    description: find(headers, "description", "name", "payee", "merchant", "memo", "details"),
    amount: find(headers, "amount"),
    debit: find(headers, "debit", "withdrawal", "money out"),
    credit: find(headers, "credit", "deposit", "money in"),
    category: find(headers, "category"),
  };
  const rows: ParsedRow[] = [];
  let skipped = 0;
  for (const r of parsed.data) {
    const date = columns.date ? parseDate(r[columns.date] ?? "") : null;
    let amount: number | null = null;
    if (columns.amount) amount = parseAmount(r[columns.amount]);
    else if (columns.debit || columns.credit) {
      const out = parseAmount(columns.debit ? r[columns.debit] : undefined);
      const inn = parseAmount(columns.credit ? r[columns.credit] : undefined);
      amount = (inn ? Math.abs(inn) : 0) - (out ? Math.abs(out) : 0);
    }
    const description = (columns.description ? r[columns.description] : "")?.trim() || "Unknown";
    if (!date || amount == null || amount === 0) {
      skipped++;
      continue;
    }
    if (flipSign) amount = -amount;
    const category = normaliseCategory(columns.category ? r[columns.category] : undefined) ?? guessCategory(description);
    rows.push({ date, description, amount: Math.round(amount * 100) / 100, category });
  }
  return { rows, skipped, columns };
}
