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
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Visite Mediche</h1>
                    <p className="text-slate-500 mt-1">Gestisci appuntamenti con il medico e lista d'attesa.</p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
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
