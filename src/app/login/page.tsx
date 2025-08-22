// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const js = await res.json();
      if (!res.ok) {
        setErr(js?.error || "Credenziali errate");
        return;
      }
      // successo → torna alla home
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Errore inatteso");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white border rounded-xl p-5 space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">Accedi</h1>

        {err && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {err}
          </div>
        )}

        <div>
          <label className="block text-sm mb-1">Username</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={u}
            onChange={(e) => setU(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={p}
            onChange={(e) => setP(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded px-3 py-2 text-white"
          style={{ backgroundColor: "#1AB4B8", opacity: loading ? 0.7 : 1 }}
          disabled={loading}
        >
          {loading ? "Accesso in corso…" : "Entra"}
        </button>
      </form>
    </div>
  );
}