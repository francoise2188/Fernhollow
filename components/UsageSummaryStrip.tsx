"use client";

import { useEffect, useState } from "react";

type Summary = {
  windowDays: number;
  totalUsdEst: number;
  events: number;
  byService: Record<string, number>;
  note?: string;
};

export function UsageSummaryStrip() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/usage/summary")
        .then((r) => r.json())
        .then((d) => {
          if (d.totalUsdEst !== undefined) setData(d);
        })
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 120_000);
    return () => window.clearInterval(id);
  }, []);

  if (!data || data.events === 0) return null;

  const fal = data.byService?.fal ?? 0;
  const anth = data.byService?.anthropic ?? 0;

  return (
    <div
      className="pointer-events-auto rounded-full border border-stone-600/40 bg-stone-900/80 px-3 py-1.5 text-[0.65rem] text-stone-300"
      style={{ fontFamily: "Nunito, sans-serif" }}
      title={data.note ?? ""}
    >
      ~${data.totalUsdEst.toFixed(2)} / {data.windowDays}d est.
      {anth > 0 || fal > 0 ? (
        <span className="text-stone-500">
          {" "}
          (Claude ~${anth.toFixed(2)}, fal ~${fal.toFixed(2)})
        </span>
      ) : null}
    </div>
  );
}
