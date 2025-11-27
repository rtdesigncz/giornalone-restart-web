// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const U = process.env.AUTH_USERNAME || "restart";
  const P = process.env.AUTH_PASSWORD || "restart";

  if (!U || !P) {
    return NextResponse.json(
      { ok: false, error: "Credenziali non configurate sul server." },
      { status: 500 }
    );
  }

  if (username === U && password === P) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("gl_auth", "ok", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
    });
    return res;
  }

  return NextResponse.json(
    { ok: false, error: "Credenziali errate" },
    { status: 401 }
  );
}