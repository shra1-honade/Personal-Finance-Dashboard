import { db } from "@/server/db";
import { deleteAccount } from "@/server/repo";
import { fail, handle, ok } from "@/server/http";

/** Delete a manual or CSV account. Linked (Plaid) accounts are removed by disconnecting the bank. */
export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const row = db().prepare("SELECT source FROM accounts WHERE id = ?").get(id) as { source: string } | undefined;
  if (!row) return fail("Unknown account", 404);
  if (row.source === "plaid") return fail("Disconnect the bank to remove linked accounts");
  deleteAccount(id);
  return ok();
});
