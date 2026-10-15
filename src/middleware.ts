// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthed = req.cookies.get("gl_auth")?.value === "ok";

  // Se l'utente è già autenticato e visita /login, mandalo direttamente alla dashboard
  if (pathname === "/login") {
    if (isAuthed) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Se l'utente è autenticato, lascia passare
  if (isAuthed) {
    return NextResponse.next();
  }

  // Altrimenti redirigi al login
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Applica il middleware a tutte le rotte TRANNE:
     * - rotte API (/api/...)
     * - file statici Next.js (_next/static, _next/image)
     * - immagini, icone e file statici (.png, .jpg, .svg, .ico, .json, ecc.)
     */
    "/((?!api|_next/static|_next/image|favicon|manifest|.*\\.(?:png|jpg|jpeg|svg|webp|ico|json|css|js)$).*)",
  ],
};