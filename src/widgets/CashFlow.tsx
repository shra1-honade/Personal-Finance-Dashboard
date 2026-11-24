import { defineWidget, type WidgetProps } from "./types";
import { cashFlow } from "@/lib/selectors";
import { money } from "@/lib/format";
import { Bar, Headline } from "./ui";

function CashFlow({ data, period }: WidgetProps) {
  const { moneyIn, moneyOut, net } = cashFlow(data, period);
  const max = Math.max(moneyIn, moneyOut);
  return (
    <div>
      <Headline value={money(net, { cents: false, sign: true })} sub="Net" />
      <div className="space-y-3 text-sm">
        <div>
          <div className="mb-1 flex justify-between">
            <span>Money in</span>
            <span className="tabular font-medium">{money(moneyIn, { cents: false, sign: true })}</span>
          </div>
          <Bar value={moneyIn} max={max} color="var(--series-1)" />
        </div>
        <div>
          <div className="mb-1 flex justify-between">
            <span>Money out</span>
            <span className="tabular font-medium">{money(-moneyOut, { cents: false })}</span>
          </div>
          <Bar value={moneyOut} max={max} color="var(--series-2)" />
        </div>
      </div>
    </div>
  );
}

export default defineWidget({
  id: "cash-flow",
  title: "Cash flow this month",
  description: "Money in, money out and what's left (transfers excluded).",
  component: CashFlow,
});
