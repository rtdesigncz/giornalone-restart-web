import { Phone, X, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface CallReminderPopupProps {
    call: any;
    onComplete: () => void;
    onClose: () => void;
}

export default function CallReminderPopup({ call, onComplete, onClose }: CallReminderPopupProps) {
    if (!call) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-end p-6 bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl border border-orange-100 p-5 w-80 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                {/* Background decoration */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-50 rounded-full opacity-50 pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg animate-pulse">
                                <Phone size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 leading-tight">Promemoria Chiamata!</h3>
                                <p className="text-xs text-slate-500 font-bold text-orange-600">
                                    Ore {call.entry_time?.slice(0, 5)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="mb-4">
                        <p className="text-lg font-bold text-slate-900 truncate">
                            {call.nome} {call.cognome}
                        </p>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mb-1">
                            {call.telefono}
                        </p>
                        {call.consulente_name && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg inline-block">
                                <Users size={12} />
                                {call.consulente_name}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all"
                        >
                            Chiudi
                        </button>
                        <button
                            onClick={onComplete}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Check size={16} />
                            Fatto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
