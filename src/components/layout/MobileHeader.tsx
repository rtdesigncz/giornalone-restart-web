"use client";

import { cn } from "@/lib/utils";

export default function MobileHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-center md:hidden shadow-sm">
            <div className="relative h-8 w-40">
                <img
                    src="/app-logo.png"
                    alt="Logo"
                    className="h-full w-full object-contain"
                />
            </div>
        </header>
    );
}
