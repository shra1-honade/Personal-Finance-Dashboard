import "server-only";
import type { RemovedTransaction, Transaction as PlaidTransaction } from "plaid/legacy";
import { mapPlaidAccount, mapPlaidTransaction, plaid, plaidErrorCode, plaidErrorMessage } from "./plaid";
import {
  deleteTransactions,
  getPlaidItem,
  getPlaidItems,
  updatePlaidItemSync,
  upsertAccounts,
  upsertTransactions,
} from "./repo";

export interface SyncResult {
  itemId: string;
  institution: string;
  added: number;
  modified: number;
  removed: number;
  error?: string;
}

/**
 * Pull everything new for one linked institution using /transactions/sync
 * (cursor-based, so each call only fetches changes), then refresh balances.
 */
export async function syncItem(itemId: string): Promise<SyncResult> {
  const item = getPlaidItem(itemId);
  if (!item) throw new Error(`Unknown item ${itemId}`);
  const result: SyncResult = { itemId, institution: item.institution_name, added: 0, modified: 0, removed: 0 };

  try {
    // Balances first so transactions have an account to attach to.
    const accountsRes = await plaid().accountsGet({ access_token: item.access_token });
    upsertAccounts(accountsRes.data.accounts.map((a) => mapPlaidAccount(a, itemId, item.institution_name)));

    let cursor = item.cursor ?? undefined;
    let attempt = 0;
    for (;;) {
      const added: PlaidTransaction[] = [];
      const modified: PlaidTransaction[] = [];
      const removed: RemovedTransaction[] = [];
      let next = cursor;
      try {
        let hasMore = true;
        while (hasMore) {
          const res = await plaid().transactionsSync({ access_token: item.access_token, cursor: next, count: 500 });
          added.push(...res.data.added);
          modified.push(...res.data.modified);
          removed.push(...res.data.removed);
          hasMore = res.data.has_more;
          next = res.data.next_cursor;
        }
      } catch (err) {
        // Data changed mid-pagination: restart from the cursor we started with.
        if (plaidErrorCode(err) === "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION" && attempt++ < 3) continue;
        throw err;
      }
      upsertTransactions([...added, ...modified].map(mapPlaidTransaction));
      deleteTransactions(removed.map((r) => r.transaction_id).filter(Boolean) as string[]);
      result.added = added.length;
      result.modified = modified.length;
      result.removed = removed.length;
      cursor = next;
      break;
    }
    updatePlaidItemSync(itemId, cursor ?? null, null);
  } catch (err) {
    result.error = plaidErrorMessage(err);
    updatePlaidItemSync(itemId, null, result.error);
  }
  return result;
}

export async function syncAll(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const item of getPlaidItems()) results.push(await syncItem(item.item_id));
  return results;
}
