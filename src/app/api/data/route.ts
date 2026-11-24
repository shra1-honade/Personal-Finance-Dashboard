import { getDashboard } from "@/server/repo";
import { handle, ok } from "@/server/http";

export const dynamic = "force-dynamic";

export const GET = handle(async () => ok(getDashboard()));
