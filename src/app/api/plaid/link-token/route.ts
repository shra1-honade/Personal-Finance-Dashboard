import { createLinkToken, plaidErrorMessage } from "@/server/plaid";
import { getPlaidItem } from "@/server/repo";
import { fail, handle, ok } from "@/server/http";

/** Body: { itemId?: string } — pass itemId to re-authenticate an existing bank (update mode). */
export const POST = handle(async (req: Request) => {
  const { itemId } = (await req.json().catch(() => ({}))) as { itemId?: string };
  const accessToken = itemId ? getPlaidItem(itemId)?.access_token : undefined;
  if (itemId && !accessToken) return fail("Unknown bank connection", 404);
  try {
    return ok({ linkToken: await createLinkToken(accessToken) });
  } catch (err) {
    return fail(plaidErrorMessage(err), 502);
  }
});
