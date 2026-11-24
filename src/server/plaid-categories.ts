/**
 * Maps Plaid's personal_finance_category (primary / detailed) to this app's
 * categories. Edit freely — this is the one place categorisation rules live
 * for linked accounts.
 */
const DETAILED: Record<string, string> = {
  FOOD_AND_DRINK_GROCERIES: "Groceries",
  RENT_AND_UTILITIES_RENT: "Housing",
  LOAN_PAYMENTS_MORTGAGE_PAYMENT: "Housing",
  ENTERTAINMENT_TV_AND_MOVIES: "Subscriptions",
  ENTERTAINMENT_MUSIC_AND_AUDIO: "Subscriptions",
  GENERAL_SERVICES_INSURANCE: "Housing",
  TRANSFER_IN_INVESTMENT_AND_RETIREMENT_FUNDS: "Transfer",
};

const PRIMARY: Record<string, string> = {
  INCOME: "Income",
  TRANSFER_IN: "Transfer",
  TRANSFER_OUT: "Transfer",
  LOAN_PAYMENTS: "Transfer",
  BANK_FEES: "Fees",
  ENTERTAINMENT: "Entertainment",
  FOOD_AND_DRINK: "Dining",
  GENERAL_MERCHANDISE: "Shopping",
  HOME_IMPROVEMENT: "Housing",
  MEDICAL: "Health",
  PERSONAL_CARE: "Personal care",
  GENERAL_SERVICES: "Other",
  GOVERNMENT_AND_NON_PROFIT: "Other",
  TRANSPORTATION: "Transportation",
  TRAVEL: "Travel",
  RENT_AND_UTILITIES: "Utilities",
};

export function mapPlaidCategory(primary?: string | null, detailed?: string | null): string {
  if (detailed && DETAILED[detailed]) return DETAILED[detailed];
  if (primary && PRIMARY[primary]) return PRIMARY[primary];
  return "Other";
}
