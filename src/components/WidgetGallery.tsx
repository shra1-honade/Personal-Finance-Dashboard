"use client";
import { useEffect } from "react";
import { WIDGETS } from "@/widgets/registry";
import { widgetTitle } from "@/widgets/types";
import type { LayoutItem } from "./use-layout";

export function WidgetGallery({
  items,
  onAdd,
  onReset,
  onClose,
}: {
  items: LayoutItem[];
  onAdd: (type: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 p-4 pt-[10vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add widget"
        className="max-h-[75vh] w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Add widget</h2>
          <button onClick={onClose} aria-label="Close" className="rounded px-2 text-muted hover:bg-surface-2">
            ×
          </button>
        </div>
        <ul className="divide-y divide-line">
          {WIDGETS.map((w) => {
            const added = items.some((i) => i.type === w.id);
            const canAdd = !added || w.allowMultiple;
            return (
              <li key={w.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{w.galleryTitle ?? widgetTitle(w, w.defaultSettings ?? {})}</div>
                  <div className="text-xs text-muted">{w.description}</div>
                </div>
                <button
                  disabled={!canAdd}
                  onClick={() => {
                    onAdd(w.id);
                    onClose();
                  }}
                  className="shrink-0 rounded-md border border-line px-2.5 py-1 text-sm hover:bg-surface-2 disabled:border-transparent disabled:text-muted"
                >
                  {canAdd ? (added ? "Add another" : "Add") : "Added"}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 border-t border-line pt-3 text-right">
          <button
            onClick={() => {
              onReset();
              onClose();
            }}
            className="text-sm text-accent hover:underline"
          >
            Reset dashboard to default
          </button>
        </div>
      </div>
    </div>
  );
}
