/**
 * Maps Plaid's personal_finance_category (primary / detailed) to this app's
 * categories. Edit freely: this is the one place categorisation rules live
 * for linked accounts.
 */
const DETAILED: Record<string, string> = {
  // Paying a card off moves money between your own accounts; the purchases were already counted.
  LOAN_PAYMENTS_CREDIT_CARD_PAYMENT: "Transfer",
  GENERAL_SERVICES_INSURANCE: "Insurance",
  GENERAL_SERVICES_OTHER_GENERAL_SERVICES: "Other general services",
};

const PRIMARY: Record<string, string> = {
  INCOME: "Income",
  TRANSFER_IN: "Transfer",
  TRANSFER_OUT: "Transfer",
  LOAN_PAYMENTS: "Loan payments",
  LOAN_DISBURSEMENTS: "Transfer",
  BANK_FEES: "Bank fees",
  ENTERTAINMENT: "Entertainment",
  FOOD_AND_DRINK: "Food and drink",
  GENERAL_MERCHANDISE: "Shopping",
  HOME_IMPROVEMENT: "Home improvement",
  MEDICAL: "Medical",
  PERSONAL_CARE: "Personal care",
  GENERAL_SERVICES: "General services",
  GOVERNMENT_AND_NON_PROFIT: "Government and non-profit",
  TRANSPORTATION: "Transportation",
  TRAVEL: "Travel",
  RENT_AND_UTILITIES: "Rent and utilities",
};

export function mapPlaidCategory(primary?: string | null, detailed?: string | null): string {
  if (detailed && DETAILED[detailed]) return DETAILED[detailed];
  if (primary && PRIMARY[primary]) return PRIMARY[primary];
  return "Other";
}
