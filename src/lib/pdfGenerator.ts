import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabaseClient";
import { DB_SECTIONS, getSectionLabel } from "@/lib/sections";

export const generateDailyReport = async (date: string) => {
    try {
        // 1. Fetch Data
        // 1. Fetch Data
        const { data: rawEntries, error } = await supabase
            .from("entries")
            .select(`
                *,
                consulente:consulenti(name),
                tipo_abbonamento:tipi_abbonamento(name)
            `)
            .eq("entry_date", date)
            .order("section", { ascending: true }) // Order by section first
            .order("entry_time", { ascending: true });

        if (error) throw error;
        if (!rawEntries || rawEntries.length === 0) {
            alert("Nessun dato trovato per la data selezionata.");
            return;
        }

        // Map to flat structure
        const entries = rawEntries.map((e: any) => ({
            ...e,
            consulente_name: e.consulente?.name,
            tipo_abbonamento_name: e.tipo_abbonamento?.name
        }));

        // 2. Initialize PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // 3. Header & Logo
        // Load logo
        const logoUrl = "/app-logo.png";
        try {
            const response = await fetch(logoUrl);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            // Calculate aspect ratio
            const img = new Image();
            img.src = base64;
            await new Promise((resolve) => { img.onload = resolve; });

            const maxW = 50;
            const maxH = 15;
            const ratio = img.width / img.height;

            let w = maxW;
            let h = w / ratio;

            if (h > maxH) {
                h = maxH;
                w = h * ratio;
            }

            doc.addImage(base64, 'PNG', pageWidth - w - 14, 10, w, h);
        } catch (e) {
            console.error("Could not load logo", e);
        }

        // Title
        const dateFormatted = new Date(date).toLocaleDateString("it-IT", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("Report Giornaliero", 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1), 14, 28);

        let currentY = 40;

        // 4. Group by Section
        // We want specific order: TOUR SPONTANEI, APPUNTAMENTI TELEFONICI, then others
        const sectionsOrder = DB_SECTIONS;

        sectionsOrder.forEach(sectionKey => {
            const sectionEntries = entries.filter(e => e.section === sectionKey);

            if (sectionEntries.length > 0) {
                // Section Header
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0); // Black
                doc.setFont("helvetica", "bold");
                doc.text(getSectionLabel(sectionKey), 14, currentY);
                currentY += 4;

                // Table Body
                const tableBody = sectionEntries.map(e => {
                    const time = e.entry_time ? e.entry_time.slice(0, 5) : "-";
                    const client = `${e.nome} ${e.cognome}`;
                    const consultant = e.consulente_name || "-";
                    const type = e.tipo_abbonamento_name || "-";

                    // Status
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

                    // Columns based on section
                    if (sectionKey === "APPUNTAMENTI TELEFONICI") {
                        return [time, client, consultant, e.telefono || "-", status];
                    } else {
                        return [time, client, consultant, type, status];
                    }
                });

                // Table Headers
                let headers = ["Ora", "Cliente", "Consulente", "Tipo Abb.", "Esito"];
                if (sectionKey === "APPUNTAMENTI TELEFONICI") {
                    headers = ["Ora", "Cliente", "Consulente", "Telefono", "Stato"];
                }

                autoTable(doc, {
                    startY: currentY,
                    head: [headers],
                    body: tableBody,
                    theme: 'grid',
                    headStyles: { fillColor: [33, 181, 186], textColor: 255, fontStyle: 'bold' },
                    styles: { fontSize: 9, cellPadding: 3 },
                    alternateRowStyles: { fillColor: [255, 255, 255] }, // Disable default alternate
                    margin: { top: 10 },
                    didParseCell: (data) => {
                        if (data.section === 'body') {
                            const row = data.row;
                            const raw = row.raw as string[];
                            const status = raw[raw.length - 1]; // Last column is always Status/Esito

                            if (status === "VENDUTO") {
                                data.cell.styles.fillColor = [209, 250, 229]; // emerald-100
                            } else if (status === "MISS CON APP.") {
                                data.cell.styles.fillColor = [255, 237, 213]; // orange-100
                            } else if (status === "ASSENTE") {
                                data.cell.styles.fillColor = [254, 249, 195]; // yellow-100
                            } else if (status === "NEGATIVO") {
                                data.cell.styles.fillColor = [254, 226, 226]; // red-100
                            } else if (status === "PRESENTATO") {
                                data.cell.styles.fillColor = [209, 250, 229]; // emerald-100 (Light Green as requested)
                            } else if (status === "COMPLETATO") {
                                data.cell.styles.fillColor = [220, 252, 231]; // green-100
                            }
                        }
                    }
                });

                // Update Y for next section
                // @ts-ignore
                currentY = doc.lastAutoTable.finalY + 15;
            }
        });

        // 5. Save
        doc.save(`Report_${date}.pdf`);

    } catch (err: any) {
        console.error("PDF Generation Error:", err);
        alert("Errore durante la generazione del PDF: " + err.message);
    }
};
