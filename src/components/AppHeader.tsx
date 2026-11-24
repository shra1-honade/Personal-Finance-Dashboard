"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFinance } from "@/lib/finance-store";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/settings", label: "Connections & data" },
];

export function AppHeader() {
  const path = usePathname();
  const { data, api, refresh } = useFinance();
  const [syncing, setSyncing] = useState(false);
  const linked = (data?.institutions.length ?? 0) > 0;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold">
          Personal Finance
        </Link>
        <nav className="flex gap-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-md px-2.5 py-1.5 ${path === n.href ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2"}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {data?.plaidEnv === "sandbox" && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-2" title="Plaid sandbox: fake banks and data">
              Sandbox
            </span>
          )}
          {linked && (
            <button
              className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-surface-2 disabled:opacity-60"
              disabled={syncing}
              onClick={async () => {
                setSyncing(true);
                try {
                  await api.sync();
                  await refresh();
                } finally {
                  setSyncing(false);
                }
              }}
            >
              {syncing ? "Syncing…" : "Sync now"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
