"use client";

import { useEffect, useState } from "react";

type GardenRow = {
  id: string;
  created_at: string;
  agent: string;
  business: string;
  content_type: string;
  platform: string | null;
  content: string;
  status: string;
  scheduled_at: string | null;
};

function statusStyle(status: string): string {
  switch (status) {
    case "scheduled":
      return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100";
    case "approved":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100";
    default:
      return "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200";
  }
}

/** Client garden board for game overlay (same data as server GardenBoard). */
export function GardenBoardClient() {
  const [rows, setRows] = useState<GardenRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/garden");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "load");
        if (!cancelled) setRows(data.rows ?? []);
      } catch {
        if (!cancelled) setError("Could not load the garden.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-stone-400">Loading the garden board…</p>
    );
  }
  if (error) {
    return (
      <p className="rounded-xl border border-rose-700/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
        {error}
      </p>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-emerald-800/60 bg-emerald-950/30 px-4 py-8 text-center">
        <p className="font-medium text-stone-100">The garden is quiet.</p>
        <p className="mt-2 text-sm text-stone-400">
          Drafts and scheduled posts will show up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="max-h-[40vh] space-y-2 overflow-y-auto" aria-label="Garden content">
      {rows.map((row) => (
        <li
          key={row.id}
          className="rounded-xl border border-stone-700/80 bg-stone-900/80 p-3"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-stone-500">
            <span
              className={`rounded-full px-2 py-0.5 ${statusStyle(row.status)}`}
            >
              {row.status}
            </span>
            <span>{row.business}</span>
            <span>{row.content_type}</span>
          </div>
          <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-stone-200">
            {row.content.length > 400 ? `${row.content.slice(0, 400)}…` : row.content}
          </p>
        </li>
      ))}
    </ul>
  );
}
