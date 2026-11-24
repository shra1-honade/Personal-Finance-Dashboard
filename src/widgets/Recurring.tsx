import { defineWidget, type WidgetProps } from "./types";
import { recurringCharges } from "@/lib/selectors";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/format";
import { Empty } from "./ui";

function Recurring({ data }: WidgetProps) {
  const rows = recurringCharges(data);
  if (!rows.length) return <Empty>No recurring charges detected yet</Empty>;
  const monthly = rows.reduce((s, r) => s + r.amount, 0);
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-muted">About {money(monthly, { cents: false })} per month</div>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between gap-2 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate">{r.name}</div>
              <div className="text-xs text-muted">Next around {formatDate(r.nextDate)}</div>
            </div>
            <span className="tabular font-medium">{money(r.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default defineWidget({
  id: "recurring",
  title: "Recurring charges",
  description: "Bills and subscriptions detected from repeating charges.",
  size: "sm",
  defaultVisible: true,
  component: Recurring,
});
