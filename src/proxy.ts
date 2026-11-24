import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional password gate. When APP_PASSWORD is set, every page and API call
 * requires HTTP Basic auth (any username, that password). Always set it if the
 * app is reachable from anywhere other than your own machine — the API can
 * read your bank data.
 */
export function proxy(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const supplied = decoded.slice(decoded.indexOf(":") + 1);
      if (safeEqual(supplied, password)) return NextResponse.next();
    } catch {
      /* fall through */
    }
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Personal Finance", charset="UTF-8"' },
  });
}

function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
