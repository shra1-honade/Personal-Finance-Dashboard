"use client";
import { WIDGETS_BY_ID } from "@/widgets/registry";
import type { Layout } from "./use-layout";

export function CustomizePanel({
  layout,
  onToggle,
  onMove,
  onReset,
}: {
  layout: Layout;
  onToggle: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onReset: () => void;
}) {
  return (
    <div className="mb-6 rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-medium">Widgets</h2>
          <p className="text-xs text-muted">Show, hide and reorder. Add new widgets in src/widgets/registry.ts.</p>
        </div>
        <button onClick={onReset} className="text-sm text-accent hover:underline">
          Reset
        </button>
      </div>
      <ul className="divide-y divide-line">
        {layout.order.map((id, i) => {
          const w = WIDGETS_BY_ID.get(id);
          if (!w) return null;
          const shown = !layout.hidden.includes(id);
          return (
            <li key={id} className="flex items-center gap-3 py-2 text-sm">
              <input type="checkbox" checked={shown} onChange={() => onToggle(id)} aria-label={`Show ${w.title}`} className="h-4 w-4 accent-[var(--accent)]" />
              <div className="min-w-0 flex-1">
                <div className={shown ? "" : "text-muted"}>{w.title}</div>
                <div className="truncate text-xs text-muted">{w.description}</div>
              </div>
              <button onClick={() => onMove(id, -1)} disabled={i === 0} className="rounded px-2 py-1 hover:bg-surface-2 disabled:opacity-30" aria-label="Move up">
                ↑
              </button>
              <button onClick={() => onMove(id, 1)} disabled={i === layout.order.length - 1} className="rounded px-2 py-1 hover:bg-surface-2 disabled:opacity-30" aria-label="Move down">
                ↓
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
