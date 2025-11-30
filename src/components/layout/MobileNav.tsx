"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CalendarCheck,
    Users,
    Ticket,
    Stethoscope,
    Sparkles,
    Settings,
    Menu,
    X,
    LogOut
} from "lucide-react";
import { createPortal } from "react-dom";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Agenda", href: "/agenda", icon: CalendarCheck },
    { label: "Consulenze", href: "/consulenze", icon: Users },
    { label: "Pass", href: "/consegna-pass", icon: Ticket },
    { label: "Visite", href: "/visite-mediche", icon: Stethoscope },
    { label: "Mauriz", href: "#", icon: Sparkles, isAI: true },
    { label: "Impostazioni", href: "/settings", icon: Settings },
];

export default function MobileNav() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleAIClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.dispatchEvent(new Event("open-ai-agent"));
        setIsOpen(false);
    };

    if (!mounted) return null;

    return (
        <>
            {/* Top Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 md:hidden flex items-center justify-between px-4 shadow-sm">
                {/* Spacer to balance the menu button */}
                <div className="w-10"></div>

                {/* Centered Logo */}
                <div className="flex items-center justify-center">
                    <img src="/logo-restart.png" alt="Restart" className="h-8 w-auto object-contain" />
                </div>

                {/* Burger Menu Button */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-700"
                >
                    <Menu size={24} />
                </button>
            </header>

            {/* Spacer for content below header */}
            <div className="h-16 md:hidden"></div>

            {/* Drawer Portal */}
            {mounted && createPortal(
                <>
                    {/* Backdrop */}
                    <div
                        className={cn(
                            "fixed inset-0 bg-black/50 z-[60] md:hidden transition-opacity duration-300 backdrop-blur-sm",
                            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Drawer Panel */}
                    <div
                        className={cn(
                            "fixed inset-y-0 right-0 w-[280px] bg-white z-[70] md:hidden shadow-2xl transform transition-transform duration-300 ease-out flex flex-col",
                            isOpen ? "translate-x-0" : "translate-x-full"
                        )}
                    >
                        {/* Drawer Header */}
                        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
                            <span className="font-bold text-slate-800 text-lg">Menu</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
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
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                            isActive
                                                ? "bg-[#21b5ba]/10 text-[#21b5ba] font-semibold"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                            item.isAI && "mt-4 bg-gradient-to-r from-[#21b5ba] to-[#1a9296] text-white shadow-lg shadow-[#21b5ba]/20 hover:shadow-xl hover:from-[#1a9296] hover:to-[#147a7d]"
                                        )}
                                    >
                                        <item.icon
                                            size={20}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className={cn(item.isAI && "text-white")}
                                        />
                                        <span className="text-base">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-4 border-t border-slate-100">
                            <div className="text-xs text-center text-slate-400">
                                © {new Date().getFullYear()} Restart Fitness Club
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    );
}
