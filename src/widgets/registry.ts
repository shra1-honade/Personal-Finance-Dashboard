/**
 * THE WIDGET REGISTRY
 *
 * To add a widget:
 *   1. Create src/widgets/MyWidget.tsx that default-exports defineWidget({...})
 *   2. Import it below and add it to the list.
 * It then shows up in the "Add widget" gallery. The order here is the
 * default dashboard order for widgets with defaultVisible (the default).
 */
import type { WidgetDefinition } from "./types";
import categoryTracker from "./CategoryTracker";
import topMerchants from "./TopMerchants";
import dailyReview from "./DailyReview";
import spendingByCategory from "./SpendingByCategory";
import investments from "./Investments";
import cashFlow from "./CashFlow";
import cashAndInvestments from "./CashAndInvestments";
import insights from "./Insights";
import loansAndCards from "./LoansAndCards";
import upcomingBills from "./UpcomingBills";
import recentTransactions from "./RecentTransactions";
import budget from "./BudgetThisMonth";
import spendingThisMonth from "./SpendingThisMonth";
import subscriptions from "./Subscriptions";
import netWorth from "./NetWorth";
import netWorthTrend from "./NetWorthTrend";
import incomeVsSpending from "./IncomeVsSpending";

export const WIDGETS: WidgetDefinition[] = [
  categoryTracker,
  topMerchants,
  dailyReview,
  spendingByCategory,
  investments,
  cashFlow,
  cashAndInvestments,
  insights,
  loansAndCards,
  upcomingBills,
  recentTransactions,
  budget,
  spendingThisMonth,
  subscriptions,
  netWorth,
  netWorthTrend,
  incomeVsSpending,
];

export const WIDGETS_BY_ID = new Map(WIDGETS.map((w) => [w.id, w]));
