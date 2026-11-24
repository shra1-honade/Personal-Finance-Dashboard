"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { defineWidget, type WidgetProps } from "./types";
import { monthlyCashFlow } from "@/lib/selectors";
import { monthLabel } from "@/lib/dates";
import { money, moneyCompact } from "@/lib/format";
import { axisTick, chart } from "@/lib/chart-colors";
import { ChartTooltip, Stat } from "./ui";

const INCOME = chart.series[0];
const SPENDING = chart.series[1];

function CashFlow({ data }: WidgetProps) {
  const rows = monthlyCashFlow(data, 6);
  const current = rows[rows.length - 1];
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Income this month" value={money(current.income, { cents: false })} />
        <Stat label="Spending this month" value={money(current.spending, { cents: false })} />
        <Stat label="Net" value={money(current.net, { cents: false, sign: true })} tone={current.net >= 0 ? "positive" : "negative"} />
      </div>
      <div className="flex gap-4 text-xs text-ink-2" aria-hidden>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: INCOME }} />Income</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: SPENDING }} />Spending</span>
      </div>
      <div className="min-h-44 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2} barCategoryGap="28%">
            <CartesianGrid stroke={chart.grid} vertical={false} />
            <XAxis dataKey="month" tickFormatter={(k) => monthLabel(k)} tick={axisTick} axisLine={{ stroke: chart.axis }} tickLine={false} />
            <YAxis tickFormatter={moneyCompact} tick={axisTick} axisLine={false} tickLine={false} width={56} />
            <Tooltip
              cursor={{ fill: "var(--surface-2)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const r = payload[0].payload as (typeof rows)[number];
                return (
                  <ChartTooltip
                    title={monthLabel(String(label), "long")}
                    rows={[
                      { label: "Income", value: money(r.income, { cents: false }), color: INCOME },
                      { label: "Spending", value: money(r.spending, { cents: false }), color: SPENDING },
                      { label: "Net", value: money(r.net, { cents: false, sign: true }) },
                    ]}
                  />
                );
              }}
            />
            <Bar isAnimationActive={false} dataKey="income" name="Income" fill={INCOME} radius={[4, 4, 0, 0]} />
            <Bar isAnimationActive={false} dataKey="spending" name="Spending" fill={SPENDING} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default defineWidget({
  id: "cash-flow",
  title: "Cash flow",
  description: "Income vs spending for the last 6 months (transfers excluded).",
  size: "md",
  defaultVisible: true,
  component: CashFlow,
});
