"use client";
import { useState } from "react";
import { defineWidget, type WidgetProps } from "./types";
import { budgetProgress } from "@/lib/selectors";
import { resolvePeriod } from "@/lib/dates";
import { money } from "@/lib/format";
import { CATEGORIES, INCOME_CATEGORY, TRANSFER_CATEGORY, type Budget } from "@/lib/types";
import { useFinance } from "@/lib/finance-store";
import { Bar, Empty } from "./ui";

function status(spent: number, limit: number) {
  const r = limit > 0 ? spent / limit : 0;
  if (r > 1) return { label: "Over", icon: "!", color: "var(--status-critical)" };
  if (r >= 0.8) return { label: "Close", icon: "~", color: "var(--status-warning)" };
  return { label: "On track", icon: "✓", color: "var(--status-good)" };
}

const BUDGETABLE = CATEGORIES.filter((c) => c !== INCOME_CATEGORY && c !== TRANSFER_CATEGORY);

function Budgets({ data }: WidgetProps) {
  const { api, refresh } = useFinance();
  const [editing, setEditing] = useState<Budget[] | null>(null);
  const month = resolvePeriod("this-month");
  const rows = budgetProgress(data, month);
  const today = new Date();
  const monthDone = today.getDate() / new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  if (editing) {
    const limitFor = (c: string) => editing.find((b) => b.category === c)?.limit ?? 0;
    const setLimit = (c: string, v: number) =>
      setEditing([...editing.filter((b) => b.category !== c), { category: c, limit: v }]);
    return (
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await api.setBudgets(editing.filter((b) => b.limit > 0));
          setEditing(null);
          await refresh();
        }}
      >
        <p className="text-xs text-muted">Monthly limit per category. Leave at 0 for no budget.</p>
        {BUDGETABLE.map((c) => (
          <label key={c} className="flex items-center justify-between gap-2 text-sm">
            <span>{c}</span>
            <input
              type="number"
              min={0}
              step={10}
              value={limitFor(c) || ""}
              placeholder="0"
              onChange={(e) => setLimit(c, Number(e.target.value) || 0)}
              className="tabular w-28 rounded-md border border-line bg-surface px-2 py-1 text-right"
            />
          </label>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setEditing(null)} className="rounded-md px-3 py-1.5 text-sm text-ink-2 hover:bg-surface-2">
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white">
            Save
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>This month · {Math.round(monthDone * 100)}% of the month gone</span>
        <button onClick={() => setEditing(data.budgets)} className="rounded px-1.5 py-0.5 text-accent hover:bg-surface-2">
          Edit
        </button>
      </div>
      {!rows.length ? (
        <Empty>No budgets yet. Click Edit to set some.</Empty>
      ) : (
        <ul className="space-y-3">
          {rows.map((b) => {
            const s = status(b.spent, b.limit);
            return (
              <li key={b.category} className="text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    {b.category}
                    <span className="flex items-center gap-1 rounded-full bg-surface-2 px-1.5 text-[11px] text-ink-2">
                      <span aria-hidden className="font-bold" style={{ color: s.color }}>{s.icon}</span>
                      {s.label}
                    </span>
                  </span>
                  <span className="tabular text-ink-2">
                    {money(b.spent, { cents: false })} <span className="text-muted">of {money(b.limit, { cents: false })}</span>
                  </span>
                </div>
                <Bar value={b.spent} max={b.limit} color={s.color} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default defineWidget({
  id: "budgets",
  title: "Budgets",
  description: "Spending against your monthly limits.",
  size: "sm",
  defaultVisible: true,
  component: Budgets,
});
