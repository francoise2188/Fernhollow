"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function Gate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string"
            ? data.error
            : "That did not work. Try again.",
        );
        return;
      }
      setPassword("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-gradient-to-b from-emerald-950 via-emerald-900 to-stone-950 px-6 py-16 text-stone-100">
      <div className="w-full max-w-md rounded-2xl border border-emerald-700/40 bg-emerald-950/60 p-8 shadow-xl backdrop-blur">
        <p className="text-center text-sm uppercase tracking-[0.2em] text-emerald-300/90">
          Fernhollow
        </p>
        <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight">
          The forest path
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-stone-300">
          This village is private. Enter the gate password to walk the path home.
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-3">
          <label htmlFor="gate-password" className="sr-only">
            Gate password
          </label>
          <input
            id="gate-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Gate password"
            className="rounded-xl border border-emerald-700/50 bg-stone-950/50 px-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
          {error ? (
            <p className="text-sm text-rose-300" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Opening…" : "Enter the village"}
          </button>
        </form>
      </div>
    </div>
  );
}
