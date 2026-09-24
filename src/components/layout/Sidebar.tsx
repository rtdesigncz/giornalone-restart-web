"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Settings, BarChart3, X, LogOut, CalendarCheck, Ticket, Stethoscope, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Agenda", href: "/agenda", icon: CalendarCheck },
    { label: "Consulenze", href: "/consulenze", icon: Users },
    { label: "Consegna Pass", href: "/consegna-pass", icon: Ticket },
    { label: "Visite Mediche", href: "/visite-mediche", icon: Stethoscope },
    { label: "Reportistica", href: "/reportistica", icon: BarChart3 },
    { label: "Impostazioni", href: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

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
            <div className={cn("fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity md:hidden", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")} onClick={onClose} />
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 bg-[#fbfbfb] border-r border-slate-200 transition-all duration-300 ease-in-out md:static flex flex-col shadow-2xl md:shadow-none",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                collapsed ? "w-[72px]" : "w-64"
            )}>
                <div className={cn("h-[70px] flex items-center border-b border-slate-200 transition-all relative", collapsed ? "justify-center px-0" : "px-5")}>
                    {!collapsed ? (
                        <div className="flex items-center w-full justify-start py-2">
                            <img src="/app-logo.png" alt="Restart" className="h-10 w-auto object-contain" />
                        </div>
                    ) : (
                        <div className="h-8 w-8 rounded-xl bg-[#21b5ba] flex items-center justify-center text-white font-bold text-[16px] shadow-sm">R</div>
                    )}
                    <button onClick={onClose} className="ml-auto md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-md absolute right-3"><X size={20} /></button>
                </div>

                <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5 custom-scrollbar">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} onClick={() => onClose()} title={collapsed ? item.label : ""} className={cn(
                                "relative flex items-center gap-3.5 rounded-lg text-[15px] font-semibold transition-all duration-150 group select-none",
                                collapsed ? "justify-center px-0 py-3" : "px-3.5 py-2.5",
                                isActive ? "bg-cyan-50 text-cyan-700 font-bold border border-cyan-100" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}>
                                {isActive && !collapsed && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-l-lg"></div>}
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-transform duration-200 flex-shrink-0", isActive ? "text-cyan-600" : "text-slate-400 group-hover:text-slate-700")} />
                                {!collapsed && <span className="relative z-10 whitespace-nowrap">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                <div className={cn("border-t border-slate-200 bg-[#fbfbfb] transition-all", collapsed ? "p-2 space-y-2" : "p-4 space-y-3")}>
                    <button onClick={toggleCollapse} className="hidden md:flex w-full items-center justify-center p-2 text-slate-400 hover:text-[#21b5ba] hover:bg-slate-100 rounded-lg transition-all" title={collapsed ? "Espandi" : "Riduci"}>
                        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                    <div className={cn("flex items-center rounded-xl hover:bg-slate-100 transition-all group", collapsed ? "justify-center p-2" : "gap-3 p-2.5")}>
                        <div className="h-8 w-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-[12px] flex-shrink-0">R</div>
                        {!collapsed && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] font-bold text-slate-900 truncate">Roberto</div>
                                    <div className="text-[11px] font-medium text-slate-400">Admin</div>
                                </div>
                                <button className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-all" title="Logout"><LogOut size={16} /></button>
                            </>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
