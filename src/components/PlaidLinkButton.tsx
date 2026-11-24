"use client";
import { useCallback, useEffect, useState } from "react";
import { usePlaidLink, type PlaidLinkOnSuccess } from "react-plaid-link";
import { useFinance } from "@/lib/finance-store";

/**
 * Opens Plaid Link. Without itemId it links a new bank; with itemId it runs
 * "update mode" to fix an expired login for an existing bank.
 */
export function PlaidLinkButton({
  itemId,
  className,
  children,
}: {
  itemId?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const { data, api, refresh } = useFinance();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (publicToken, metadata) => {
      setBusy(true);
      try {
        if (itemId) await api.sync(itemId);
        else if (publicToken) await api.exchange(publicToken, metadata.institution?.name ?? "Linked bank");
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
        setToken(null);
      }
    },
    [api, itemId, refresh],
  );

  const { open, ready } = usePlaidLink({ token, onSuccess, onExit: () => setToken(null) });

  useEffect(() => {
    if (token && ready) open();
  }, [token, ready, open]);

  if (data && !data.plaidConfigured) {
    return (
      <span className="text-xs text-muted" title="Add PLAID_CLIENT_ID and PLAID_SECRET to .env.local, then restart">
        Plaid not configured
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        className={className ?? "rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"}
        disabled={busy}
        onClick={async () => {
          setError(null);
          setBusy(true);
          try {
            setToken((await api.linkToken(itemId)).linkToken);
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Working…" : (children ?? "Connect a bank")}
      </button>
      {error && <span className="mt-1 max-w-xs text-xs text-negative">{error}</span>}
    </span>
  );
}
