/** Change CURRENCY / LOCALE here to switch the whole app. */
export const CURRENCY = "USD";
export const LOCALE: string | undefined = undefined; // browser default

const full = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY });
const whole = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  notation: "compact",
  maximumFractionDigits: 1,
});

export function money(n: number, opts: { cents?: boolean; sign?: boolean } = {}): string {
  const s = (opts.cents === false ? whole : full).format(Math.abs(n));
  if (n < 0) return `−${s}`;
  if (opts.sign && n > 0) return `+${s}`;
  return s;
}

export function moneyCompact(n: number): string {
  return (n < 0 ? "−" : "") + compact.format(Math.abs(n));
}

export function percent(n: number, digits = 0): string {
  return `${(n * 100).toFixed(digits)}%`;
}
