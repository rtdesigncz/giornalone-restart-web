"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function formatHeaderDate(sp: URLSearchParams) {
  const scope = sp.get("scope") ?? "day";
  const fmt = new Intl.DateTimeFormat("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const fmtShort = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit", month: "short", year: "numeric",
  });
  const parseISO = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  };

  if (scope === "day") {
    const d = sp.get("date") ?? new Date().toISOString().slice(0, 10);
    return fmt.format(parseISO(d));
  }
  if (scope === "month") {
    const d = sp.get("date") ?? new Date().toISOString().slice(0, 10);
    const date = parseISO(d);
    const month = new Intl.DateTimeFormat("it-IT", { month: "long" }).format(date);
    const year = date.getUTCFullYear();
    return `${month} ${year}`;
  }
  if (scope === "year") {
    const d = sp.get("date") ?? new Date().toISOString().slice(0, 10);
    const year = parseISO(d).getUTCFullYear();
    return `Anno ${year}`;
  }
  const from = sp.get("from") ?? new Date().toISOString().slice(0, 10);
  const to = sp.get("to") ?? new Date().toISOString().slice(0, 10);
  return `Dal ${fmtShort.format(parseISO(from))} al ${fmtShort.format(parseISO(to))}`;
}

export default function Header() {
  const sp = useSearchParams();
  const humanDate = formatHeaderDate(sp ?? new URLSearchParams());

  return (
    <header className="w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-30 transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="relative transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="Restart"
              width={250}
              height={50}
              priority
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="hidden md:inline-flex items-center px-4 py-1.5 rounded-full border text-sm font-medium bg-cyan-50/50 backdrop-blur-sm"
            style={{ borderColor: "#1AB4B8", color: "#0e7679" }}
          >
            {humanDate.charAt(0).toUpperCase() + humanDate.slice(1)}
          </span>
          <nav className="flex items-center gap-2">
            <Link href="/" className="px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100/80 transition-colors">Home</Link>
            <Link href="/settings" className="px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              style={{ background: "#1AB4B8", color: "#fff" }}>
              Impostazioni
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
