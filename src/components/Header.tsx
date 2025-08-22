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
    const [y,m,d] = s.split("-").map(Number);
    return new Date(Date.UTC(y, m-1, d));
  };

  if (scope === "day") {
    const d = sp.get("date") ?? new Date().toISOString().slice(0,10);
    return fmt.format(parseISO(d));
  }
  if (scope === "month") {
    const d = sp.get("date") ?? new Date().toISOString().slice(0,10);
    const date = parseISO(d);
    const month = new Intl.DateTimeFormat("it-IT", { month: "long" }).format(date);
    const year = date.getUTCFullYear();
    return `${month} ${year}`;
  }
  if (scope === "year") {
    const d = sp.get("date") ?? new Date().toISOString().slice(0,10);
    const year = parseISO(d).getUTCFullYear();
    return `Anno ${year}`;
  }
  const from = sp.get("from") ?? new Date().toISOString().slice(0,10);
  const to   = sp.get("to")   ?? new Date().toISOString().slice(0,10);
  return `Dal ${fmtShort.format(parseISO(from))} al ${fmtShort.format(parseISO(to))}`;
}

export default function Header() {
  const sp = useSearchParams();
  const humanDate = formatHeaderDate(sp);

  return (
    <header className="w-full border-b bg-white sticky top-0 z-30">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image
            src="https://iili.io/FsM5Q3v.png"
            alt="Restart"
            width={252}   // ~3x rispetto a prima
            height={252}
            priority
            className="rounded-md"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-3xl md:text-4xl font-semibold">Giornalone</span>
            <span className="text-xs text-gray-500">Restart</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="hidden md:inline-flex items-center px-4 py-2 rounded-full border text-sm"
            style={{ borderColor: "#1AB4B8", color: "#0e7679" }}
          >
            {humanDate.charAt(0).toUpperCase() + humanDate.slice(1)}
          </span>
          <nav className="flex items-center gap-2">
            <Link href="/" className="px-3 py-2 border rounded hover:bg-gray-50">Home</Link>
            <Link href="/settings" className="px-3 py-2 border rounded hover:opacity-90"
              style={{ background: "#1AB4B8", color: "#fff" }}>
              Impostazioni
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
