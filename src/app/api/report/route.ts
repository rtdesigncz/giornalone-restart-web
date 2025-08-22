// src/app/api/report/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const SB_URL = process.env.SB_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SB_SERVICE_ROLE_KEY!;
const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

// A4 landscape
const PAGE_W = 842;
const PAGE_H = 595;
const M = 36;

const BRAND = rgb(0.102, 0.706, 0.722); // #1AB4B8
const SLATE = rgb(0.39, 0.45, 0.55);
const TEXT = rgb(0.1, 0.1, 0.1);

const SECTIONS = [
  "TOUR SPONTANEI",
  "APPUNTAMENTI RINNOVI E INTEGRAZIONI",
  "APPUNTAMENTI (Pianificazione)",
  "APPUNTAMENTI VERIFICHE DEL BISOGNO",
];

function toHHMM(t?: string | null) {
  if (!t) return "";
  const [hh, mm] = String(t).split(":");
  return `${hh}:${mm}`;
}

function formatDateItalian(d: string) {
  const [y, m, g] = d.split("-");
  return `${g}-${m}-${y}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("entries")
      .select(
        `*,
         consulente:consulenti(*),
         tipo_abbonamento:tipi_abbonamento(*)`
      )
      .eq("entry_date", date)
      .order("section", { ascending: true })
      .order("entry_time", { ascending: true });

    if (error) throw error;
    const rows = data ?? [];

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const logoUrl = "https://iili.io/FsM5Q3v.png";
    let logoImg: any = null;
    try {
      const resp = await fetch(logoUrl);
      const buf = await resp.arrayBuffer();
      logoImg = await pdf.embedPng(buf);
    } catch {}

    const addPage = () => pdf.addPage([PAGE_W, PAGE_H]);

    const drawText = (
      page: any,
      text: string,
      x: number,
      y: number,
      opts?: { size?: number; color?: any; bold?: boolean }
    ) => {
      const size = opts?.size ?? 10;
      const color = opts?.color ?? TEXT;
      const f = opts?.bold ? fontBold : font;
      page.drawText(text, { x, y, size, color, font: f });
    };

    const hr = (page: any, y: number) => {
      page.drawLine({
        start: { x: M, y },
        end: { x: PAGE_W - M, y },
        thickness: 0.7,
        color: rgb(0.9, 0.9, 0.9),
      });
    };

    // colonne ottimizzate
    const columns = [
      { label: "Ora", width: 55 },
      { label: "Nome", width: 115 },
      { label: "Cognome", width: 115 },
      { label: "Telefono", width: 100 },
      { label: "Consulente", width: 120 },
      { label: "Tipo Abb.", width: 120 },
      { label: "Miss", width: 50 },
      { label: "Venduto", width: 60 },
    ];

    let page = addPage();
    let y = PAGE_H - M;

    // Header
    if (logoImg) {
      const logoW = 120;
      const ratio = logoImg.height / logoImg.width;
      const logoH = logoW * ratio;
      page.drawImage(logoImg, { x: M, y: y - logoH + 8, width: logoW, height: logoH });
      drawText(page, "Giornalone Restart", M + logoW + 14, y - 6, { size: 18, bold: true, color: BRAND });
    }

    drawText(page, `Report del ${formatDateItalian(date)}`, PAGE_W - 160, y - 6, {
      size: 11,
      color: SLATE,
    });

    y -= 40;
    hr(page, y);
    y -= 20;

    // sezioni
    for (const section of SECTIONS) {
      drawText(page, section, M, y, { size: 13, bold: true, color: BRAND });
      y -= 18;

      const subset = rows.filter((r: any) => r.section === section);
      if (subset.length === 0) {
        drawText(page, "Nessun dato per questa sezione.", M, y, { size: 10, color: SLATE });
        y -= 20;
        continue;
      }

      // intestazioni
      let cx = M;
      for (const c of columns) {
        drawText(page, c.label, cx + 2, y, { size: 9.5, bold: true, color: SLATE });
        cx += c.width;
      }
      y -= 12;
      hr(page, y);
      y -= 8;

      // righe
      for (const r of subset) {
        let cx2 = M;
        const dataRow = [
          toHHMM(r.entry_time),
          r.nome ?? "",
          r.cognome ?? "",
          r.telefono ?? "",
          r.consulente?.name ?? r.consulente?.nome ?? "",
          r.tipo_abbonamento?.name ?? r.tipo_abbonamento?.nome ?? "",
          r.miss ? "Si" : "",
          r.venduto ? "Si" : "",
        ];
        for (let i = 0; i < columns.length; i++) {
          drawText(page, dataRow[i], cx2 + 2, y, { size: 9.5 });
          cx2 += columns[i].width;
        }
        y -= 18;
        hr(page, y);
        y -= 6;
      }
      y -= 20; // margine extra tra sezioni
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="giornalone_report_${date}.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}