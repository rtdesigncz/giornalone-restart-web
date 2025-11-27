import { NextResponse } from "next/server";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const to = String(body?.to ?? "").trim();

    // Diagnostica env
    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { ok: false, where: "env", error: "RESEND_API_KEY MISSING" },
        { status: 500 }
      );
    }
    if (!FROM_EMAIL) {
      return NextResponse.json(
        { ok: false, where: "env", error: "FROM_EMAIL MISSING" },
        { status: 500 }
      );
    }
    if (!to) {
      return NextResponse.json(
        { ok: false, where: "input", error: "Missing 'to' in JSON body" },
        { status: 400 }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    // Invio minimale
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Test Giornalone ✅",
      html: `<div style="font-family:sans-serif">Test invio Resend OK</div>`,
    });

    if (error) {
      return NextResponse.json({ ok: false, where: "resend", error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, where: "catch", error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

export async function GET() {
  // per vedere rapidamente le env lato server
  return NextResponse.json({
    RESEND_API_KEY: RESEND_API_KEY ? "present (hidden)" : "MISSING",
    FROM_EMAIL: FROM_EMAIL ?? "MISSING",
  });
}