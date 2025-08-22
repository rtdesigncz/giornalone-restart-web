// src/components/AppShell.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Settings } from "lucide-react";

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
  const humanDate = formatHeaderDate(sp);
  const humanChip = humanDate.charAt(0).toUpperCase() + humanDate.slice(1);

  const scope = sp.get("scope") ?? "day";
  const currentDate = sp.get("date") ?? new Date().toISOString().slice(0, 10);

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

  // Date picker
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);

  function openDatePicker() {
    if (scope !== "day") return;
    const el = dateInputRef.current;
    if (!el) return;
    setPickerOpen(true);
    // @ts-ignore
    if (el.showPicker) el.showPicker();
    else el.click();
  }

  function hardClosePicker() {
    const el = dateInputRef.current;
    if (el) el.blur();
    const active = document.activeElement as HTMLElement | null;
    if (active && typeof active.blur === "function") active.blur();
    setPickerKey((k) => k + 1);
    setPickerOpen(false);
  }

  useEffect(() => {
    if (!pickerOpen) return;
    const onDocMouseDown = () => hardClosePicker();
    document.addEventListener("mousedown", onDocMouseDown, true);
    return () => document.removeEventListener("mousedown", onDocMouseDown, true);
  }, [pickerOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header desktop */}
      <header className="bg-white border-b hidden md:block">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
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
            {scope === "day" && (
              <>
                <button className="btn btn-ghost" onClick={() => shiftDay(-1)}>←</button>
                <button type="button" className="tag" onClick={openDatePicker}>{humanChip}</button>
                <button className="btn btn-ghost" onClick={() => shiftDay(1)}>→</button>
                <button className="btn" onClick={goToday}>Oggi</button>
                <input
                  key={pickerKey}
                  ref={dateInputRef}
                  type="date"
                  className="sr-only"
                  value={currentDate}
                  onChange={(e) => {
                    apply({ scope: "day", date: e.target.value, from: undefined, to: undefined });
                    setTimeout(hardClosePicker, 0);
                  }}
                  onBlur={hardClosePicker}
                />
              </>
            )}
            {scope !== "day" && <span className="tag">{humanChip}</span>}
            <Link href="/settings" className="btn btn-brand">Impostazioni</Link>
          </div>
        </div>
      </header>

      {/* Header mobile */}
      <header className="bg-white border-b md:hidden">
        <div className="flex flex-col items-center gap-2 py-3">
          <Image
            src="https://iili.io/FsM5Q3v.png"
            alt="Restart"
            width={160}
            height={160}
            className="rounded"
            priority
          />
          <div className="flex items-center justify-between w-full px-4">
            <div className="text-xl font-semibold">Giornalone</div>
            <Link href="/settings" className="btn btn-ghost p-2">
              <Settings className="h-5 w-5" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {scope === "day" && (
              <>
                <button className="btn btn-ghost" onClick={() => shiftDay(-1)}>←</button>
                <button type="button" className="tag" onClick={openDatePicker}>{humanChip}</button>
                <button className="btn btn-ghost" onClick={() => shiftDay(1)}>→</button>
                <button className="btn" onClick={goToday}>Oggi</button>
                <input
                  key={pickerKey}
                  ref={dateInputRef}
                  type="date"
                  className="sr-only"
                  value={currentDate}
                  onChange={(e) => {
                    apply({ scope: "day", date: e.target.value, from: undefined, to: undefined });
                    setTimeout(hardClosePicker, 0);
                  }}
                  onBlur={hardClosePicker}
                />
              </>
            )}
            {scope !== "day" && <span className="tag">{humanChip}</span>}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="py-6 text-center text-xs text-slate-500">
        © 2025 <span className="font-medium">Progettato da Roberto Tavano</span>
      </footer>
    </div>
  );
}