/**
 * Core data model. Everything the dashboard shows is derived from these
 * three collections, so a widget never needs its own storage.
 */

export type AccountType = "checking" | "savings" | "credit" | "investment" | "retirement" | "crypto" | "loan" | "cash";

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  /** Current balance. Liabilities (credit, loan) are stored as negative numbers. */
  balance: number;
  /** Where the account came from. */
  source: DataSource;
  /** Last 4 digits, when known. */
  mask?: string | null;
  /** Plaid item this account belongs to, when linked. */
  itemId?: string | null;
}

export type DataSource = "plaid" | "csv" | "manual" | "sample";

export interface Transaction {
  id: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  description: string;
  /** Positive = money in, negative = money out. */
  amount: number;
  category: string;
  accountId: string;
  pending?: boolean;
  source: DataSource;
}

export interface Budget {
  category: string;
  /** Monthly limit, positive number. */
  limit: number;
}

export interface FinanceData {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
}

/** A linked institution (Plaid "Item"). The access token never leaves the server. */
export interface LinkedInstitution {
  itemId: string;
  institutionName: string;
  lastSyncedAt: string | null;
  error: string | null;
}

export interface DashboardPayload extends FinanceData {
  institutions: LinkedInstitution[];
  plaidConfigured: boolean;
  plaidEnv: string | null;
}

export const LIABILITY_TYPES: AccountType[] = ["credit", "loan"];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit cards",
  investment: "Brokerage",
  retirement: "Retirement",
  crypto: "Crypto",
  loan: "Loans",
  cash: "Cash",
};

/** Categories that move money between your own accounts (incl. credit card payments). Excluded from income and spending. */
export const TRANSFER_CATEGORY = "Transfer";
export const INCOME_CATEGORY = "Income";
/** Budget row that limits total monthly spending. */
export const ALL_SPENDING = "All spending";

/**
 * Category names follow Plaid's personal finance categories, so linked
 * accounts need no translation. See src/server/plaid-categories.ts.
 */
export const CATEGORIES = [
  INCOME_CATEGORY,
  "Food and drink",
  "Shopping",
  "Rent and utilities",
  "Loan payments",
  "Insurance",
  "Transportation",
  "Travel",
  "Entertainment",
  "Medical",
  "Personal care",
  "Home improvement",
  "General services",
  "Other general services",
  "Government and non-profit",
  "Bank fees",
  "Other",
  TRANSFER_CATEGORY,
] as const;

export const ASSET_TYPES: AccountType[] = ["checking", "savings", "cash", "investment", "crypto", "retirement"];
export const INVESTMENT_TYPES: AccountType[] = ["investment", "crypto", "retirement"];
