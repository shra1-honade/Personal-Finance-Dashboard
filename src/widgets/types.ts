import type { ComponentType } from "react";
import type { DashboardPayload } from "@/lib/types";
import type { Period } from "@/lib/dates";

/**
 * Every widget gets the same props: all your data plus the period picked
 * at the top of the dashboard. Compute what you need with helpers from
 * src/lib/selectors.ts.
 */
export interface WidgetProps {
  data: DashboardPayload;
  period: Period;
}

/**
 * Width on the 6-column desktop grid (everything is full-width on phones):
 *   sm = 1/3, md = 1/2, lg = 2/3, full = whole row.
 */
export type WidgetSize = "sm" | "md" | "lg" | "full";

export interface WidgetDefinition {
  /** Unique, stable id. Saved in your layout, so don't rename it later. */
  id: string;
  title: string;
  description: string;
  size: WidgetSize;
  /** Shown on the dashboard by default (you can toggle it in Customize). */
  defaultVisible?: boolean;
  /** Does the widget react to the period picker? Shows the period next to the title. */
  usesPeriod?: boolean;
  component: ComponentType<WidgetProps>;
}

export function defineWidget(def: WidgetDefinition): WidgetDefinition {
  return def;
}
