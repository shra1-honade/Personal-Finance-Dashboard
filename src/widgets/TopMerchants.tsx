import { defineWidget, type WidgetProps } from "./types";
import { topMerchants } from "@/lib/selectors";
import { money } from "@/lib/format";
import { Empty, MoreList } from "./ui";

function TopMerchants({ data, period }: WidgetProps) {
  const rows = topMerchants(data, period);
  if (!rows.length) return <Empty>No spending yet this month</Empty>;
  return (
    <ul className="divide-y divide-line">
      <MoreList
        items={rows}
        initial={6}
        render={(m) => (
          <li key={m.name} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate">{m.name}</div>
              <div className="text-xs text-muted">
                {m.count} {m.count === 1 ? "transaction" : "transactions"}
              </div>
            </div>
            <span className="tabular font-medium">{money(m.amount)}</span>
          </li>
        )}
      />
    </ul>
  );
}

export default defineWidget({
  id: "top-merchants",
  title: "Top merchants this month",
  description: "Where you spent the most this month.",
  component: TopMerchants,
});
