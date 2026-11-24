import { defineWidget, type WidgetProps } from "./types";
import { liabilityAccounts } from "@/lib/selectors";
import { money } from "@/lib/format";
import { AccountGroups, Empty, Headline } from "./ui";

function LoansAndCards({ data }: WidgetProps) {
  const accts = liabilityAccounts(data);
  if (!accts.length) return <Empty>No loans or credit cards linked</Empty>;
  const owed = -accts.reduce((s, a) => s + a.balance, 0);
  return (
    <div>
      <Headline value={money(owed, { cents: false })} sub="Balance" />
      <AccountGroups accounts={accts} order={["credit", "loan"]} owed />
    </div>
  );
}

export default defineWidget({
  id: "loans-and-cards",
  title: "Loans and cards",
  description: "What you owe on credit cards and loans.",
  component: LoansAndCards,
});
