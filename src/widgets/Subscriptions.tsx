import { defineWidget, type WidgetProps } from "./types";
import { subscriptions } from "@/lib/selectors";
import { FREQUENCY_LABEL } from "@/lib/recurring";
import { parseISO } from "@/lib/dates";
import { money } from "@/lib/format";
import { Empty } from "./ui";
import { DateBadge } from "./UpcomingBills";

function Subscriptions({ data }: WidgetProps) {
  const { rows, monthlyTotal } = subscriptions(data);
  if (!rows.length) return <Empty>No subscriptions detected yet</Empty>;
  return (
    <div>
      <ul className="divide-y divide-line">
        {rows.map((s) => (
          <li key={s.key} className="flex items-center gap-3 py-2 text-sm">
            <DateBadge iso={s.nextDate} />
            <div className="min-w-0 flex-1">
              <div className="truncate">{s.name}</div>
              <div className="text-xs text-muted">
                {FREQUENCY_LABEL[s.frequency]}
                {s.frequency === "yearly" ? ` · ${parseISO(s.nextDate).getFullYear()}` : ""}
              </div>
            </div>
            <span className="tabular font-medium">{money(s.lastAmount)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between border-t border-line pt-3 text-sm font-medium">
        <span>Monthly total</span>
        <span className="tabular">{money(monthlyTotal)}</span>
      </div>
    </div>
  );
}

export default defineWidget({
  id: "subscriptions",
  title: "Subscriptions",
  description: "Recurring charges with their next date. Yearly ones count as 1/12 per month.",
  component: Subscriptions,
});
