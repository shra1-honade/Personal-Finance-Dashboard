/** Small shared building blocks for widgets. */

export function Stat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div
        className={`tabular text-lg font-semibold ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full min-h-24 items-center justify-center text-sm text-muted">{children}</div>;
}

export function Bar({ value, max, color = "var(--series-1)" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function ChartTooltip({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; color?: string }[];
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium text-ink">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-ink-2">
          {r.color && <span className="inline-block h-2 w-2 rounded-full" style={{ background: r.color }} />}
          <span>{r.label}</span>
          <span className="tabular ml-auto pl-3 font-medium text-ink">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
