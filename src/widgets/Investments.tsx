import { defineWidget, type WidgetProps } from "./types";
import { investmentAccounts } from "@/lib/selectors";
import { AccountGroups, Empty } from "./ui";

function Investments({ data }: WidgetProps) {
  const accts = investmentAccounts(data);
  if (!accts.length) return <Empty>No investment accounts linked</Empty>;
  return <AccountGroups accounts={accts} order={["investment", "crypto", "retirement"]} />;
}

export default defineWidget({
  id: "investments",
  title: "Investments",
  description: "Brokerage, crypto and retirement balances.",
  component: Investments,
});
