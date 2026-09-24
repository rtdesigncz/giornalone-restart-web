"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Option = {
    value: string;
    label: string;
};

interface CustomSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: Option[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Seleziona...",
    disabled = false,
    className,
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((o) => o.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={cn("relative font-sans text-slate-900", className)}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "flex w-full items-center justify-between gap-2 h-[38px] px-3 py-1.5",
                    "bg-white border border-slate-300 rounded-[12px] shadow-sm text-[13px] font-medium text-left",
                    "transition-all duration-200 outline-none",
                    isOpen ? "border-[#21b5ba] ring-2 ring-[#21b5ba]/50" : "hover:border-slate-400",
                    disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "cursor-pointer"
                )}
            >
                <span className={cn("truncate", !selectedOption && "text-slate-400 font-normal")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={cn("text-slate-400 shrink-0 transition-transform duration-200", isOpen && "rotate-180 text-[#21b5ba]")}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-[200] bg-white border border-slate-200 rounded-[12px] shadow-lg py-1.5 max-h-56 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
                    {options.length === 0 ? (
                        <div className="px-3.5 py-2 text-xs text-slate-400 italic font-medium">Nessuna opzione</div>
                    ) : (
                        options.map((opt) => {
                            const isSelected = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium transition-colors cursor-pointer outline-none",
                                        isSelected ? "bg-[#21b5ba]/10 text-[#0f766e]" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {isSelected && <Check size={14} className="text-[#21b5ba] shrink-0" />}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
