import { syncAll, syncItem } from "@/server/sync";
import { handle, ok } from "@/server/http";

/** Body: { itemId?: string } — omit to sync every linked bank. */
export const POST = handle(async (req: Request) => {
  const { itemId } = (await req.json().catch(() => ({}))) as { itemId?: string };
  return ok({ results: itemId ? [await syncItem(itemId)] : await syncAll() });
});
