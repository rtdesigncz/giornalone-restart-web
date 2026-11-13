"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Stethoscope, Sparkles } from "lucide-react";
import SessionManager from "./SessionManager";
import WaitingList from "./WaitingList";

export default function MedicalVisitsView() {
        const sp = useSearchParams();
    const urlTab = sp?.get("tab") as "appointments" | "waiting" | null;
    const [activeTab, setActiveTab] = useState<"appointments" | "waiting">(urlTab || "appointments");

    useEffect(() => {
        if (urlTab) setActiveTab(urlTab);
    }, [urlTab]);


    return (
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
            {/* Top Navbar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs backdrop-blur-md bg-white/95">
                <div className="max-w-[1700px] mx-auto px-4 md:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#21b5ba]/10 text-[#21b5ba] flex items-center justify-center font-bold shadow-inner shrink-0">
                            <Stethoscope size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-slate-900 tracking-tight">Visite Mediche</h1>
                                <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Sparkles size={11} /> Idoneità Sanitaria
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                                Gestisci sessioni mediche, appuntamenti e lista d&apos;attesa idoneità
                            </p>
                        </div>
                    </div>

                    {/* Desktop Tabs */}
                    <div className="hidden md:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setActiveTab("appointments")}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                activeTab === "appointments"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Appuntamenti
                        </button>
                        <button
                            onClick={() => setActiveTab("waiting")}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                activeTab === "waiting"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            Lista d&apos;Attesa
                        </button>
                    </div>

                    {/* Mobile Tabs */}
                    <div className="flex md:hidden bg-slate-100 p-1 rounded-xl border border-slate-200 w-full">
                        <button
                            onClick={() => setActiveTab("appointments")}
                            className={cn(
                                "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                                activeTab === "appointments"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500"
                            )}
                        >
                            Appuntamenti
                        </button>
                        <button
                            onClick={() => setActiveTab("waiting")}
                            className={cn(
                                "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all",
                                activeTab === "waiting"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-500"
                            )}
                        >
                            Lista d&apos;Attesa
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1700px] mx-auto px-4 md:px-8 pt-6 space-y-6 flex-1 flex flex-col w-full">
                <div className="flex-1 overflow-auto relative">
                    {activeTab === "appointments" ? (
                        <SessionManager />
                    ) : (
                        <WaitingList />
                    )}
                </div>
            </div>
        </div>
    );
}
