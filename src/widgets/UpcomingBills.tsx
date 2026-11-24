import { defineWidget, type WidgetProps } from "./types";
import { upcomingBills } from "@/lib/selectors";
import { parseISO } from "@/lib/dates";
import { money } from "@/lib/format";
import { Empty } from "./ui";

export function DateBadge({ iso }: { iso: string }) {
  const d = parseISO(iso);
  return (
    <div className="flex w-10 shrink-0 flex-col items-center rounded-md bg-surface-2 py-1 leading-tight">
      <span className="text-[10px] uppercase text-muted">{d.toLocaleDateString(undefined, { month: "short" })}</span>
      <span className="tabular text-sm font-semibold">{d.getDate()}</span>
    </div>
  );
}

function UpcomingBills({ data }: WidgetProps) {
  const { rows, total } = upcomingBills(data);
  if (!rows.length) return <Empty>No bills due in the next few weeks</Empty>;
  return (
    <div>
      <ul className="divide-y divide-line">
        {rows.map((b) => (
          <li key={b.key} className="flex items-center gap-3 py-2 text-sm">
            <DateBadge iso={b.nextDate} />
            <span className="min-w-0 flex-1 truncate">{b.name}</span>
            <span className="tabular font-medium">{money(b.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between border-t border-line pt-3 text-sm font-medium">
        <span>Total</span>
        <span className="tabular">{money(total)}</span>
      </div>
    </div>
  );
}

export default defineWidget({
  id: "upcoming-bills",
  title: "Upcoming bills",
  description: "Loan, rent and utility payments due in the next 45 days.",
  component: UpcomingBills,
});
