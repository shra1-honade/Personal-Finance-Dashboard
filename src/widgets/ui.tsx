"use client";
/** Small shared building blocks for widgets. */
import { useState } from "react";
import type { Account } from "@/lib/types";
import { ACCOUNT_TYPE_LABELS, type AccountType } from "@/lib/types";
import { money } from "@/lib/format";

export function Stat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className={`tabular text-lg font-semibold ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : ""}`}>{value}</div>
    </div>
  );
}

/** The big number at the top of most cards. */
export function Headline({ value, sub }: { value: string; sub?: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="tabular text-3xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-0.5 text-sm text-muted">{sub}</div>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-20 items-center justify-center text-center text-sm text-muted">{children}</div>;
}

export function Bar({ value, max, color = "var(--series-1)", marker }: { value: number; max: number; color?: string; marker?: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="relative h-2 w-full rounded-full bg-surface-2">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      {marker !== undefined && (
        <div className="absolute -top-1 h-4 w-0.5 rounded bg-ink-2" style={{ left: `${Math.min(100, marker * 100)}%` }} aria-hidden />
      )}
    </div>
  );
}

/** A list that shows the first `initial` rows and a "+N View more" toggle. */
export function MoreList<T>({ items, initial, render }: { items: T[]; initial: number; render: (item: T, i: number) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, initial);
  return (
    <>
      {shown.map(render)}
      {items.length > initial && (
        <li className="list-none pt-2">
          <button onClick={() => setOpen(!open)} className="text-sm text-accent hover:underline">
            {open ? "Show less" : `+${items.length - initial} View more`}
          </button>
        </li>
      )}
    </>
  );
}

export function accountSubtitle(a: Account) {
  return a.mask ? `${a.institution} · ${a.mask}` : a.institution;
}

/** Accounts grouped by type, with a total. Liabilities show what you owe as positive numbers. */
export function AccountGroups({ accounts, order, owed = false }: { accounts: Account[]; order: AccountType[]; owed?: boolean }) {
  const groups = order.map((type) => ({ type, items: accounts.filter((a) => a.type === type) })).filter((g) => g.items.length);
  const sign = owed ? -1 : 1;
  const total = accounts.reduce((s, a) => s + a.balance * sign, 0);
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.type}>
          {groups.length > 1 && <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{ACCOUNT_TYPE_LABELS[g.type]}</div>}
          <ul className="divide-y divide-line">
            {g.items.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate">{a.name}</div>
                  <div className="truncate text-xs text-muted">{accountSubtitle(a)}</div>
                </div>
                <div className="tabular shrink-0 font-medium">{money(a.balance * sign)}</div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="flex justify-between border-t border-line pt-3 text-sm font-medium">
        <span>Total</span>
        <span className="tabular">{money(total)}</span>
      </div>
    </div>
  );
}

export function ChartTooltip({ title, rows }: { title: string; rows: { label: string; value: string; color?: string; dashed?: boolean }[] }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium text-ink">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-ink-2">
          {r.color && <span className="inline-block h-0.5 w-3" style={{ background: r.color, opacity: r.dashed ? 0.6 : 1 }} />}
          <span>{r.label}</span>
          <span className="tabular ml-auto pl-3 font-medium text-ink">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function relativeDay(iso: string, today = new Date()): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((t.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: date.getFullYear() === t.getFullYear() ? undefined : "numeric" });
}
