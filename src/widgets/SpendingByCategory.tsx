import { defineWidget, type WidgetProps } from "./types";
import { spendingByCategory } from "@/lib/selectors";
import { money, percent } from "@/lib/format";
import { Bar, Empty } from "./ui";

/** Ranked bars read more accurately than a donut once there are more than a few categories. */
function SpendingByCategory({ data, period }: WidgetProps) {
  const rows = spendingByCategory(data, period);
  if (!rows.length) return <Empty>No spending in this period</Empty>;
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const max = rows[0].amount;
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-muted">Total spending</div>
        <div className="tabular text-2xl font-semibold">{money(total, { cents: false })}</div>
      </div>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.category} className="text-sm">
            <div className="mb-1 flex justify-between gap-2">
              <span>{r.category}</span>
              <span className="tabular text-ink-2">
                {money(r.amount, { cents: false })} <span className="text-muted">· {percent(r.amount / total)}</span>
              </span>
            </div>
            <Bar value={r.amount} max={max} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default defineWidget({
  id: "spending-by-category",
  title: "Spending by category",
  description: "Where your money went in the selected period.",
  size: "md",
  defaultVisible: true,
  usesPeriod: true,
  component: SpendingByCategory,
});
