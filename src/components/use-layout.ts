"use client";
import { useCallback, useEffect, useState } from "react";
import { WIDGETS } from "@/widgets/registry";

/**
 * Which widgets are shown, and in what order. Saved per browser in
 * localStorage. New widgets you add to the registry appear automatically.
 */
export interface Layout {
  order: string[];
  hidden: string[];
}

const KEY = "pf:layout:v1";

function defaults(): Layout {
  return { order: WIDGETS.map((w) => w.id), hidden: WIDGETS.filter((w) => w.defaultVisible === false).map((w) => w.id) };
}

function reconcile(saved: Layout): Layout {
  const known = new Set(WIDGETS.map((w) => w.id));
  const order = saved.order.filter((id) => known.has(id));
  const hidden = saved.hidden.filter((id) => known.has(id));
  for (const w of WIDGETS) {
    if (!order.includes(w.id)) {
      order.push(w.id);
      if (w.defaultVisible === false) hidden.push(w.id);
    }
  }
  return { order, hidden };
}

export function useLayout() {
  const [layout, setLayout] = useState<Layout>(defaults);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
      if (raw) setLayout(reconcile(JSON.parse(raw)));
    } catch {
      /* storage unavailable: keep defaults */
    }
  }, []);

  const save = useCallback((next: Layout) => {
    setLayout(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = (id: string) =>
    save({ ...layout, hidden: layout.hidden.includes(id) ? layout.hidden.filter((h) => h !== id) : [...layout.hidden, id] });

  const move = (id: string, dir: -1 | 1) => {
    const order = [...layout.order];
    const i = order.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    save({ ...layout, order });
  };

  const reset = () => save(defaults());

  return { layout, toggle, move, reset };
}
