import { defineWidget, type WidgetProps } from "./types";
import { insights } from "@/lib/selectors";
import { Empty } from "./ui";

const ICON = { info: "i", warning: "!", good: "✓" } as const;
const COLOR = { info: "var(--series-1)", warning: "var(--status-warning)", good: "var(--status-good)" } as const;

/** Rule-based insights. Rules live in insights() in src/lib/selectors.ts. */
function Insights({ data }: WidgetProps) {
  const rows = insights(data);
  if (!rows.length) return <Empty>Nothing unusual right now</Empty>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.id} className="flex gap-3 text-sm">
          <span
            aria-hidden
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: COLOR[r.tone], color: r.tone === "warning" ? "#0b0b0b" : "#fff" }}
          >
            {ICON[r.tone]}
          </span>
          <span className="text-ink-2">{r.text}</span>
        </li>
      ))}
    </ul>
  );
}

export default defineWidget({
  id: "insights",
  title: "Insights",
  description: "Late paychecks, unusual deposits, bills that haven't posted, price changes.",
  component: Insights,
});
