import { exchangePublicToken, plaidErrorMessage } from "@/server/plaid";
import { savePlaidItem } from "@/server/repo";
import { syncItem } from "@/server/sync";
import { fail, handle, ok } from "@/server/http";

/** Body: { publicToken, institutionName } from Plaid Link's onSuccess. */
export const POST = handle(async (req: Request) => {
  const { publicToken, institutionName } = (await req.json()) as { publicToken?: string; institutionName?: string };
  if (!publicToken) return fail("publicToken is required");
  try {
    const { accessToken, itemId } = await exchangePublicToken(publicToken);
    savePlaidItem(itemId, accessToken, institutionName?.trim() || "Linked bank");
    return ok({ itemId, sync: await syncItem(itemId) });
  } catch (err) {
    return fail(plaidErrorMessage(err), 502);
  }
});
