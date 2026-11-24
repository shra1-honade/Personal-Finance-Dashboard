"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { defineWidget, type WidgetProps } from "./types";
import { netWorthHistory } from "@/lib/selectors";
import { monthLabel } from "@/lib/dates";
import { money, moneyCompact } from "@/lib/format";
import { axisTick, chart } from "@/lib/chart-colors";
import { ChartTooltip } from "./ui";

function NetWorthTrend({ data }: WidgetProps) {
  const rows = netWorthHistory(data, 12);
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nw-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chart.series[0]} stopOpacity={0.25} />
              <stop offset="100%" stopColor={chart.series[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis dataKey="month" tickFormatter={(k) => monthLabel(k)} tick={axisTick} axisLine={{ stroke: chart.axis }} tickLine={false} minTickGap={16} />
          <YAxis tickFormatter={moneyCompact} tick={axisTick} axisLine={false} tickLine={false} width={64} domain={["auto", "auto"]} />
          <Tooltip
            cursor={{ stroke: chart.muted, strokeDasharray: "3 3" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <ChartTooltip title={monthLabel(String(label), "long")} rows={[{ label: "Net worth", value: money(Number(payload[0].value), { cents: false }) }]} />
              ) : null
            }
          />
          <Area isAnimationActive={false} type="monotone" dataKey="netWorth" stroke={chart.series[0]} strokeWidth={2} fill="url(#nw-fill)" activeDot={{ r: 4, strokeWidth: 2, stroke: chart.surface }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default defineWidget({
  id: "net-worth-trend",
  title: "Net worth over time",
  description: "Month-end net worth for the last 12 months.",
  defaultVisible: false,
  component: NetWorthTrend,
});
