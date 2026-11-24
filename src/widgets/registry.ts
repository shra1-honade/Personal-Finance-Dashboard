/**
 * THE WIDGET REGISTRY
 *
 * To add a widget:
 *   1. Create src/widgets/MyWidget.tsx that default-exports defineWidget({...})
 *   2. Import it below and add it to the list.
 * That's it: it shows up on the dashboard and in the Customize panel.
 * The order here is the default order on the dashboard.
 */
import type { WidgetDefinition } from "./types";
import netWorth from "./NetWorth";
import netWorthTrend from "./NetWorthTrend";
import accounts from "./Accounts";
import cashFlow from "./CashFlow";
import spendingByCategory from "./SpendingByCategory";
import budgets from "./Budgets";
import recentTransactions from "./RecentTransactions";
import topMerchants from "./TopMerchants";
import recurring from "./Recurring";

export const WIDGETS: WidgetDefinition[] = [
  netWorth,
  netWorthTrend,
  cashFlow,
  spendingByCategory,
  budgets,
  accounts,
  topMerchants,
  recentTransactions,
  recurring,
];

export const WIDGETS_BY_ID = new Map(WIDGETS.map((w) => [w.id, w]));
