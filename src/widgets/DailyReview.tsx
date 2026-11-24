import { defineWidget, type WidgetProps } from "./types";
import { cashFlowTransactions, isSpending } from "@/lib/selectors";
import { addDays, formatDate, toISO } from "@/lib/dates";
import { money } from "@/lib/format";
import { Headline } from "./ui";

function DailyReview({ data }: WidgetProps) {
  const yesterday = toISO(addDays(new Date(), -1));
  const txs = cashFlowTransactions(data).filter((t) => t.date === yesterday && isSpending(t) && t.amount < 0);
  const total = -txs.reduce((s, t) => s + t.amount, 0);
  return (
    <div>
      <Headline
        value={money(total, { cents: false })}
        sub={txs.length ? `${txs.length} ${txs.length === 1 ? "purchase" : "purchases"} yesterday` : `No purchases yesterday (${formatDate(yesterday)})`}
      />
      {txs.length > 0 && (
        <ul className="divide-y divide-line">
          {txs.map((t) => (
            <li key={t.id} className="flex justify-between gap-3 py-1.5 text-sm">
              <span className="truncate">
                {t.description}
                {t.pending && <span className="ml-1.5 text-xs text-muted">Pending</span>}
              </span>
              <span className="tabular">{money(-t.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default defineWidget({
  id: "daily-review",
  title: "Daily review",
  description: "What you bought yesterday.",
  component: DailyReview,
});
