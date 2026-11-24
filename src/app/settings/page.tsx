"use client";
import { useFinance } from "@/lib/finance-store";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { CsvImport } from "@/components/CsvImport";
import { ACCOUNT_TYPE_LABELS } from "@/lib/types";
import { money } from "@/lib/format";

export default function SettingsPage() {
  const { data, loading, api, refresh } = useFinance();
  if (loading || !data) return <div className="py-24 text-center text-muted">Loading…</div>;
  const hasSample = data.accounts.some((a) => a.source === "sample");
  const manual = data.accounts.filter((a) => a.source === "csv" || a.source === "manual");
  const card = "rounded-xl border border-line bg-surface p-5";

  return (
    <div className="space-y-6 py-6">
      <h1 className="text-2xl font-semibold">Connections &amp; data</h1>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-medium">Linked banks</h2>
            <p className="text-sm text-muted">
              Connected through Plaid{data.plaidEnv ? ` (${data.plaidEnv})` : ""}. Balances and transactions update when you sync.
            </p>
          </div>
          <PlaidLinkButton />
        </div>
        {!data.plaidConfigured && (
          <p className="rounded-md bg-surface-2 p-3 text-sm text-ink-2">
            Plaid isn&apos;t configured yet. Copy <code>.env.example</code> to <code>.env.local</code>, add your Plaid client ID and secret, and restart.
          </p>
        )}
        <ul className="divide-y divide-line">
          {data.institutions.map((inst) => {
            const accts = data.accounts.filter((a) => a.itemId === inst.itemId);
            return (
              <li key={inst.itemId} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{inst.institutionName}</span>
                  <span className="text-xs text-muted">
                    {inst.lastSyncedAt ? `Synced ${new Date(inst.lastSyncedAt + "Z").toLocaleString()}` : "Never synced"}
                  </span>
                  <span className="ml-auto flex gap-2">
                    {inst.error && (
                      <PlaidLinkButton itemId={inst.itemId} className="rounded-md border border-line px-2.5 py-1 text-sm hover:bg-surface-2">
                        Fix connection
                      </PlaidLinkButton>
                    )}
                    <button
                      onClick={async () => {
                        await api.sync(inst.itemId);
                        await refresh();
                      }}
                      className="rounded-md border border-line px-2.5 py-1 text-sm hover:bg-surface-2"
                    >
                      Sync
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Disconnect ${inst.institutionName}? Its accounts and transactions will be deleted here.`)) return;
                        await api.disconnect(inst.itemId);
                        await refresh();
                      }}
                      className="rounded-md px-2.5 py-1 text-sm text-negative hover:bg-surface-2"
                    >
                      Disconnect
                    </button>
                  </span>
                </div>
                {inst.error && <p className="mt-1 text-sm text-negative">{inst.error}</p>}
                <ul className="mt-1 text-sm text-ink-2">
                  {accts.map((a) => (
                    <li key={a.id} className="flex justify-between">
                      <span>
                        {a.name} {a.mask && <span className="text-muted">••{a.mask}</span>} · {ACCOUNT_TYPE_LABELS[a.type]}
                      </span>
                      <span className="tabular">{money(a.balance)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
          {!data.institutions.length && <li className="py-3 text-sm text-muted">No banks linked yet.</li>}
        </ul>
      </section>

      <section id="import" className={card}>
        <h2 className="font-medium">Import a CSV</h2>
        <p className="mb-4 text-sm text-muted">For banks Plaid doesn&apos;t support. Re-importing the same file won&apos;t create duplicates.</p>
        <CsvImport />
        {manual.length > 0 && (
          <ul className="mt-5 divide-y divide-line border-t border-line text-sm">
            {manual.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2">
                <span>
                  {a.name} <span className="text-muted">· {ACCOUNT_TYPE_LABELS[a.type]}</span>
                </span>
                <button
                  onClick={async () => {
                    if (!window.confirm(`Delete ${a.name} and its imported transactions?`)) return;
                    await api.deleteAccount(a.id);
                    await refresh();
                  }}
                  className="text-negative hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className="font-medium">Sample data</h2>
        <p className="mb-3 text-sm text-muted">A year of made-up accounts and transactions, handy for trying out widgets.</p>
        <button
          onClick={async () => {
            await (hasSample ? api.removeSample() : api.loadSample());
            await refresh();
          }}
          className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-surface-2"
        >
          {hasSample ? "Remove sample data" : "Load sample data"}
        </button>
      </section>
    </div>
  );
}
