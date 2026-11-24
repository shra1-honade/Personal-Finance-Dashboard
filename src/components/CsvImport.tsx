"use client";
import { useState } from "react";
import { useFinance } from "@/lib/finance-store";
import { parseCsv, type CsvParseResult } from "@/lib/csv";
import { ACCOUNT_TYPE_LABELS, type AccountType } from "@/lib/types";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/format";

export function CsvImport() {
  const { data, api, refresh } = useFinance();
  const [text, setText] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [flip, setFlip] = useState(false);
  const [target, setTarget] = useState<string>("new");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<AccountType>("checking");
  const [newBalance, setNewBalance] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const result: CsvParseResult | null = text ? parseCsv(text, flip) : null;
  const targets = (data?.accounts ?? []).filter((a) => a.source !== "plaid");
  const input = "rounded-md border border-line bg-surface px-3 py-1.5 text-sm";

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setFileName(f.name);
          setText(await f.text());
          setStatus(null);
          if (!newName) setNewName(f.name.replace(/\.csv$/i, ""));
        }}
        className="block text-sm file:mr-3 file:rounded-md file:border file:border-line file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm"
      />
      {result && (
        <>
          <div className="text-sm text-ink-2">
            {fileName}: {result.rows.length} rows ready{result.skipped ? `, ${result.skipped} skipped (no date or amount)` : ""}.
            {!result.columns.date && <span className="text-negative"> Couldn&apos;t find a date column.</span>}
            {!result.columns.amount && !result.columns.debit && <span className="text-negative"> Couldn&apos;t find an amount column.</span>}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={flip} onChange={(e) => setFlip(e.target.checked)} />
            Purchases show as positive numbers in this file (common for credit cards)
          </label>
          {result.rows.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-line">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-line">
                  {result.rows.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 text-ink-2">{formatDate(r.date)}</td>
                      <td className="px-3 py-1.5">{r.description}</td>
                      <td className="px-3 py-1.5 text-ink-2">{r.category}</td>
                      <td className="tabular px-3 py-1.5 text-right">{money(r.amount, { sign: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <div className="mb-1 text-xs text-muted">Import into</div>
              <select value={target} onChange={(e) => setTarget(e.target.value)} className={input}>
                <option value="new">New account…</option>
                {targets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            {target === "new" && (
              <>
                <label className="text-sm">
                  <div className="mb-1 text-xs text-muted">Name</div>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} className={input} />
                </label>
                <label className="text-sm">
                  <div className="mb-1 text-xs text-muted">Type</div>
                  <select value={newType} onChange={(e) => setNewType(e.target.value as AccountType)} className={input}>
                    {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <div className="mb-1 text-xs text-muted">Current balance</div>
                  <input type="number" step="0.01" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} className={`${input} w-32`} />
                </label>
              </>
            )}
            <button
              disabled={!result.rows.length}
              onClick={async () => {
                try {
                  const res = await api.importCsv({
                    rows: result.rows,
                    ...(target === "new"
                      ? { newAccount: { name: newName || "Imported account", type: newType, balance: Number(newBalance) || 0 } }
                      : { accountId: target }),
                  });
                  setStatus(`Imported ${res.imported} transactions.`);
                  setText(null);
                  await refresh();
                } catch (e) {
                  setStatus(e instanceof Error ? e.message : String(e));
                }
              }}
              className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Import
            </button>
          </div>
        </>
      )}
      {status && <p className="text-sm text-ink-2">{status}</p>}
    </div>
  );
}
