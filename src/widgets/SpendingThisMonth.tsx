"use client";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { defineWidget, type WidgetProps } from "./types";
import { cumulativeSpending } from "@/lib/selectors";
import { money, moneyCompact } from "@/lib/format";
import { axisTick, chart } from "@/lib/chart-colors";
import { ChartTooltip, Headline } from "./ui";

/** Running total of spending through the month, with last month as a dashed reference line. */
function SpendingThisMonth({ data }: WidgetProps) {
  const rows = cumulativeSpending(data);
  const today = new Date();
  const total = rows[today.getDate() - 1]?.thisMonth ?? 0;
  const lastAtSameDay = rows[today.getDate() - 1]?.lastMonth ?? 0;
  const mon = (d: number) => new Date(today.getFullYear(), today.getMonth(), d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const n = rows.length;
  return (
    <div>
      <Headline value={money(total, { cents: false })} sub={`${mon(1)} to today`} />
      <div className="mb-2 flex gap-4 text-xs text-ink-2" aria-hidden>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4" style={{ background: chart.series[0] }} />
          This month
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: chart.muted }} />
          Last month ({money(lastAtSameDay, { cents: false })} by now)
        </span>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 6, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={chart.grid} vertical={false} />
            <XAxis
              dataKey="day"
              ticks={[1, 15, n]}
              tickFormatter={(d) => mon(Number(d))}
              tick={axisTick}
              axisLine={{ stroke: chart.axis }}
              tickLine={false}
              interval={0}
            />
            <YAxis tickFormatter={moneyCompact} tick={axisTick} axisLine={false} tickLine={false} width={52} />
            <Tooltip
              cursor={{ stroke: chart.muted, strokeDasharray: "3 3" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const r = payload[0].payload as (typeof rows)[number];
                return (
                  <ChartTooltip
                    title={mon(Number(label))}
                    rows={[
                      ...(r.thisMonth !== null ? [{ label: "This month", value: money(r.thisMonth, { cents: false }), color: chart.series[0] }] : []),
                      ...(r.lastMonth !== null ? [{ label: "Last month", value: money(r.lastMonth, { cents: false }), color: chart.muted, dashed: true }] : []),
                    ]}
                  />
                );
              }}
            />
            <Line isAnimationActive={false} type="monotone" dataKey="lastMonth" stroke={chart.muted} strokeWidth={2} strokeDasharray="4 4" dot={false} activeDot={false} />
            <Line
              isAnimationActive={false}
              type="monotone"
              dataKey="thisMonth"
              stroke={chart.series[0]}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: chart.surface }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default defineWidget({
  id: "spending-this-month",
  title: "Spending this month",
  description: "Running total of this month's spending against last month.",
  component: SpendingThisMonth,
});
