"use client";

import { useState } from "react";
import { FileDown, Calendar } from "lucide-react";
import { generateDailyReport } from "@/lib/pdfGenerator";
import { cn } from "@/lib/utils";

export default function ExportPdfButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        await generateDailyReport(date);
        setLoading(false);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm h-10 w-10 p-0 md:w-auto md:px-4 md:py-2 flex items-center justify-center"
            >
                <FileDown size={18} className="text-slate-500 md:mr-2" />
                <span className="hidden md:inline">Esporta Report</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-100 p-4 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-bold text-slate-800 mb-3">Esporta Report Giornaliero</h3>

                        <div className="mb-4">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Seleziona Data</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="date"
                                    className="input w-full pl-10"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={loading}
                            className="btn w-full bg-brand text-white hover:bg-brand-ink shadow-lg shadow-brand/20 border-transparent"
                        >
                            {loading ? "Generazione..." : "Scarica PDF"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
