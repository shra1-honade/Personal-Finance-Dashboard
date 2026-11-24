import "server-only";
import { NextResponse } from "next/server";

export function ok(data: unknown = { ok: true }) {
  return NextResponse.json(data);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wrap a route handler so thrown errors become JSON responses instead of HTML 500s. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (err) {
      console.error(err);
      return fail(err instanceof Error ? err.message : "Unexpected error", 500);
    }
  };
}
