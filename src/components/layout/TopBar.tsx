"use client";

import { Menu } from "lucide-react";
// import { usePathname } from "next/navigation"; 

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
    // const pathname = usePathname(); // Kept if needed for other things, but currently unused

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
                >
                    <Menu size={20} />
                </button>

                {/* Global Actions or Breadcrumbs could go here */}
            </div>

            <div className="flex items-center gap-4">
                {/* Placeholder for global search or notifications */}
            </div>
        </header>
    );
}
