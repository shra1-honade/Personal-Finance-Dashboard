"use client";
import { useCallback, useEffect, useState } from "react";
import { WIDGETS, WIDGETS_BY_ID } from "@/widgets/registry";
import type { WidgetSettings } from "@/widgets/types";

/**
 * The dashboard layout: an ordered list of widget instances, each with its
 * own settings. Saved in the database (GET/PUT /api/layout).
 */
export interface LayoutItem {
  /** Unique per instance. */
  id: string;
  /** Widget type id from the registry. */
  type: string;
  settings?: WidgetSettings;
}

export interface Layout {
  items: LayoutItem[];
}

const newId = (type: string) => `${type}-${Math.random().toString(36).slice(2, 8)}`;

export function defaultLayout(): Layout {
  return { items: WIDGETS.filter((w) => w.defaultVisible !== false).map((w) => ({ id: w.id, type: w.id })) };
}

/** Drop widgets that no longer exist in the registry. */
function clean(layout: Layout): Layout {
  return { items: layout.items.filter((i) => WIDGETS_BY_ID.has(i.type)) };
}

export function useLayout() {
  const [layout, setLayout] = useState<Layout | null>(null);

  useEffect(() => {
    fetch("/api/layout", { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { layout: Layout | null }) => setLayout(b.layout ? clean(b.layout) : defaultLayout()))
      .catch(() => setLayout(defaultLayout()));
  }, []);

  const save = useCallback((next: Layout) => {
    setLayout(next);
    void fetch("/api/layout", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
  }, []);

  const current = layout ?? defaultLayout();

  return {
    layout: current,
    ready: layout !== null,
    add: (type: string) => {
      const def = WIDGETS_BY_ID.get(type);
      const id = def?.allowMultiple && current.items.some((i) => i.type === type) ? newId(type) : type;
      // New widgets go to the top so you see them right away.
      save({ items: [{ id, type, settings: def?.defaultSettings }, ...current.items] });
    },
    remove: (id: string) => save({ items: current.items.filter((i) => i.id !== id) }),
    move: (id: string, toIndex: number) => {
      const items = [...current.items];
      const from = items.findIndex((i) => i.id === id);
      if (from < 0) return;
      const [item] = items.splice(from, 1);
      items.splice(Math.max(0, Math.min(items.length, toIndex)), 0, item);
      save({ items });
    },
    updateSettings: (id: string, patch: WidgetSettings) =>
      save({ items: current.items.map((i) => (i.id === id ? { ...i, settings: { ...i.settings, ...patch } } : i)) }),
    reset: () => save(defaultLayout()),
  };
}
