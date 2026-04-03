"use client";

import Link from "next/link";
import { useState } from "react";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("ok");
      setMessage(
        data.already
          ? "You are already on the list. We will be in touch."
          : "You are on the list. Thank you.",
      );
      setEmail("");
    } catch (err) {
      setStatus("err");
      setMessage(err instanceof Error ? err.message : "Try again later.");
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-gradient-to-b from-emerald-50 via-stone-50 to-amber-50/80 px-6 py-16 dark:from-emerald-950 dark:via-stone-950 dark:to-stone-900">
      <div className="mx-auto w-full max-w-lg">
        <Link
          href="/"
          className="text-sm font-medium text-emerald-800 hover:underline dark:text-emerald-300"
        >
          ← Back to the forest path
        </Link>
        <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">
          Fernhollow
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-50">
          Early access
        </h1>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          Fernhollow for other solo builders is on the roadmap. Drop your email
          if you want a heads-up when it opens.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-900 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-50"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-xl bg-emerald-800 py-3 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700"
          >
            {status === "loading" ? "Joining…" : "Join the waitlist"}
          </button>
        </form>
        {message ? (
          <p
            className={`mt-4 text-sm ${status === "err" ? "text-rose-600" : "text-emerald-800 dark:text-emerald-300"}`}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
