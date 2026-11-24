"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useFinance } from "@/lib/finance-store";
import { CATEGORIES } from "@/lib/types";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/format";

const PAGE = 100;

function TransactionsView() {
  const { data, loading, api, refresh } = useFinance();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const params = useSearchParams();
  const [accountId, setAccountId] = useState(params.get("account") ?? "");
  const [limit, setLimit] = useState(PAGE);

  const accounts = useMemo(() => new Map((data?.accounts ?? []).map((a) => [a.id, a])), [data]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.transactions ?? []).filter(
      (t) =>
        (!needle || t.description.toLowerCase().includes(needle)) &&
        (!category || t.category === category) &&
        (!accountId || t.accountId === accountId),
    );
  }, [data, q, category, accountId]);

  if (loading || !data) return <div className="py-24 text-center text-muted">Loading…</div>;

  const inflow = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const outflow = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const allCategories = [...new Set([...CATEGORIES, ...data.transactions.map((t) => t.category)])];

  const input = "rounded-md border border-line bg-surface px-3 py-1.5 text-sm";
  return (
    <div className="py-6">
      <h1 className="mb-4 text-2xl font-semibold">Transactions</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className={`${input} min-w-48 flex-1`} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={input} aria-label="Category">
          <option value="">All categories</option>
          {allCategories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={input} aria-label="Account">
          <option value="">All accounts</option>
          {data.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3 flex gap-6 text-sm text-ink-2">
        <span>{filtered.length.toLocaleString()} transactions</span>
        <span className="tabular">In {money(inflow)}</span>
        <span className="tabular">Out {money(outflow)}</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="hidden px-4 py-2 font-medium md:table-cell">Account</th>
              <th className="px-4 py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.slice(0, limit).map((t) => (
              <tr key={t.id}>
                <td className="whitespace-nowrap px-4 py-2 text-ink-2">{formatDate(t.date)}</td>
                <td className="px-4 py-2">
                  {t.description}
                  {t.pending && <span className="ml-1.5 rounded bg-surface-2 px-1 text-[11px] text-muted">Pending</span>}
                </td>
                <td className="px-4 py-1">
                  <select
                    value={t.category}
                    aria-label={`Category for ${t.description}`}
                    onChange={async (e) => {
                      await api.setCategory(t.id, e.target.value);
                      await refresh();
                    }}
                    className="rounded border border-transparent bg-transparent py-1 hover:border-line"
                  >
                    {allCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </td>
                <td className="hidden px-4 py-2 text-ink-2 md:table-cell">{accounts.get(t.accountId)?.name}</td>
                <td className={`tabular whitespace-nowrap px-4 py-2 text-right font-medium ${t.amount > 0 ? "text-positive" : ""}`}>
                  {money(t.amount, { sign: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > limit && (
        <button onClick={() => setLimit(limit + PAGE)} className="mt-3 text-sm text-accent hover:underline">
          Show more
        </button>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  // useSearchParams needs a Suspense boundary for static rendering.
  return (
    <Suspense fallback={<div className="py-24 text-center text-muted">Loading…</div>}>
      <TransactionsView />
    </Suspense>
  );
}
