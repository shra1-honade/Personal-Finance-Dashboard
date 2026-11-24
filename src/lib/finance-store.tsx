"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Budget, DashboardPayload } from "./types";

/**
 * Client-side data access. Loads everything from /api/data once and exposes
 * small mutation helpers that call the API and then refresh. Widgets read from
 * here (via props); they never fetch on their own.
 */

interface FinanceContextValue {
  data: DashboardPayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  api: typeof api;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

async function call<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body as T;
}

export const api = {
  linkToken: (itemId?: string) =>
    call<{ linkToken: string }>("/api/plaid/link-token", { method: "POST", body: JSON.stringify({ itemId }) }),
  exchange: (publicToken: string, institutionName: string) =>
    call("/api/plaid/exchange", { method: "POST", body: JSON.stringify({ publicToken, institutionName }) }),
  sync: (itemId?: string) =>
    call<{ results: { institution: string; added: number; error?: string }[] }>("/api/plaid/sync", {
      method: "POST",
      body: JSON.stringify({ itemId }),
    }),
  disconnect: (itemId: string) => call(`/api/plaid/items/${encodeURIComponent(itemId)}`, { method: "DELETE" }),
  setCategory: (id: string, category: string) =>
    call(`/api/transactions/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ category }) }),
  setBudgets: (budgets: Budget[]) => call("/api/budgets", { method: "PUT", body: JSON.stringify(budgets) }),
  loadSample: () => call("/api/sample", { method: "POST" }),
  removeSample: () => call("/api/sample", { method: "DELETE" }),
  deleteAccount: (id: string) => call(`/api/accounts/${encodeURIComponent(id)}`, { method: "DELETE" }),
  importCsv: (body: unknown) =>
    call<{ imported: number }>("/api/import", { method: "POST", body: JSON.stringify(body) }),
};

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await call<DashboardPayload>("/api/data", { cache: "no-store" }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load; state updates happen asynchronously after the fetch resolves.
    call<DashboardPayload>("/api/data", { cache: "no-store" })
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({ data, loading, error, refresh, api }), [data, loading, error, refresh]);
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside <FinanceProvider>");
  return ctx;
}
