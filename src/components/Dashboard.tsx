"use client";
import { useState } from "react";
import { useFinance } from "@/lib/finance-store";
import { PERIOD_OPTIONS, resolvePeriod, type PeriodId } from "@/lib/dates";
import { WIDGETS_BY_ID } from "@/widgets/registry";
import type { WidgetSize } from "@/widgets/types";
import { useLayout } from "./use-layout";
import { CustomizePanel } from "./CustomizePanel";
import { Onboarding } from "./Onboarding";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";

const SPAN: Record<WidgetSize, string> = {
  sm: "lg:col-span-2",
  md: "lg:col-span-3",
  lg: "lg:col-span-4",
  full: "lg:col-span-6",
};

export function Dashboard() {
  const { data, loading, error } = useFinance();
  const [periodId, setPeriodId] = useState<PeriodId>("this-month");
  const [customizing, setCustomizing] = useState(false);
  const { layout, toggle, move, reset } = useLayout();

  if (loading) return <div className="py-24 text-center text-muted">Loading…</div>;
  if (error || !data) return <div className="py-24 text-center text-negative">Couldn&apos;t load data: {error}</div>;
  if (!data.accounts.length) return <Onboarding />;

  const period = resolvePeriod(periodId);
  const visible = layout.order.filter((id) => !layout.hidden.includes(id)).map((id) => WIDGETS_BY_ID.get(id)!).filter(Boolean);
  const hasSample = data.accounts.some((a) => a.source === "sample");

  return (
    <div className="py-6">
      {hasSample && (
        <div className="mb-4 rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm text-ink-2">
          You&apos;re looking at sample data. Connect a bank or remove it under <a className="text-accent underline" href="/settings">Connections &amp; data</a>.
        </div>
      )}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-semibold">Overview</h1>
        <div role="group" aria-label="Period" className="flex rounded-lg border border-line bg-surface p-0.5 text-sm">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodId(p.id)}
              aria-pressed={p.id === periodId}
              className={`rounded-md px-2.5 py-1 ${p.id === periodId ? "bg-surface-2 font-medium text-ink" : "text-ink-2 hover:text-ink"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button onClick={() => setCustomizing((c) => !c)} className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm hover:bg-surface-2">
          {customizing ? "Done" : "Customize"}
        </button>
      </div>

      {customizing && <CustomizePanel layout={layout} onToggle={toggle} onMove={move} onReset={reset} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        {visible.map((w) => {
          const Component = w.component;
          return (
            <section key={w.id} className={`${SPAN[w.size]} flex flex-col rounded-xl border border-line bg-surface p-5`}>
              <header className="mb-4 flex items-baseline justify-between gap-2">
                <h2 className="text-sm font-medium text-ink-2">{w.title}</h2>
                {w.usesPeriod && <span className="text-xs text-muted">{period.label}</span>}
              </header>
              <div className="flex-1">
                <WidgetErrorBoundary name={w.title}>
                  <Component data={data} period={period} />
                </WidgetErrorBoundary>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
