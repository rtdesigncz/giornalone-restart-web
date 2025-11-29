"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CalendarCheck,
    Stethoscope,
    Sparkles,
    Settings
} from "lucide-react";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Agenda", href: "/agenda", icon: CalendarCheck },
    { label: "Visite", href: "/visite-mediche", icon: Stethoscope },
    { label: "AI", href: "#", icon: Sparkles, isAI: true },
    { label: "Impostazioni", href: "/settings", icon: Settings },
];

export default function MobileNav() {
    const pathname = usePathname();

    const handleAIClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.dispatchEvent(new Event("open-ai-agent"));
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 md:hidden pb-safe">
            <div className="flex items-center justify-around h-16 px-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = item.href === "/"
                        ? pathname === "/"
                        : pathname?.startsWith(item.href) && item.href !== "#";

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={item.isAI ? handleAIClick : undefined}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                                isActive
                                    ? "text-[#21b5ba]"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <div className={cn(
                                "p-1 rounded-lg transition-all",
                                isActive && "bg-[#21b5ba]/10",
                                item.isAI && "bg-gradient-to-br from-[#21b5ba] to-[#1a9296] text-white shadow-md shadow-[#21b5ba]/20"
                            )}>
                                <item.icon
                                    size={item.isAI ? 22 : 20}
                                    strokeWidth={isActive || item.isAI ? 2.5 : 2}
                                    className={cn(item.isAI && "text-white")}
                                />
                            </div>
                            <span className="text-[10px] font-medium tracking-tight">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
