import { setBudgets } from "@/server/repo";
import type { Budget } from "@/lib/types";
import { fail, handle, ok } from "@/server/http";

/** Body: Budget[] — replaces all budgets. */
export const PUT = handle(async (req: Request) => {
  const body = (await req.json()) as Budget[];
  if (!Array.isArray(body)) return fail("Expected an array of budgets");
  setBudgets(body.filter((b) => b && typeof b.category === "string" && Number.isFinite(b.limit)));
  return ok();
});
