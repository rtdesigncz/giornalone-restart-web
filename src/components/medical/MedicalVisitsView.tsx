"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import SessionManager from "./SessionManager";
import WaitingList from "./WaitingList";

export default function MedicalVisitsView() {
    const [activeTab, setActiveTab] = useState<"appointments" | "waiting">("appointments");

    return (
        <div className="space-y-6 animate-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Visite Mediche</h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">Gestisci appuntamenti con il medico e lista d'attesa.</p>
                </div>

                {/* Desktop Tabs */}
                <div className="hidden md:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab("appointments")}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
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
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === "waiting"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Lista d'Attesa
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
                        Lista d'Attesa
                    </button>
                </div>
            </div>

            <div className="glass-card relative border border-slate-200/60 bg-white/50 p-6">
                {activeTab === "appointments" ? (
                    <SessionManager />
                ) : (
                    <WaitingList />
                )}
            </div>
        </div>
    );
}
