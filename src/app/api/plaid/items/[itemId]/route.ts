import { plaid } from "@/server/plaid";
import { deletePlaidItem, getPlaidItem } from "@/server/repo";
import { fail, handle, ok } from "@/server/http";

/** Disconnect a bank: revoke the access token at Plaid, then delete its accounts and transactions locally. */
export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ itemId: string }> }) => {
  const { itemId } = await ctx.params;
  const item = getPlaidItem(itemId);
  if (!item) return fail("Unknown bank connection", 404);
  try {
    await plaid().itemRemove({ access_token: item.access_token });
  } catch (err) {
    console.warn("itemRemove failed; deleting locally anyway", err);
  }
  deletePlaidItem(itemId);
  return ok();
});
