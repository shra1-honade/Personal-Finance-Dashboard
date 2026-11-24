import { defineWidget, type WidgetProps } from "./types";
import { assetAccounts } from "@/lib/selectors";
import { AccountGroups, Empty } from "./ui";

function CashAndInvestments({ data }: WidgetProps) {
  const accts = assetAccounts(data);
  if (!accts.length) return <Empty>No accounts yet</Empty>;
  return <AccountGroups accounts={accts} order={["investment", "crypto", "retirement", "savings", "checking", "cash"]} />;
}

export default defineWidget({
  id: "cash-and-investments",
  title: "Cash and investments",
  description: "Everything you own, grouped by account type.",
  component: CashAndInvestments,
});
