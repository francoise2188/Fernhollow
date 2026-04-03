"use client";

import { useCallback, useEffect, useState } from "react";
import { AFFILIATE_SLUGS } from "@/lib/affiliate-links";

type Entry = {
  id: string;
  created_at: string;
  type: string;
  category: string;
  amount_cents: number;
  description: string;
  business: string | null;
  month: string;
};

function usd(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

export function TreasuryDashboard() {
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [totals, setTotals] = useState({
    income_cents: 0,
    expense_cents: 0,
    net_cents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expenseDesc, setExpenseDesc] = useState("Anthropic API");
  const [expenseDollars, setExpenseDollars] = useState("");
  const [expenseCat, setExpenseCat] = useState("api_cost");
  const [saving, setSaving] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportPreview, setReportPreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/treasury?month=${encodeURIComponent(month)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Load failed");
      setEntries(data.entries ?? []);
      setTotals(
        data.totals ?? {
          income_cents: 0,
          expense_cents: 0,
          net_cents: 0,
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load treasury.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "expense",
          category: expenseCat,
          amount_dollars: expenseDollars,
          description: expenseDesc,
          month,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      setExpenseDollars("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function generateWeeklyReport() {
    setReportBusy(true);
    setReportPreview(null);
    setError(null);
    try {
      const res = await fetch("/api/reports/weekly-income", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Report failed");
      setReportPreview(typeof data.report === "string" ? data.report : null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Report failed");
    } finally {
      setReportBusy(false);
    }
  }

  const payhipProduct = process.env.NEXT_PUBLIC_PAYHIP_PRICING_GUIDE_URL;

  return (
    <div className="mb-8 space-y-6">
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-5 dark:border-amber-900/60 dark:bg-amber-950/40">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
          Wren&apos;s treasury
        </h2>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Income and expenses flowing into the village fund. Wren builds her own
          streams too (not only Blirt, Saudade, PrintBooth). Payhip can log
          sales here via webhook.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm text-stone-600 dark:text-stone-400">
            Month
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="ml-2 rounded-lg border border-stone-200 bg-white px-2 py-1 text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
          </label>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-stone-300 px-3 py-1 text-sm dark:border-stone-600"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-stone-500">Loading…</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/80 p-3 dark:bg-stone-900/60">
              <p className="text-xs uppercase text-stone-500">Income</p>
              <p className="text-xl font-semibold text-emerald-800 dark:text-emerald-300">
                {usd(totals.income_cents)}
              </p>
            </div>
            <div className="rounded-xl bg-white/80 p-3 dark:bg-stone-900/60">
              <p className="text-xs uppercase text-stone-500">Expenses</p>
              <p className="text-xl font-semibold text-rose-800 dark:text-rose-300">
                {usd(totals.expense_cents)}
              </p>
            </div>
            <div className="rounded-xl bg-white/80 p-3 dark:bg-stone-900/60">
              <p className="text-xs uppercase text-stone-500">Net</p>
              <p className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                {usd(totals.net_cents)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white/90 p-5 dark:border-stone-700 dark:bg-stone-900/80">
        <h3 className="font-medium text-stone-900 dark:text-stone-50">
          Log an expense (e.g. API bill)
        </h3>
        <form onSubmit={addExpense} className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <input
            type="text"
            value={expenseDesc}
            onChange={(e) => setExpenseDesc(e.target.value)}
            placeholder="Description"
            className="min-w-[160px] flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
          />
          <input
            type="text"
            inputMode="decimal"
            value={expenseDollars}
            onChange={(e) => setExpenseDollars(e.target.value)}
            placeholder="Amount USD"
            className="w-28 rounded-lg border border-stone-200 px-3 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
          />
          <select
            value={expenseCat}
            onChange={(e) => setExpenseCat(e.target.value)}
            className="rounded-lg border border-stone-200 px-2 py-2 text-sm dark:border-stone-600 dark:bg-stone-950"
          >
            <option value="api_cost">API cost</option>
            <option value="hosting">Hosting</option>
            <option value="subscription">Subscription</option>
            <option value="digital_product">Digital product (refund)</option>
          </select>
          <button
            type="submit"
            disabled={saving || !expenseDollars.trim()}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900"
          >
            {saving ? "Saving…" : "Add expense"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white/90 p-5 dark:border-stone-700 dark:bg-stone-900/80">
        <h3 className="font-medium text-stone-900 dark:text-stone-50">
          Weekly income note (Wren)
        </h3>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Drafts a short note from this month&apos;s treasury and saves it under
          content (draft) for you to use in the village or garden.
        </p>
        <button
          type="button"
          onClick={() => void generateWeeklyReport()}
          disabled={reportBusy}
          className="mt-3 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700"
        >
          {reportBusy ? "Writing…" : "Generate weekly income note"}
        </button>
        {reportPreview ? (
          <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-stone-100 p-3 text-sm text-stone-800 dark:bg-stone-950 dark:text-stone-200">
            {reportPreview}
          </pre>
        ) : null}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white/90 p-5 dark:border-stone-700 dark:bg-stone-900/80">
        <h3 className="font-medium text-stone-900 dark:text-stone-50">
          Tools and links
        </h3>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-emerald-800 dark:text-emerald-300">
          {payhipProduct ? (
            <li>
              <a
                href={payhipProduct}
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                Pricing guide (Payhip product)
              </a>
            </li>
          ) : (
            <li>
              Set{" "}
              <code className="rounded bg-stone-100 px-1 dark:bg-stone-800">
                NEXT_PUBLIC_PAYHIP_PRICING_GUIDE_URL
              </code>{" "}
              to your Payhip listing.
            </li>
          )}
          <li>
            <a href="/products/pricing-guide" className="underline">
              Product page (shareable)
            </a>
          </li>
          <li>
            <a href="/waitlist" className="underline">
              Fernhollow waitlist
            </a>
          </li>
        </ul>
        <p className="mt-3 text-xs text-stone-500">
          Tracked affiliate clicks (logs $0 income rows):{" "}
          {AFFILIATE_SLUGS.map((s) => (
            <a
              key={s}
              href={`/api/r/${s}`}
              className="mr-2 text-emerald-700 underline dark:text-emerald-400"
            >
              {s}
            </a>
          ))}
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white/90 p-5 dark:border-stone-700 dark:bg-stone-900/80">
        <h3 className="font-medium text-stone-900 dark:text-stone-50">
          This month&apos;s lines
        </h3>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No rows yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {entries.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap justify-between gap-2 border-b border-stone-100 pb-2 dark:border-stone-800"
              >
                <span className="text-stone-600 dark:text-stone-400">
                  {r.type} · {r.category}
                  {r.business ? ` · ${r.business}` : ""}
                </span>
                <span
                  className={
                    r.type === "income"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-rose-700 dark:text-rose-400"
                  }
                >
                  {r.type === "expense" ? "-" : ""}
                  {usd(r.amount_cents)}
                </span>
                <span className="w-full text-stone-500">{r.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
