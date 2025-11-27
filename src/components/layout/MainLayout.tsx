"use client";

import { useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import CommandPalette from "../ui/CommandPalette";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const isFullWidth = pathname?.startsWith("/consulenze") || pathname?.startsWith("/reportistica") || pathname?.startsWith("/consegna-pass");

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
            <CommandPalette />
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Suspense fallback={<div className="h-16 bg-white/50 border-b border-slate-200" />}>
                    <TopBar onMenuClick={() => setSidebarOpen(true)} />
                </Suspense>

                <main className={`flex-1 overflow-y-auto scroll-smooth ${isFullWidth ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}>
                    {isFullWidth ? (
                        children
                    ) : (
                        <div className="max-w-7xl mx-auto space-y-8">
                            {children}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
