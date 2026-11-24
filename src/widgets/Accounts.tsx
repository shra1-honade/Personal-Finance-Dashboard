import { defineWidget, type WidgetProps } from "./types";
import { ACCOUNT_TYPE_LABELS, type AccountType } from "@/lib/types";
import { money } from "@/lib/format";
import { Empty } from "./ui";

const ORDER: AccountType[] = ["checking", "savings", "cash", "credit", "investment", "retirement", "loan"];

function Accounts({ data }: WidgetProps) {
  if (!data.accounts.length) return <Empty>No accounts yet</Empty>;
  const groups = ORDER.map((type) => ({ type, items: data.accounts.filter((a) => a.type === type) })).filter((g) => g.items.length);
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.type}>
          <div className="mb-1 flex justify-between text-xs font-medium uppercase tracking-wide text-muted">
            <span>{ACCOUNT_TYPE_LABELS[g.type]}</span>
            <span className="tabular">{money(g.items.reduce((s, a) => s + a.balance, 0))}</span>
          </div>
          <ul className="divide-y divide-line">
            {g.items.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate">
                    {a.name}
                    {a.mask ? <span className="text-muted"> ••{a.mask}</span> : null}
                  </div>
                  <div className="truncate text-xs text-muted">{a.institution}</div>
                </div>
                <div className={`tabular font-medium ${a.balance < 0 ? "text-negative" : ""}`}>{money(a.balance)}</div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default defineWidget({
  id: "accounts",
  title: "Accounts",
  description: "Every account and its balance, grouped by type.",
  size: "sm",
  defaultVisible: true,
  component: Accounts,
});
