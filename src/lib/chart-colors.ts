/**
 * Chart colors resolve to CSS variables so they follow light/dark mode.
 * Categorical slots are assigned in fixed order (series-1, series-2, ...),
 * never cycled — the order is what keeps adjacent colors colorblind-safe.
 */
export const chart = {
  series: ["var(--series-1)", "var(--series-2)", "var(--series-3)", "var(--series-4)"],
  grid: "var(--grid)",
  axis: "var(--axis)",
  muted: "var(--muted)",
  ink: "var(--ink)",
  ink2: "var(--ink-2)",
  surface: "var(--surface)",
} as const;

export const axisTick = { fill: "var(--muted)", fontSize: 12 };
