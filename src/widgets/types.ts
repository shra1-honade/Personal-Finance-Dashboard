import type { ComponentType } from "react";
import type { DashboardPayload } from "@/lib/types";
import type { Period } from "@/lib/dates";

export type WidgetSettings = Record<string, unknown>;

/**
 * Every widget gets the same props: all your data, the current month as a
 * period, and its own saved settings. Compute what you need with helpers
 * from src/lib/selectors.ts.
 */
export interface WidgetProps<S extends WidgetSettings = WidgetSettings> {
  data: DashboardPayload;
  /** The current month, from the 1st to today. */
  period: Period;
  /** This widget instance's saved settings (merged over defaultSettings). */
  settings: S;
  /** Save new settings for this instance. */
  updateSettings: (patch: Partial<S>) => void;
}

export interface WidgetDefinition<S extends WidgetSettings = WidgetSettings> {
  /** Unique, stable type id. Saved in your layout, so don't rename it later. */
  id: string;
  /** Card title. A function lets the title depend on settings (e.g. "Food and drink this month"). */
  title: string | ((settings: S) => string);
  /** Name in the Add widget gallery, when it should differ from the title. */
  galleryTitle?: string;
  /** One line for the Add widget gallery. */
  description: string;
  /** On the dashboard for a fresh layout. Default true. */
  defaultVisible?: boolean;
  /** Can be added more than once (each copy keeps its own settings). */
  allowMultiple?: boolean;
  defaultSettings?: S;
  component: ComponentType<WidgetProps<S>>;
}

export function defineWidget<S extends WidgetSettings = WidgetSettings>(def: WidgetDefinition<S>): WidgetDefinition {
  return def as unknown as WidgetDefinition;
}

export function widgetTitle(def: WidgetDefinition, settings: WidgetSettings): string {
  return typeof def.title === "function" ? def.title({ ...def.defaultSettings, ...settings }) : def.title;
}
