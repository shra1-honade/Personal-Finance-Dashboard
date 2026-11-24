"use client";
import Link from "next/link";
import { useState } from "react";
import { useFinance } from "@/lib/finance-store";
import { PlaidLinkButton } from "./PlaidLinkButton";

export function Onboarding() {
  const { data, api, refresh } = useFinance();
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <h1 className="text-2xl font-semibold">Let&apos;s get your money in one place</h1>
      <p className="mt-2 text-ink-2">Connect your banks with Plaid, import a CSV export, or explore with sample data first.</p>
      <div className="mt-8 flex flex-wrap items-start justify-center gap-3">
        <PlaidLinkButton className="rounded-md bg-accent px-4 py-2 font-medium text-white disabled:opacity-60" />
        <Link href="/settings#import" className="rounded-md border border-line bg-surface px-4 py-2 hover:bg-surface-2">
          Import CSV
        </Link>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await api.loadSample();
            await refresh();
            setBusy(false);
          }}
          className="rounded-md border border-line bg-surface px-4 py-2 hover:bg-surface-2 disabled:opacity-60"
        >
          {busy ? "Loading…" : "Try sample data"}
        </button>
      </div>
      {data && !data.plaidConfigured && (
        <p className="mt-6 text-sm text-muted">
          To connect banks, add your Plaid keys to <code className="rounded bg-surface-2 px-1">.env.local</code> (see the README) and restart the app.
        </p>
      )}
    </div>
  );
}
