// middleware.ts (sia in root che in src/)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // lascia passare login, asset Next, API e favicon
  if (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // se c'è il cookie, lascia passare
  const authed = req.cookies.get("gl_auth")?.value === "ok";
  if (authed) return NextResponse.next();

  // altrimenti redirigi al login
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}