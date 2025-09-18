// src/components/AppShell.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Menu } from "lucide-react";

function parseISO(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}
function fmtISO(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatHeaderDate(sp: URLSearchParams) {
  const scope = sp.get("scope") ?? "day";
  const fmtFull = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const fmtShort = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (scope === "day") {
    const d = sp.get("date") ?? new Date().toISOString().slice(0, 10);
    return fmtFull.format(parseISO(d));
  }
  if (scope === "month") {
    const d = sp.get("date") ?? new Date().toISOString().slice(0, 10);
    const dd = parseISO(d);
    const month = new Intl.DateTimeFormat("it-IT", { month: "long" }).format(dd);
    return `${month} ${dd.getUTCFullYear()}`;
  }
  if (scope === "year") {
    const d = sp.get("date") ?? new Date().toISOString().slice(0, 10);
    return `Anno ${parseISO(d).getUTCFullYear()}`;
  }
  const from = sp.get("from") ?? new Date().toISOString().slice(0, 10);
  const to = sp.get("to") ?? new Date().toISOString().slice(0, 10);
  return `Dal ${fmtShort.format(parseISO(from))} al ${fmtShort.format(parseISO(to))}`;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpenDesktop, setMenuOpenDesktop] = useState(false);
  const [menuOpenMobile, setMenuOpenMobile] = useState(false);

  const scope = sp.get("scope") ?? "day";
  const currentDate = sp.get("date") ?? new Date().toISOString().slice(0, 10);
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isToday = scope === "day" && currentDate === todayISO;

  const humanDate = formatHeaderDate(sp);
  const humanChip = humanDate.charAt(0).toUpperCase() + humanDate.slice(1);

  function apply(params: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    router.push(`${pathname}?${next.toString()}`);
  }

  function shiftDay(delta: number) {
    const d = parseISO(currentDate);
    d.setUTCDate(d.getUTCDate() + delta);
    apply({ scope: "day", date: fmtISO(d), from: undefined, to: undefined });
  }
  function goToday() {
    const iso = new Date().toISOString().slice(0, 10);
    apply({ scope: "day", date: iso, from: undefined, to: undefined });
  }

  // Chip stile
  const chipBase =
    "relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 border cursor-pointer select-none";
  const chipText = "text-[15px] md:text-[16px] font-semibold";
  const chipNormal = `tag ${chipBase}`;
  const chipToday =
    `${chipBase} bg-teal-50 border-teal-200 text-teal-800 ring-1 ring-teal-200`;

  const TodayBadge = () =>
    isToday ? (
      <span className="ml-1 inline-flex items-center rounded-full bg-teal-600 text-white text-[10px] font-semibold px-2 py-[2px] uppercase tracking-wide">
        Oggi
      </span>
    ) : null;

  // Chip con input date overlay
  const DateChip = ({
    value,
    onChange,
    isTodayStyle,
    label,
  }: {
    value: string;
    onChange: (v: string) => void;
    isTodayStyle?: boolean;
    label: string;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const openPicker = () => {
      const el = inputRef.current;
      if (!el) return;
      // @ts-ignore
      if (typeof (el as any).showPicker === "function") {
        // @ts-ignore
        (el as any).showPicker();
      } else {
        el.focus();
        el.click();
      }
    };

    return (
      <div
        className={isTodayStyle ? chipToday : chipNormal}
        title="Cambia data"
        aria-label="Cambia data"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span className={chipText}>{label}</span>
        <TodayBadge />
        <input
          ref={inputRef}
          type="date"
          aria-label="Seleziona data"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 z-10 opacity-0 cursor-pointer"
        />
      </div>
    );
  };

  const MenuDropdown = ({
    open,
    setOpen,
  }: {
    open: boolean;
    setOpen: (v: boolean) => void;
  }) => (
    <div className="relative">
      <button
        className="btn btn-ghost p-2"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
          <Link
            href="/reportistica"
            className="block px-4 py-2 hover:bg-slate-100"
            onClick={() => setOpen(false)}
          >
            Reportistica
          </Link>
          <Link
            href="/consulenze"
            className="block px-4 py-2 hover:bg-slate-100"
            onClick={() => setOpen(false)}
          >
            Consulenze
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2 hover:bg-slate-100"
            onClick={() => setOpen(false)}
          >
            Impostazioni
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header desktop (sticky) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b shadow-sm hidden md:block">
        <div className="px-3 md:px-4 lg:px-6 xl:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="https://iili.io/FsM5Q3v.png"
              alt="Restart"
              width={240}
              height={240}
              className="rounded"
              priority
            />
            <div>
              <div className="text-2xl font-semibold leading-tight">Giornalone</div>
              <div className="text-sm text-slate-500">Restart Fitness Club</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {scope === "day" ? (
              <>
                <button
                  className="btn btn-ghost"
                  title="Giorno precedente"
                  onClick={() => shiftDay(-1)}
                >
                  ←
                </button>

                <DateChip
                  value={currentDate}
                  onChange={(v) =>
                    apply({ scope: "day", date: v, from: undefined, to: undefined })
                  }
                  isTodayStyle={isToday}
                  label={humanChip}
                />

                <button
                  className="btn btn-ghost"
                  title="Giorno successivo"
                  onClick={() => shiftDay(1)}
                >
                  →
                </button>

                <button className="btn" onClick={goToday} title="Vai ad oggi">
                  Oggi
                </button>
              </>
            ) : (
              <span className={`tag ${chipText}`}>{humanChip}</span>
            )}

            {/* === Burger menu (DESKTOP) — raggruppa i link === */}
            <MenuDropdown open={menuOpenDesktop} setOpen={setMenuOpenDesktop} />
          </div>
        </div>
      </header>

      {/* Header mobile (sticky) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b shadow-sm md:hidden">
        <div className="flex flex-col items-center gap-2 py-3">
          <Image
            src="https://iili.io/FsM5Q3v.png"
            alt="Restart"
            width={160}
            height={160}
            className="rounded"
            priority
          />
          <div className="flex items-center justify-between w-full px-3 md:px-4 lg:px-6 xl:px-8">
            <div className="text-xl font-semibold">Giornalone</div>
            {/* === Burger menu (MOBILE) — stessi link === */}
            <MenuDropdown open={menuOpenMobile} setOpen={setMenuOpenMobile} />
          </div>
          <div className="flex items-center gap-2">
            {scope === "day" ? (
              <>
                <button
                  className="btn btn-ghost"
                  onClick={() => shiftDay(-1)}
                  title="Giorno precedente"
                >
                  ←
                </button>

                <DateChip
                  value={currentDate}
                  onChange={(v) =>
                    apply({ scope: "day", date: v, from: undefined, to: undefined })
                  }
                  isTodayStyle={isToday}
                  label={humanChip}
                />

                <button
                  className="btn btn-ghost"
                  onClick={() => shiftDay(1)}
                  title="Giorno successivo"
                >
                  →
                </button>

                <button className="btn" onClick={goToday} title="Vai ad oggi">
                  Oggi
                </button>
              </>
            ) : (
              <span className={`tag ${chipText}`}>{humanChip}</span>
            )}
          </div>
        </div>
      </header>

      {/* Contenuto */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500">
        © 2025 <span className="font-medium">Progettato da Roberto Tavano</span>
      </footer>
    </div>
  );
}