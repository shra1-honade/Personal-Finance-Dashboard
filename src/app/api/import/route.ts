import { db } from "@/server/db";
import { upsertAccounts, upsertTransactions } from "@/server/repo";
import type { AccountType, Transaction } from "@/lib/types";
import { fail, handle, ok } from "@/server/http";

interface ImportBody {
  /** Existing account id, or details for a new account. */
  accountId?: string;
  newAccount?: { name: string; institution?: string; type: AccountType; balance: number };
  rows: { date: string; description: string; amount: number; category: string }[];
}

/** Stable id so re-importing the same CSV doesn't create duplicates. */
function rowId(accountId: string, r: ImportBody["rows"][number], n: number) {
  const key = `${accountId}|${r.date}|${r.amount.toFixed(2)}|${r.description.toLowerCase()}|${n}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return `csv-${(h >>> 0).toString(36)}`;
}

export const POST = handle(async (req: Request) => {
  const body = (await req.json()) as ImportBody;
  if (!Array.isArray(body.rows) || body.rows.length === 0) return fail("No rows to import");

  let accountId = body.accountId;
  if (!accountId) {
    const a = body.newAccount;
    if (!a?.name) return fail("Pick an account or name a new one");
    accountId = `csv-acct-${Date.now().toString(36)}`;
    const liability = a.type === "credit" || a.type === "loan";
    upsertAccounts([
      {
        id: accountId,
        name: a.name,
        institution: a.institution || "Imported",
        type: a.type,
        balance: liability ? -Math.abs(a.balance || 0) : a.balance || 0,
        source: "csv",
      },
    ]);
  } else if (!db().prepare("SELECT 1 FROM accounts WHERE id = ?").get(accountId)) {
    return fail("Unknown account", 404);
  }

  // Number repeated identical rows so genuine duplicates on the same day both survive.
  const seen = new Map<string, number>();
  const txs: Transaction[] = body.rows.map((r) => {
    const k = `${r.date}|${r.amount}|${r.description}`;
    const n = (seen.get(k) ?? 0) + 1;
    seen.set(k, n);
    return { id: rowId(accountId!, r, n), accountId: accountId!, ...r, source: "csv" };
  });
  upsertTransactions(txs);
  return ok({ imported: txs.length, accountId });
});
