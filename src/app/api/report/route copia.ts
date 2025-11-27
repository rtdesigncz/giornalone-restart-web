// src/app/api/report/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

const PAGE_W = 842;
const PAGE_H = 595;
const M = 36;

const BRAND = rgb(0.102, 0.706, 0.722);
const SLATE = rgb(0.39, 0.45, 0.55);
const TEXT = rgb(0.1, 0.1, 0.1);
const ZEBRA = rgb(0.97, 0.98, 0.985);

const SECTIONS = [
  "TOUR SPONTANEI",
  "APPUNTAMENTI (Pianificazione)",
  "APPUNTAMENTI RINNOVI E INTEGRAZIONI",
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

// Parser booleani con supporto multi (Sì/No)
function parseBoolMulti(params: URLSearchParams, key: string): boolean | undefined {
  const vals = params.getAll(key).map((v) => v.toLowerCase());
  // nessuno o entrambi → undefined (niente filtro)
  if (vals.length === 0) return undefined;
  const hasTrue = vals.includes("true");
  const hasFalse = vals.includes("false");
  if (hasTrue && hasFalse) return undefined;
  if (hasTrue) return true;
  if (hasFalse) return false;
  return undefined;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "pdf").toLowerCase();

    // Date
    const date = url.searchParams.get("date") || undefined;
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    // Filtri multipli (array)
    const sections = url.searchParams.getAll("section");
    const consNames = url.searchParams.getAll("consulente");
    const tipoNames = url.searchParams.getAll("tipo_abbonamento");

    // Booleani (multi: sì/no)
    const presentato = parseBoolMulti(url.searchParams, "presentato");
    const venduto = parseBoolMulti(url.searchParams, "venduto");
    const miss = parseBoolMulti(url.searchParams, "miss");

    // 1) Opzioni per i menu (entries_v globale)
    const { data: allView, error: optErr } = await supabase
      .from("entries_v")
      .select("consulente_name, tipo_abbonamento_name");
    if (optErr) throw optErr;

    const setCons = new Set<string>();
    const setTipi = new Set<string>();
    (allView || []).forEach((r) => {
      if (r.consulente_name) setCons.add(r.consulente_name);
      if (r.tipo_abbonamento_name) setTipi.add(r.tipo_abbonamento_name);
    });
    const sort = (arr: string[]) =>
      [...arr].sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }));
    const consulentiOptions = sort(Array.from(setCons));
    const tipiOptions = sort(Array.from(setTipi));

    // 2) Query principale su entries_v (supporto IN per array)
    let qbView = supabase.from("entries_v").select("*");

    if (from && to) qbView = qbView.gte("entry_date", from).lte("entry_date", to);
    else if (date) qbView = qbView.eq("entry_date", date);
    else qbView = qbView.eq("entry_date", new Date().toISOString().slice(0, 10));

    if (sections.length) qbView = qbView.in("section", sections);
    if (venduto !== undefined) qbView = qbView.eq("venduto", venduto);
    if (miss !== undefined) qbView = qbView.eq("miss", miss);
    if (consNames.length) qbView = qbView.in("consulente_name", consNames);
    if (tipoNames.length) qbView = qbView.in("tipo_abbonamento_name", tipoNames);

    qbView = qbView.order("section", { ascending: true }).order("entry_time", { ascending: true });

    const { data: rowsView, error: errView } = await qbView;
    if (errView) throw errView;

    let rows = (rowsView ?? []) as any[];

    // 3) Filtro "presentato" incrociando con entries (se richiesto)
    if (presentato !== undefined) {
      let qbEntries = supabase.from("entries").select("id");
      if (from && to) qbEntries = qbEntries.gte("entry_date", from).lte("entry_date", to);
      else if (date) qbEntries = qbEntries.eq("entry_date", date);
      else qbEntries = qbEntries.eq("entry_date", new Date().toISOString().slice(0, 10));

      if (sections.length) qbEntries = qbEntries.in("section", sections);
      if (venduto !== undefined) qbEntries = qbEntries.eq("venduto", venduto);
      if (miss !== undefined) qbEntries = qbEntries.eq("miss", miss);
      qbEntries = qbEntries.eq("presentato", presentato);

      // restringo per nomi selezionati usando gli ID già presenti nella view
      if (consNames.length) {
        const possIds = Array.from(new Set(rows.map((r) => r.consulente_id).filter(Boolean)));
        if (possIds.length) qbEntries = qbEntries.in("consulente_id", possIds as any);
      }
      if (tipoNames.length) {
        const possIds = Array.from(new Set(rows.map((r) => r.tipo_abbonamento_id).filter(Boolean)));
        if (possIds.length) qbEntries = qbEntries.in("tipo_abbonamento_id", possIds as any);
      }

      const { data: idsRows, error: errIds } = await qbEntries;
      if (errIds) throw errIds;

      const allowed = new Set((idsRows ?? []).map((x: any) => x.id));
      rows = rows.filter((r) => allowed.has(r.id));
    }

    // Normalizzo al formato atteso dal client (unica dichiarazione!)
    const normalized = rows.map((r) => ({
      ...r,
      consulente: r.consulente_name ? { name: r.consulente_name } : null,
      tipo_abbonamento: r.tipo_abbonamento_name ? { name: r.tipo_abbonamento_name } : null,
    }));

    // 4) JSON (per la pagina Reportistica)
    if (format === "json") {
      const kpi = {
        totale: normalized.length,
        presentati: await (async () => {
          const ids = normalized.map((r) => r.id);
          if (!ids.length) return 0;
          const { data: pr, error: perr } = await supabase
            .from("entries")
            .select("id, presentato")
            .in("id", ids as any);
          if (perr || !pr) return 0;
          return pr.filter((x) => x.presentato).length;
        })(),
        venduti: normalized.filter((r) => r.venduto).length,
        miss: normalized.filter((r) => r.miss).length,
      };

      const setSez = new Set<string>([
        ...SECTIONS,
        ...normalized.map((r) => r.section).filter(Boolean),
      ]);
      const options = {
        sezioni: Array.from(setSez),
        consulenti: consulentiOptions,
        tipi_abbonamento: tipiOptions,
      };

      return NextResponse.json({ rows: normalized, meta: { options, kpi } }, { status: 200 });
    }

    // 5) PDF (riusa "normalized")
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
    const hr = (page: any, y: number) =>
      page.drawLine({
        start: { x: M, y },
        end: { x: PAGE_W - M, y },
        thickness: 0.7,
        color: rgb(0.9, 0.9, 0.9),
      });

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
    const TABLE_W = columns.reduce((a, c) => a + c.width, 0);
    const ROW_H = 16;
    const ROW_GAP = 2;

    let page = addPage();
    let y = PAGE_H - M;

    const drawPageHeader = () => {
      if (logoImg) {
        const logoW = 120;
        const ratio = logoImg.height / logoImg.width;
        const logoH = logoW * ratio;
        page.drawImage(logoImg, { x: M, y: y - logoH + 8, width: logoW, height: logoH });
        drawText(page, "Giornalone Restart", M + logoW + 14, y - 6, {
          size: 18,
          bold: true,
          color: BRAND,
        });
      } else {
        drawText(page, "Giornalone Restart", M, y - 6, {
          size: 18,
          bold: true,
          color: BRAND,
        });
      }
      const when = date
        ? `Report del ${formatDateItalian(date)}`
        : `Report dal ${formatDateItalian(from!)} al ${formatDateItalian(to!)}`;
      drawText(page, when, PAGE_W - 220, y - 6, { size: 11, color: SLATE });
      y -= 40;
      hr(page, y);
      y -= 20;
    };
    const drawSectionHeader = (section: string, cont = false) => {
      drawText(page, cont ? `${section} (continua)` : section, M, y, {
        size: 13,
        bold: true,
        color: BRAND,
      });
      y -= 18;
      let cx = M;
      for (const c of columns) {
        drawText(page, c.label, cx + 2, y, { size: 9.5, bold: true, color: SLATE });
        cx += c.width;
      }
      y -= 10;
    };
    const needSpace = (h: number) => y - h < M;
    const newPaged = (section: string, cont = true) => {
      page = addPage();
      y = PAGE_H - M;
      drawPageHeader();
      drawSectionHeader(section, cont);
    };

    drawPageHeader();

    for (const sectionName of SECTIONS) {
      const subset = normalized.filter((r: any) => r.section === sectionName);

      if (subset.length === 0) {
        if (needSpace(18)) newPaged(sectionName, true);
        drawText(page, sectionName, M, y, { size: 13, bold: true, color: BRAND });
        y -= 18;
        drawText(page, "Nessun dato per questa sezione.", M, y, { size: 10, color: SLATE });
        y -= 20;
        continue;
      }

      if (needSpace(18 + 10 + 8)) newPaged(sectionName, true);
      drawSectionHeader(sectionName, false);

      let rowIndex = 0;
      for (const r of subset) {
        if (needSpace(ROW_H + ROW_GAP)) newPaged(sectionName, true);

        const zebraOn = rowIndex % 2 === 1;
        if (zebraOn) {
          page.drawRectangle({
            x: M - 2,
            y: y - ROW_H,
            width: TABLE_W + 4,
            height: ROW_H,
            color: ZEBRA,
          });
        }

        let cx2 = M;
        const dataRow = [
          toHHMM(r.entry_time),
          r.nome ?? "",
          r.cognome ?? "",
          r.telefono ?? "",
          r.consulente?.name ?? "",
          r.tipo_abbonamento?.name ?? "",
          r.miss ? "Si" : "",
          r.venduto ? "Si" : "",
        ];

        for (let i = 0; i < columns.length; i++) {
          page.drawText(String(dataRow[i] ?? ""), {
            x: cx2 + 2,
            y: y - 4,
            size: 9.5,
            color: TEXT,
            font: font,
          });
          cx2 += columns[i].width;
        }

        y -= ROW_H + ROW_GAP;
        rowIndex++;
      }

      y -= 12;
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="giornalone_report_${
          date ? date : `${from}_to_${to}`
        }.pdf"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}