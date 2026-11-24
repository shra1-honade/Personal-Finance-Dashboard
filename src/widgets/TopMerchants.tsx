import { defineWidget, type WidgetProps } from "./types";
import { topMerchants } from "@/lib/selectors";
import { money } from "@/lib/format";
import { Empty } from "./ui";

function TopMerchants({ data, period }: WidgetProps) {
  const rows = topMerchants(data, period, 6);
  if (!rows.length) return <Empty>No spending in this period</Empty>;
  return (
    <ol className="space-y-2">
      {rows.map((m, i) => (
        <li key={m.name} className="flex items-center gap-3 text-sm">
          <span className="tabular w-4 text-xs text-muted">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate">{m.name}</div>
            <div className="text-xs text-muted">
              {m.count} {m.count === 1 ? "purchase" : "purchases"}
            </div>
          </div>
          <span className="tabular font-medium">{money(m.amount, { cents: false })}</span>
        </li>
      ))}
    </ol>
  );
}

export default defineWidget({
  id: "top-merchants",
  title: "Top merchants",
  description: "Where you spend the most, for the selected period.",
  size: "sm",
  defaultVisible: true,
  usesPeriod: true,
  component: TopMerchants,
});
