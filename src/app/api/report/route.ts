// src/app/api/report/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DB_SECTIONS, getSectionLabel } from "@/lib/sections";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const SECTIONS = DB_SECTIONS;

// --- Helpers tolleranti ---
function toHHMM(t?: string | null) {
  if (!t) return "";
  const [hh = "", mm = ""] = String(t).split(":");
  return hh && mm ? `${hh}:${mm}` : String(t);
}
function formatDateItalian(d?: string | null) {
  if (!d) return "";
  const [y = "", m = "", g = ""] = d.split("-");
  return y && m && g ? `${g}-${m}-${y}` : d;
}

// Parser booleani con supporto multi (Sì/No)
function parseBoolMulti(params: URLSearchParams, key: string): boolean | undefined {
  const vals = params.getAll(key).map((v) => v.toLowerCase());
  if (vals.length === 0) return undefined;
  const hasTrue = vals.includes("true");
  const hasFalse = vals.includes("false");
  if (hasTrue && hasFalse) return undefined;
  if (hasTrue) return true;
  if (hasFalse) return false;
  return undefined;
}

export async function GET(req: Request) {
  const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);
  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "pdf").toLowerCase();

    // Date di input (possono anche mancare)
    const date = url.searchParams.get("date") || undefined;
    const from = url.searchParams.get("from") || undefined;
    const to = url.searchParams.get("to") || undefined;

    const todayISO = new Date().toISOString().slice(0, 10);
    const hasRange = Boolean(from && to);

    // Filtri multipli (array)
    const sections = url.searchParams.getAll("section");
    const consNames = url.searchParams.getAll("consulente");
    const tipoNames = url.searchParams.getAll("tipo_abbonamento");

    // Booleani (multi: sì/no)
    const presentato = parseBoolMulti(url.searchParams, "presentato");
    const venduto = parseBoolMulti(url.searchParams, "venduto");
    const miss = parseBoolMulti(url.searchParams, "miss");
    const contattato = parseBoolMulti(url.searchParams, "contattato");
    const negativo = parseBoolMulti(url.searchParams, "negativo");
    const assente = parseBoolMulti(url.searchParams, "assente");

    // 1) Opzioni per i menu (query diretta su tabelle per sicurezza)
    const { data: allCons, error: errCons } = await supabase.from("consulenti").select("name").order("name");
    const { data: allTipi, error: errTipi } = await supabase.from("tipi_abbonamento").select("name").order("name");

    if (errCons) throw errCons;
    if (errTipi) throw errTipi;

    const consulentiOptions = (allCons || []).map((c: any) => c.name);
    const tipiOptions = (allTipi || []).map((t: any) => t.name);

    // 2) Query principale su entries (bypass view)
    // Costruisco select dinamica per usare !inner se filtro per nome
    let selCons = "consulenti(name)";
    let selTipi = "tipi_abbonamento(name)";

    if (consNames.length > 0) selCons = "consulenti!inner(name)";
    if (tipoNames.length > 0) selTipi = "tipi_abbonamento!inner(name)";

    let qbView = supabase.from("entries").select(`*, ${selCons}, ${selTipi}`);

    if (hasRange) qbView = qbView.gte("entry_date", from!).lte("entry_date", to!);
    else if (date) qbView = qbView.eq("entry_date", date);
    else qbView = qbView.eq("entry_date", todayISO);

    // Helper per filtri booleani (false include null)
    const applyBoolFilter = (qb: any, col: string, val: boolean | undefined) => {
      if (val === true) return qb.eq(col, true);
      if (val === false) return qb.or(`${col}.eq.false,${col}.is.null`);
      return qb;
    };

    if (sections.length) qbView = qbView.in("section", sections);

    qbView = applyBoolFilter(qbView, "venduto", venduto);
    qbView = applyBoolFilter(qbView, "miss", miss);
    qbView = applyBoolFilter(qbView, "contattato", contattato);
    qbView = applyBoolFilter(qbView, "negativo", negativo);
    qbView = applyBoolFilter(qbView, "presentato", presentato);
    qbView = applyBoolFilter(qbView, "assente", assente);

    if (consNames.length) qbView = qbView.in("consulenti.name", consNames);
    if (tipoNames.length) qbView = qbView.in("tipi_abbonamento.name", tipoNames);

    qbView = qbView.order("section", { ascending: true }).order("entry_time", { ascending: true }).limit(10000);

    const { data: rowsView, error: errView } = await qbView;
    if (errView) throw errView;

    let rows = (rowsView ?? []) as any[];

    // Normalizzo al formato atteso dal client
    // Con la query diretta, consulente è già un oggetto { name: ... } o null
    const normalized = rows.map((r) => ({
      ...r,
      consulente: r.consulenti, // Supabase restituisce l'alias della tabella se non rinominato, o il nome della relazione
      tipo_abbonamento: r.tipi_abbonamento,
      // Mappo anche i nomi piatti per compatibilità se servono altrove, ma il client usa .consulente.name
      consulente_name: r.consulenti?.name,
      tipo_abbonamento_name: r.tipi_abbonamento?.name,
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
          return pr.filter((x: any) => x.presentato).length;
        })(),
        venduti: normalized.filter((r) => r.venduto).length,
        miss: normalized.filter((r) => r.miss).length,
        assenti: normalized.filter((r) => r.assente).length,
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

    // 5) PDF (riusa "normalized") - Refactored to use jsPDF for consistency with Dashboard
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Logo
    const logoUrl = "https://iili.io/FsM5Q3v.png";
    try {
      const resp = await fetch(logoUrl);
      const buf = await resp.arrayBuffer();
      const base64 = Buffer.from(buf).toString('base64');

      // Calculate aspect ratio
      const maxW = 50;
      const maxH = 15;
      // Approximate ratio for the logo if we can't load Image in Node easily without canvas
      // Or just use fixed dimensions that look good
      doc.addImage(base64, 'PNG', pageWidth - 50 - 14, 10, 50, 15);
    } catch (e) {
      console.error("Could not load logo for PDF", e);
    }

    // Title
    const dateFormatted = date
      ? new Date(date).toLocaleDateString("it-IT", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : hasRange
        ? `Dal ${new Date(from!).toLocaleDateString("it-IT")} al ${new Date(to!).toLocaleDateString("it-IT")}`
        : new Date().toLocaleDateString("it-IT", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(hasRange ? "Report Periodo" : "Report Giornaliero", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1), 14, 28);

    let currentY = 40;

    // Group by Section
    const sectionsOrder = SECTIONS; // Use the imported constant

    sectionsOrder.forEach(sectionKey => {
      const sectionEntries = normalized.filter((e: any) => e.section === sectionKey);

      if (sectionEntries.length > 0) {
        // Section Header
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(getSectionLabel(sectionKey), 14, currentY);
        currentY += 4;

        // Table Body
        const tableBody = sectionEntries.map((e: any) => {
          const dateStr = e.entry_date ? new Date(e.entry_date).toLocaleDateString("it-IT") : "-";
          const time = e.entry_time ? e.entry_time.slice(0, 5) : "-";
          const client = `${e.nome || ""} ${e.cognome || ""}`;
          const consultant = e.consulente?.name || "-";
          const type = e.tipo_abbonamento?.name || "-";

          // Status Logic (Same as Dashboard)
          let status = "";
          if (sectionKey === "APPUNTAMENTI TELEFONICI") {
            status = e.contattato ? "COMPLETATO" : "DA CHIAMARE";
          } else {
            if (e.venduto) status = "VENDUTO";
            else if (e.miss) status = "MISS CON APP.";
            else if (e.negativo) status = "NEGATIVO";
            else if (e.presentato) status = "PRESENTATO";
            else if (e.assente) status = "ASSENTE";
          }

          if (sectionKey === "APPUNTAMENTI TELEFONICI") {
            return [dateStr, time, client, consultant, e.telefono || "-", status];
          } else {
            return [dateStr, time, client, consultant, type, status];
          }
        });

        // Table Headers
        let headers = ["Data", "Ora", "Cliente", "Consulente", "Tipo Abb.", "Esito"];
        if (sectionKey === "APPUNTAMENTI TELEFONICI") {
          headers = ["Data", "Ora", "Cliente", "Consulente", "Telefono", "Stato"];
        }

        autoTable(doc, {
          startY: currentY,
          head: [headers],
          body: tableBody,
          theme: 'grid',
          headStyles: { fillColor: [33, 181, 186], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 3 },
          alternateRowStyles: { fillColor: [255, 255, 255] },
          margin: { top: 10 },
          didParseCell: (data: any) => {
            if (data.section === 'body') {
              const row = data.row;
              const status = row.raw[row.raw.length - 1]; // Last column is always Status/Esito

              if (status === "VENDUTO") {
                data.cell.styles.fillColor = [209, 250, 229]; // emerald-100
              } else if (status === "MISS CON APP.") {
                data.cell.styles.fillColor = [255, 237, 213]; // orange-100
              } else if (status === "ASSENTE") {
                data.cell.styles.fillColor = [254, 249, 195]; // yellow-100
              } else if (status === "NEGATIVO") {
                data.cell.styles.fillColor = [254, 226, 226]; // red-100
              } else if (status === "PRESENTATO") {
                data.cell.styles.fillColor = [209, 250, 229]; // emerald-100 (Light Green)
              } else if (status === "COMPLETATO") {
                data.cell.styles.fillColor = [220, 252, 231]; // green-100
              }
            }
          }
        });

        // Update Y
        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 15;
      }
    });

    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Report_${date || 'export'}.pdf"`,
      },
    });
  } catch (e: any) {
    // Ritorna sempre JSON con errore leggibile lato client
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}