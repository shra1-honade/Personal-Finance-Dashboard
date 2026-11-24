"use client";
import Link from "next/link";
import { useState } from "react";
import { defineWidget, type WidgetProps } from "./types";
import { money } from "@/lib/format";
import { Empty, relativeDay } from "./ui";

function RecentTransactions({ data }: WidgetProps) {
  const [accountId, setAccountId] = useState<string>("");
  const [limit, setLimit] = useState(6);
  // Only accounts that actually have transactions get a chip.
  const withTx = new Set(data.transactions.map((t) => t.accountId));
  const chips = data.accounts.filter((a) => withTx.has(a.id));
  const rows = data.transactions.filter((t) => !accountId || t.accountId === accountId);
  if (!data.transactions.length) return <Empty>No transactions yet</Empty>;

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-2.5 py-1 text-xs ${active ? "border-transparent bg-ink text-surface" : "border-line text-ink-2 hover:bg-surface-2"}`;

  return (
    <div>
      <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <button className={chip(!accountId)} onClick={() => setAccountId("")}>
          All
        </button>
        {chips.map((a) => (
          <button key={a.id} className={chip(accountId === a.id)} onClick={() => setAccountId(a.id)}>
            {a.name}
            {a.mask ? ` ${a.mask}` : ""}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-line">
        {rows.slice(0, limit).map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0">
              <div className="truncate">{t.description}</div>
              <div className="text-xs text-muted">
                {relativeDay(t.date)}
                {t.pending ? " · Pending" : ""}
              </div>
            </div>
            <span className={`tabular shrink-0 font-medium ${t.amount > 0 ? "text-positive" : ""}`}>
              {t.amount > 0 ? money(t.amount, { sign: true }) : money(-t.amount)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between text-sm">
        {rows.length > limit ? (
          <button onClick={() => setLimit(limit + 10)} className="text-accent hover:underline">
            +{rows.length - limit} View more
          </button>
        ) : (
          <span />
        )}
        <Link href={accountId ? `/transactions?account=${encodeURIComponent(accountId)}` : "/transactions"} className="text-accent hover:underline">
          All transactions →
        </Link>
      </div>
    </div>
  );
}

export default defineWidget({
  id: "recent-transactions",
  title: "Recent transactions",
  description: "Latest transactions, filterable by account.",
  component: RecentTransactions,
});
