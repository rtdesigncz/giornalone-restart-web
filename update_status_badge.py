import re

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "r") as f:
    content = f.read()

# Update StatusBadge definition
old_badge = """const StatusBadge = ({ label, color }: { label: string, color: "emerald" | "amber" | "red" | "slate" | "blue" }) => {
    const colors = {
        emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
        amber: "bg-amber-100 text-amber-700 border-amber-200",
        red: "bg-red-100 text-red-700 border-red-200",
        slate: "bg-slate-100 text-slate-600 border-slate-200",
        blue: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${colors[color]}`}>
            {label}
        </span>
    );
};"""

new_badge = """const StatusBadge = ({ label, color, className }: { label: string, color: "emerald" | "amber" | "red" | "slate" | "blue", className?: string }) => {
    const colors = {
        emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
        amber: "bg-amber-100 text-amber-700 border-amber-200",
        red: "bg-red-100 text-red-700 border-red-200",
        slate: "bg-slate-100 text-slate-600 border-slate-200",
        blue: "bg-blue-100 text-blue-700 border-blue-200",
    };
    return (
        <span className={cn(`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${colors[color]}`, className)}>
            {label}
        </span>
    );
};"""

content = content.replace(old_badge, new_badge)

with open("src/app/consulenze/ConsulenzeClientV2.tsx", "w") as f:
    f.write(content)

print("StatusBadge updated!")
