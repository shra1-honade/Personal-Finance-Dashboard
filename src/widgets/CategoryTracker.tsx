"use client";
import { defineWidget, type WidgetProps } from "./types";
import { monthToDateComparison, spendingTransactions } from "@/lib/selectors";
import { CATEGORIES, INCOME_CATEGORY, TRANSFER_CATEGORY } from "@/lib/types";
import { addDays, formatDate, toISO } from "@/lib/dates";
import { money } from "@/lib/format";
import { Headline } from "./ui";

type Settings = { category: string };
const OPTIONS = CATEGORIES.filter((c) => c !== INCOME_CATEGORY && c !== TRANSFER_CATEGORY);
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** Tracks one category: this month so far vs the same days last month, and which days this week you spent. */
function CategoryTracker({ data, period, settings, updateSettings }: WidgetProps<Settings>) {
  const { category } = settings;
  const cmp = monthToDateComparison(data, category);
  const txs = spendingTransactions(data, period, category);
  const spendDays = new Set(txs.filter((t) => t.amount < 0).map((t) => t.date));

  const today = new Date();
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const week = DAYS.map((label, i) => {
    const d = addDays(monday, i);
    const iso = toISO(d);
    return { label, iso, spent: spendDays.has(iso), future: d > today };
  });

  let sub: string;
  if (cmp.change === null) sub = `Nothing last month from ${formatDate(cmp.prevStart)} to ${formatDate(cmp.prevEnd)}`;
  else {
    const pct = Math.round(Math.abs(cmp.change) * 100);
    sub = `${pct}% ${cmp.change <= 0 ? "less" : "more"} than ${formatDate(cmp.prevStart)} to ${formatDate(cmp.prevEnd)}`;
  }

  return (
    <div>
      <Headline value={money(cmp.current, { cents: false })} sub={sub} />
      <div className="flex justify-between gap-1" role="list" aria-label="This week">
        {week.map((d) => (
          <div key={d.iso} role="listitem" className="flex flex-col items-center gap-1.5 text-xs text-muted">
            <span>{d.label}</span>
            <span
              aria-label={`${formatDate(d.iso)}: ${d.spent ? "spent" : "no spending"}`}
              className={`h-6 w-6 rounded-full border ${d.spent ? "border-transparent bg-[var(--series-1)]" : d.future ? "border-dashed border-line" : "border-line"}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>
          {spendDays.size} {spendDays.size === 1 ? "day" : "days"} with purchases this month
        </span>
        <select
          value={category}
          onChange={(e) => updateSettings({ category: e.target.value })}
          aria-label="Category to track"
          className="rounded border border-line bg-surface px-1 py-0.5 text-xs text-ink-2"
        >
          {OPTIONS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default defineWidget<Settings>({
  id: "category-tracker",
  title: (s) => `${s.category} this month`,
  galleryTitle: "Category tracker",
  description: "Track one category against the same days last month. Add one per category.",
  allowMultiple: true,
  defaultSettings: { category: "Food and drink" },
  component: CategoryTracker,
});
