import { setTransactionCategory } from "@/server/repo";
import { fail, handle, ok } from "@/server/http";

/** Body: { category } — re-categorise one transaction. Future syncs keep your choice. */
export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const { category } = (await req.json()) as { category?: string };
  if (!category) return fail("category is required");
  setTransactionCategory(id, category);
  return ok();
});
