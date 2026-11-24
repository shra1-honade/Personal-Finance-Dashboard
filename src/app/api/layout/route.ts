import { getSetting, setSetting } from "@/server/repo";
import { fail, handle, ok } from "@/server/http";

export const dynamic = "force-dynamic";

/** The dashboard layout lives in the database so it follows you across devices. */
export const GET = handle(async () => ok({ layout: getSetting("dashboard-layout") }));

export const PUT = handle(async (req: Request) => {
  const body = (await req.json()) as { items?: unknown };
  if (!body || !Array.isArray(body.items)) return fail("Expected { items: [...] }");
  setSetting("dashboard-layout", { items: body.items });
  return ok();
});
