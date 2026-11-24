"use client";
import { useEffect, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useFinance } from "@/lib/finance-store";
import { resolvePeriod } from "@/lib/dates";
import type { DashboardPayload } from "@/lib/types";
import { WIDGETS_BY_ID } from "@/widgets/registry";
import { widgetTitle, type WidgetSettings } from "@/widgets/types";
import { useLayout, type LayoutItem } from "./use-layout";
import { WidgetGallery } from "./WidgetGallery";
import { Onboarding } from "./Onboarding";
import { PlaidLinkButton } from "./PlaidLinkButton";
import { WidgetErrorBoundary } from "./WidgetErrorBoundary";

/** 1 column on phones, 2 on tablets, 3 on desktops. */
function useColumnCount() {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)");
    const lg = window.matchMedia("(min-width: 1100px)");
    const update = () => setCols(lg.matches ? 3 : md.matches ? 2 : 1);
    update();
    md.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);
  return cols;
}

export function Dashboard() {
  const { data, loading, error } = useFinance();
  const { layout, ready, add, remove, move, updateSettings, reset } = useLayout();
  const [gallery, setGallery] = useState(false);
  const cols = useColumnCount();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  if (loading || !ready) return <div className="py-24 text-center text-muted">Loading…</div>;
  if (error || !data) return <div className="py-24 text-center text-negative">Couldn&apos;t load data: {error}</div>;
  if (!data.accounts.length) return <Onboarding />;

  const items = layout.items;
  // Masonry: deal widgets into columns left to right, so order reads across then down.
  const columns: LayoutItem[][] = Array.from({ length: cols }, () => []);
  items.forEach((item, i) => columns[i % cols].push(item));

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    move(String(e.active.id), items.findIndex((i) => i.id === e.over!.id));
  };

  const hasSample = data.accounts.some((a) => a.source === "sample");

  return (
    <div className="py-6">
      {hasSample && (
        <div className="mb-4 rounded-lg border border-line bg-surface-2 px-4 py-2 text-sm text-ink-2">
          You&apos;re looking at sample data. Connect a bank or remove it under{" "}
          <a className="text-accent underline" href="/settings">
            Connections &amp; data
          </a>
          .
        </div>
      )}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-semibold">Personal Finance</h1>
        <PlaidLinkButton className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm hover:bg-surface-2 disabled:opacity-60">
          Link another account
        </PlaidLinkButton>
        <button onClick={() => setGallery(true)} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white">
          Add widget
        </button>
      </div>

      {gallery && <WidgetGallery items={items} onAdd={add} onReset={reset} onClose={() => setGallery(false)} />}

      {!items.length ? (
        <div className="py-16 text-center text-muted">
          No widgets on your dashboard.{" "}
          <button className="text-accent underline" onClick={() => setGallery(true)}>
            Add one
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="grid items-start gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {columns.map((col, c) => (
              <div key={c} className="flex min-w-0 flex-col gap-4">
                {col.map((item) => (
                  <WidgetCard
                    key={item.id}
                    item={item}
                    data={data}
                    onRemove={() => remove(item.id)}
                    onSettings={(patch) => updateSettings(item.id, patch)}
                  />
                ))}
              </div>
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}

function WidgetCard({
  item,
  data,
  onRemove,
  onSettings,
}: {
  item: LayoutItem;
  data: DashboardPayload;
  onRemove: () => void;
  onSettings: (patch: WidgetSettings) => void;
}) {
  const def = WIDGETS_BY_ID.get(item.type)!;
  const settings = { ...def.defaultSettings, ...item.settings };
  const title = widgetTitle(def, settings);
  const drag = useDraggable({ id: item.id });
  const drop = useDroppable({ id: item.id });
  const Component = def.component;
  const style = drag.transform ? { transform: `translate3d(${drag.transform.x}px, ${drag.transform.y}px, 0)`, zIndex: 30 } : undefined;

  return (
    <section
      ref={(el) => {
        drag.setNodeRef(el);
        drop.setNodeRef(el);
      }}
      style={style}
      aria-label={title}
      className={`group rounded-xl border bg-surface p-5 transition-shadow ${drag.isDragging ? "shadow-xl" : ""} ${
        drop.isOver && !drag.isDragging ? "border-accent ring-2 ring-[var(--accent)]/30" : "border-line"
      }`}
    >
      <header className="mb-4 flex items-center gap-2">
        <button
          {...drag.listeners}
          {...drag.attributes}
          aria-label={`Move ${title}. Press space, then arrow keys, then space to drop.`}
          className="-ml-1 cursor-grab touch-none rounded px-1 text-muted opacity-40 hover:bg-surface-2 group-hover:opacity-100 focus:opacity-100"
        >
          ⠿
        </button>
        <h2 className="flex-1 truncate text-sm font-medium text-ink-2">{title}</h2>
        <button
          onClick={onRemove}
          aria-label={`Remove ${title}`}
          title="Remove widget"
          className="rounded px-1.5 text-muted opacity-0 hover:bg-surface-2 hover:text-ink group-hover:opacity-100 focus:opacity-100"
        >
          ×
        </button>
      </header>
      <WidgetErrorBoundary name={title}>
        <Component data={data} period={resolvePeriod("this-month")} settings={settings} updateSettings={onSettings} />
      </WidgetErrorBoundary>
    </section>
  );
}
