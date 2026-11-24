import "server-only";
import { db } from "./db";
import type { Account, Budget, DashboardPayload, LinkedInstitution, Transaction } from "@/lib/types";
import { generateSampleData, SAMPLE_BUDGETS } from "@/lib/sample-data";
import { plaidEnvName, isPlaidConfigured } from "./plaid";

/* ---------- reads ---------- */

interface AccountRow {
  id: string;
  item_id: string | null;
  name: string;
  institution: string;
  type: Account["type"];
  balance: number;
  mask: string | null;
  source: Account["source"];
}

interface TxRow {
  id: string;
  account_id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  pending: number;
  source: Transaction["source"];
}

export function getDashboard(): DashboardPayload {
  const d = db();
  const accounts = (d.prepare("SELECT * FROM accounts ORDER BY institution, name").all() as AccountRow[]).map(
    (r): Account => ({
      id: r.id,
      itemId: r.item_id,
      name: r.name,
      institution: r.institution,
      type: r.type,
      balance: r.balance,
      mask: r.mask,
      source: r.source,
    }),
  );
  const transactions = (d.prepare("SELECT * FROM transactions ORDER BY date DESC, id").all() as TxRow[]).map(
    (r): Transaction => ({
      id: r.id,
      accountId: r.account_id,
      date: r.date,
      description: r.description,
      amount: r.amount,
      category: r.category,
      pending: !!r.pending,
      source: r.source,
    }),
  );
  const budgets = (d.prepare("SELECT category, limit_amount FROM budgets ORDER BY category").all() as {
    category: string;
    limit_amount: number;
  }[]).map((r): Budget => ({ category: r.category, limit: r.limit_amount }));
  const institutions = (d
    .prepare("SELECT item_id, institution_name, last_synced_at, error FROM plaid_items ORDER BY created_at")
    .all() as { item_id: string; institution_name: string; last_synced_at: string | null; error: string | null }[]).map(
    (r): LinkedInstitution => ({
      itemId: r.item_id,
      institutionName: r.institution_name,
      lastSyncedAt: r.last_synced_at,
      error: r.error,
    }),
  );
  return {
    accounts,
    transactions,
    budgets,
    institutions,
    plaidConfigured: isPlaidConfigured(),
    plaidEnv: isPlaidConfigured() ? plaidEnvName() : null,
  };
}

/* ---------- writes ---------- */

export function upsertAccounts(accounts: Account[]) {
  const stmt = db().prepare(`
    INSERT INTO accounts (id, item_id, name, institution, type, balance, mask, source)
    VALUES (@id, @itemId, @name, @institution, @type, @balance, @mask, @source)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, institution = excluded.institution, type = excluded.type,
      balance = excluded.balance, mask = excluded.mask
  `);
  db().transaction(() => {
    for (const a of accounts) stmt.run({ ...a, itemId: a.itemId ?? null, mask: a.mask ?? null });
  })();
}

/** Insert or update transactions. A category you set by hand is never overwritten. */
export function upsertTransactions(txs: Transaction[]) {
  const stmt = db().prepare(`
    INSERT INTO transactions (id, account_id, date, description, amount, category, pending, source)
    VALUES (@id, @accountId, @date, @description, @amount, @category, @pending, @source)
    ON CONFLICT(id) DO UPDATE SET
      account_id = excluded.account_id, date = excluded.date, description = excluded.description,
      amount = excluded.amount, pending = excluded.pending,
      category = CASE WHEN transactions.category_locked = 1 THEN transactions.category ELSE excluded.category END
  `);
  db().transaction(() => {
    for (const t of txs) stmt.run({ ...t, pending: t.pending ? 1 : 0 });
  })();
}

export function deleteTransactions(ids: string[]) {
  const stmt = db().prepare("DELETE FROM transactions WHERE id = ?");
  db().transaction(() => ids.forEach((id) => stmt.run(id)))();
}

export function setTransactionCategory(id: string, category: string) {
  db().prepare("UPDATE transactions SET category = ?, category_locked = 1 WHERE id = ?").run(category, id);
}

export function setBudgets(budgets: Budget[]) {
  const d = db();
  d.transaction(() => {
    d.prepare("DELETE FROM budgets").run();
    const stmt = d.prepare("INSERT INTO budgets (category, limit_amount) VALUES (?, ?)");
    for (const b of budgets) if (b.limit > 0) stmt.run(b.category, b.limit);
  })();
}

export function loadSampleData() {
  const data = generateSampleData();
  removeSampleData();
  upsertAccounts(data.accounts);
  upsertTransactions(data.transactions);
  const hasBudgets = (db().prepare("SELECT COUNT(*) AS n FROM budgets").get() as { n: number }).n > 0;
  if (!hasBudgets) setBudgets(SAMPLE_BUDGETS);
}

export function removeSampleData() {
  db().prepare("DELETE FROM accounts WHERE source = 'sample'").run();
}

export function deleteAccount(id: string) {
  db().prepare("DELETE FROM accounts WHERE id = ?").run(id);
}

/* ---------- Plaid items ---------- */

export interface PlaidItemRow {
  item_id: string;
  access_token: string;
  institution_name: string;
  cursor: string | null;
}

export function savePlaidItem(itemId: string, accessToken: string, institutionName: string) {
  db()
    .prepare(
      `INSERT INTO plaid_items (item_id, access_token, institution_name) VALUES (?, ?, ?)
       ON CONFLICT(item_id) DO UPDATE SET access_token = excluded.access_token, institution_name = excluded.institution_name`,
    )
    .run(itemId, accessToken, institutionName);
}

export function getPlaidItems(): PlaidItemRow[] {
  return db().prepare("SELECT item_id, access_token, institution_name, cursor FROM plaid_items").all() as PlaidItemRow[];
}

export function getPlaidItem(itemId: string): PlaidItemRow | undefined {
  return db()
    .prepare("SELECT item_id, access_token, institution_name, cursor FROM plaid_items WHERE item_id = ?")
    .get(itemId) as PlaidItemRow | undefined;
}

export function updatePlaidItemSync(itemId: string, cursor: string | null, error: string | null) {
  db()
    .prepare(
      `UPDATE plaid_items SET cursor = COALESCE(?, cursor), error = ?,
       last_synced_at = CASE WHEN ? IS NULL THEN datetime('now') ELSE last_synced_at END WHERE item_id = ?`,
    )
    .run(cursor, error, error, itemId);
}

export function deletePlaidItem(itemId: string) {
  db().prepare("DELETE FROM plaid_items WHERE item_id = ?").run(itemId);
}
