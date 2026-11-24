import Link from "next/link";
import { defineWidget, type WidgetProps } from "./types";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/format";
import { Empty } from "./ui";

function RecentTransactions({ data }: WidgetProps) {
  const accounts = new Map(data.accounts.map((a) => [a.id, a.name]));
  const rows = data.transactions.slice(0, 10);
  if (!rows.length) return <Empty>No transactions yet</Empty>;
  return (
    <div>
      <ul className="divide-y divide-line">
        {rows.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
            <span className="w-14 shrink-0 text-xs text-muted">{formatDate(t.date)}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate">
                {t.description}
                {t.pending && <span className="ml-1.5 rounded bg-surface-2 px-1 text-[11px] text-muted">Pending</span>}
              </div>
              <div className="truncate text-xs text-muted">
                {t.category} · {accounts.get(t.accountId) ?? "Unknown account"}
              </div>
            </div>
            <span className={`tabular shrink-0 font-medium ${t.amount > 0 ? "text-positive" : ""}`}>{money(t.amount, { sign: true })}</span>
          </li>
        ))}
      </ul>
      <Link href="/transactions" className="mt-2 inline-block text-sm text-accent hover:underline">
        View all transactions →
      </Link>
    </div>
  );
}

export default defineWidget({
  id: "recent-transactions",
  title: "Recent transactions",
  description: "Your latest 10 transactions across all accounts.",
  size: "lg",
  defaultVisible: true,
  component: RecentTransactions,
});
