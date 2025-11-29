"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Settings,
    BarChart3,
    X,
    LogOut,
    CalendarCheck,
    Sparkles,
    Ticket,
    Stethoscope,
    ChevronRight,
    ChevronLeft,
    PanelLeftClose,
    PanelLeftOpen
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Agenda", href: "/agenda", icon: CalendarCheck },
    { label: "Consulenze", href: "/consulenze", icon: Users },
    { label: "Consegna Pass", href: "/consegna-pass", icon: Ticket },
    { label: "Visite", href: "/visite-mediche", icon: Stethoscope },
    { label: "Reportistica", href: "/reportistica", icon: BarChart3 },
    { label: "Mauriz", href: "#", icon: Sparkles, isAI: true },
    { label: "Impostazioni", href: "/settings", icon: Settings },
];

export default function Sidebar({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    // Persist collapsed state
    useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved === "true") setCollapsed(true);
    }, []);

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", String(newState));
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity md:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out md:static flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                    collapsed ? "w-20" : "w-72"
                )}
            >
                {/* Logo Area */}
                <div className={cn("h-24 flex items-center border-b border-white/40 transition-all", collapsed ? "justify-center px-0" : "px-8")}>
                    {!collapsed ? (
                        <div className="relative h-10 w-48 animate-in fade-in duration-300">
                            <img src="/app-logo.png" alt="Logo" className="h-full w-auto object-contain object-left drop-shadow-sm" />
                        </div>
                    ) : (
                        <div className="relative h-10 w-10 animate-in zoom-in duration-300">
                            <img src="/logo-small.png" alt="Logo" className="h-full w-full object-contain drop-shadow-sm" />
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="ml-auto md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-full transition-all absolute right-4"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-8 px-3 space-y-2 custom-scrollbar">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => onClose()}
                                title={collapsed ? item.label : ""}
                                className={cn(
                                    "relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden",
                                    collapsed ? "justify-center px-0 py-3.5" : "px-4 py-3.5",
                                    isActive
                                        ? "bg-[#21b5ba]/10 text-[#21b5ba] shadow-sm ring-1 ring-[#21b5ba]/20"
                                        : "text-slate-600 hover:bg-white/60 hover:text-slate-900 hover:shadow-sm"
                                )}
                            >
                                {isActive && (
                                    <div className={cn("absolute bg-[#21b5ba] rounded-r-full transition-all", collapsed ? "left-0 top-1/2 -translate-y-1/2 w-1 h-8" : "left-0 top-1/2 -translate-y-1/2 w-1 h-8")} />
                                )}

                                <item.icon
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={cn(
                                        "transition-colors duration-300 flex-shrink-0",
                                        isActive ? "text-[#21b5ba]" : "text-slate-400 group-hover:text-[#21b5ba]"
                                    )}
                                />

                                {!collapsed && (
                                    <span className="relative z-10 whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                                        {item.label}
                                    </span>
                                )}

                                {!collapsed && isActive && (
                                    <ChevronRight size={16} className="ml-auto text-[#21b5ba] animate-in fade-in slide-in-from-left-2" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / User */}
                <div className={cn("border-t border-white/40 bg-white/30 backdrop-blur-sm transition-all", collapsed ? "p-3 space-y-3" : "p-6 space-y-4")}>
                    {/* Collapse Toggle (Desktop Only) */}
                    <button
                        onClick={toggleCollapse}
                        className="hidden md:flex w-full items-center justify-center p-2 text-slate-400 hover:text-[#21b5ba] hover:bg-white/50 rounded-lg transition-all mb-2"
                        title={collapsed ? "Espandi" : "Riduci"}
                    >
                        {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>

                    {/* AI Trigger */}
                    <button
                        onClick={() => window.dispatchEvent(new Event("open-ai-agent"))}
                        className={cn(
                            "flex items-center rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#21b5ba] to-[#1a9296] hover:from-[#1a9296] hover:to-[#147a7d] shadow-lg shadow-[#21b5ba]/20 hover:shadow-[#21b5ba]/30 transition-all group active:scale-95 relative overflow-hidden",
                            collapsed ? "justify-center w-12 h-12 p-0 mx-auto" : "w-full gap-3 px-3 py-3"
                        )}
                        title="Parla con Mauriz"
                    >
                        <div className={cn("relative rounded-full overflow-hidden border-2 border-white/20 shrink-0", collapsed ? "w-10 h-10" : "w-10 h-10")}>
                            <img src="/mauriz/maurineutro.png" alt="Mauriz" className="w-full h-full object-cover" />
                        </div>

                        {!collapsed && (
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[13px] font-bold">Parla con Mauriz</span>
                                <span className="text-[10px] text-white/80 font-medium uppercase tracking-wider mt-0.5">Assistente AI</span>
                            </div>
                        )}
                    </button>

                    <div className={cn(
                        "flex items-center rounded-2xl bg-white/60 border border-white/60 shadow-sm hover:shadow-md transition-all cursor-pointer group",
                        collapsed ? "justify-center p-2" : "gap-3 p-3"
                    )}>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white flex-shrink-0">
                            R
                        </div>
                        {!collapsed && (
                            <>
                                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2">
                                    <div className="text-sm font-bold text-slate-800 truncate group-hover:text-[#21b5ba] transition-colors">Roberto</div>
                                    <div className="text-[11px] text-slate-500 truncate font-medium">Administrator</div>
                                </div>
                                <button className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-all">
                                    <LogOut size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
