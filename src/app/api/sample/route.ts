import { loadSampleData, removeSampleData } from "@/server/repo";
import { handle, ok } from "@/server/http";

export const POST = handle(async () => {
  loadSampleData();
  return ok();
});

export const DELETE = handle(async () => {
  removeSampleData();
  return ok();
});
