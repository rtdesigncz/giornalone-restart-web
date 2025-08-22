// src/pages/api/report.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import PdfPrinter from "pdfmake";
import * as vfsFonts from "pdfmake/build/vfs_fonts";

const SB_URL = process.env.SB_URL!;
const SB_SERVICE_ROLE_KEY = process.env.SB_SERVICE_ROLE_KEY!;
const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY);

const fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};
const printer = new PdfPrinter(fonts);
;(printer as any).vfs = (vfsFonts as any).pdfMake.vfs;

const SECTIONS = [
  "TOUR SPONTANEI",
  "APPUNTAMENTI RINNOVI E INTEGRAZIONI",
  "APPUNTAMENTI (Pianificazione)",
  "APPUNTAMENTI VERIFICHE DEL BISOGNO",
];

function toHHMM(t?: string | null) {
  if (!t) return "";
  const [hh, mm] = t.split(":");
  return `${hh}:${mm}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const date = (req.query.date as string) ?? new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("entries")
      .select(
        `*,
         consulente:consulenti(*),
         tipo_abbonamento:tipi_abbonamento(*)`
      )
      .eq("entry_date", date)
      .order("section")
      .order("entry_time");

    if (error) throw error;
    const rows = data ?? [];

    const countTour = rows.filter(r => r.section === "TOUR SPONTANEI").length;
    const countMiss = rows.filter(r => r.miss).length;
    const countVenduti = rows.filter(r => r.venduto).length;

    const sectionBlocks = SECTIONS.map((section, idx) => {
      const subset = rows.filter((r: any) => r.section === section);

      const body = [
        [
          { text: "Ora", bold: true },
          { text: "Nome", bold: true },
          { text: "Cognome", bold: true },
          { text: "Telefono", bold: true },
          { text: "Consulente", bold: true },
          { text: "Tipo Abb.", bold: true },
          { text: "Miss", bold: true },
          { text: "Venduto", bold: true },
        ],
        ...subset.map((r: any) => [
          toHHMM(r.entry_time),
          r.nome ?? "",
          r.cognome ?? "",
          r.telefono ?? "",
          r?.consulente?.name ?? r?.consulente?.nome ?? "",
          r?.tipo_abbonamento?.name ?? r?.tipo_abbonamento?.nome ?? "",
          r.miss ? "✔︎" : "",
          r.venduto ? "✔︎" : "",
        ]),
      ];

      return [
        {
          text: section,
          style: "sectionHeader",
          margin: [0, idx === 0 ? 10 : 20, 0, 8],
          pageBreak: idx === 0 ? undefined : "before",
        },
        subset.length
          ? {
              table: {
                headerRows: 1,
                widths: ["auto", "*", "*", "auto", "*", "*", "auto", "auto"],
                body,
              },
              layout: "lightHorizontalLines",
            }
          : {
              text: "Nessun dato per questa sezione.",
              color: "#64748b",
            },
      ];
    }).flat();

    const docDef: any = {
      pageMargins: [28, 36, 28, 36],
      defaultStyle: { font: "Roboto", fontSize: 10, color: "#0f172a" },
      content: [
        {
          columns: [
            { text: "Giornalone Restart", style: "header" },
            { text: `Report del ${date}`, alignment: "right", color: "#64748b" },
          ],
          margin: [0, 0, 0, 12],
        },
        { text: "Riepiloghi", style: "sectionHeader", margin: [0, 0, 0, 6] },
        {
          columns: [
            { text: `Tour Spontanei: ${countTour}` },
            { text: `Miss: ${countMiss}` },
            { text: `Venduti: ${countVenduti}` },
          ],
          columnGap: 12,
          margin: [0, 0, 0, 12],
        },
        ...sectionBlocks,
      ],
      styles: {
        header: { fontSize: 18, bold: true, color: "#1AB4B8" },
        sectionHeader: { fontSize: 13, bold: true, color: "#1AB4B8" },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDef);
    const chunks: Buffer[] = [];
    pdfDoc.on("data", (c) => chunks.push(c as Buffer));
    pdfDoc.on("end", () => {
      const buf = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="giornalone_report_${date}.pdf"`
      );
      res.send(buf);
    });
    pdfDoc.end();
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
}