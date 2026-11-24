import { defineWidget, type WidgetProps } from "./types";
import { spendingByCategory } from "@/lib/selectors";
import { money, percent } from "@/lib/format";
import { Bar, Empty, Headline, MoreList } from "./ui";

/** Ranked bars read more accurately than a donut once there are more than a few categories. */
function SpendingByCategory({ data, period }: WidgetProps) {
  const rows = spendingByCategory(data, period);
  if (!rows.length) return <Empty>No spending yet this month</Empty>;
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const max = rows[0].amount;
  return (
    <div>
      <Headline value={money(total, { cents: false })} sub="Total" />
      <ul className="space-y-3">
        <MoreList
          items={rows}
          initial={5}
          render={(r) => (
            <li key={r.category} className="text-sm">
              <div className="mb-1 flex justify-between gap-2">
                <span>{r.category}</span>
                <span className="tabular text-ink-2">
                  <span className="text-muted">{percent(r.amount / total)} · </span>
                  {money(r.amount, { cents: false })}
                </span>
              </div>
              <Bar value={r.amount} max={max} />
            </li>
          )}
        />
      </ul>
    </div>
  );
}

export default defineWidget({
  id: "spending-by-category",
  title: "Spending by category this month",
  description: "Where your money went this month, by category.",
  component: SpendingByCategory,
});
