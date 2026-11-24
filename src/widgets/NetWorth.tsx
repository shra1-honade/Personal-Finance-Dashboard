import { defineWidget, type WidgetProps } from "./types";
import { netWorthChange, totals } from "@/lib/selectors";
import { money, percent } from "@/lib/format";
import { Stat } from "./ui";

function NetWorth({ data }: WidgetProps) {
  const { assets, liabilities, netWorth } = totals(data.accounts);
  const change = netWorthChange(data, 30);
  const up = change.delta >= 0;
  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div>
        <div className="tabular text-4xl font-semibold tracking-tight">{money(netWorth, { cents: false })}</div>
        <div className={`mt-1 text-sm ${up ? "text-positive" : "text-negative"}`}>
          <span aria-hidden>{up ? "▲" : "▼"}</span> {money(change.delta, { cents: false, sign: true })} ({percent(Math.abs(change.pct), 1)}){" "}
          <span className="text-muted">last 30 days</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-line pt-4">
        <Stat label="Assets" value={money(assets, { cents: false })} />
        <Stat label="Liabilities" value={money(-liabilities, { cents: false })} />
      </div>
    </div>
  );
}

export default defineWidget({
  id: "net-worth",
  title: "Net worth",
  description: "Total assets minus liabilities, with 30-day change.",
  defaultVisible: false,
  component: NetWorth,
});
