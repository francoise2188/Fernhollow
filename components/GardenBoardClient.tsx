"use client";

import { useEffect, useState } from "react";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { useFernhollowToast } from "@/components/ToastProvider";

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

/** Readable line for badges — matches VillageSquare `platformLabel` spirit. */
function rowKindLabel(row: GardenRow): string {
  const { platform, content_type: ct } = row;
  if (ct === "fb_post") {
    if (platform === "facebook_group") return "📣 Facebook group post — tap copy for full text";
    if (platform === "facebook") return "📘 Facebook page post — tap copy for full text";
    return "📘 Facebook post — tap copy for full text";
  }
  if (platform === "facebook_group") return "📣 Magnet Makers Collective";
  if (platform === "facebook") return "📘 Facebook Page";
  if (platform === "instagram") return "📸 Instagram";
  if (ct === "video_idea") return "🎬 Video/Carousel idea";
  if (ct === "blog_post") return "📝 Blog draft";
  if (platform === "printbooth") return "🌐 PrintBooth Blog";
  if (platform === "blirt") return "🌐 Blirt Blog";
  return [platform, ct].filter(Boolean).join(" · ") || ct;
}

/**
 * Plain text for display + copy. Parses JSON rows (blog, image, spreadsheet) so you don't see raw `{"type":...`.
 */
function getDisplayText(row: GardenRow): string {
  const { content, content_type: ct } = row;
  if (!content?.trim()) return "(No text saved for this row.)";

  if (ct === "blog_post" || ct === "image" || ct === "spreadsheet") {
    try {
      const p = JSON.parse(content) as Record<string, unknown>;
      if (ct === "blog_post") {
        if (typeof p.displayText === "string" && p.displayText.trim())
          return p.displayText;
        const title = String(p.title ?? "");
        const excerpt = String(p.excerpt ?? p.preview ?? "");
        const body = String((p as { body?: string }).body ?? "");
        const parts = [title, excerpt, body].filter((s) => s.trim());
        return parts.join("\n\n") || content;
      }
      if (ct === "image") {
        const prompt = String((p as { prompt?: string }).prompt ?? "");
        const url = String((p as { imageUrl?: string }).imageUrl ?? "");
        return [prompt, url].filter(Boolean).join("\n\n") || content;
      }
      if (ct === "spreadsheet") {
        const fileName = String((p as { fileName?: string }).fileName ?? "");
        const desc = String((p as { description?: string }).description ?? "");
        const fileUrl = String((p as { fileUrl?: string }).fileUrl ?? "");
        return [fileName, desc, fileUrl].filter(Boolean).join("\n") || content;
      }
    } catch {
      /* use raw */
    }
  }

  return content;
}

/** For Facebook drafts, copy only the post body (skip the scout header line). */
function getCopyPayload(row: GardenRow): string {
  const text = getDisplayText(row);
  if (row.content_type !== "fb_post") return text;
  const lines = text.split("\n");
  if (lines.length >= 2 && /^(📣|👥|📘)/u.test(lines[0] ?? "")) {
    return lines.slice(1).join("\n").trim() || text;
  }
  return text;
}

/** Client garden board for game overlay (same data as server GardenBoard). */
export function GardenBoardClient() {
  const { toast } = useFernhollowToast();
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
    <ul className="max-h-[min(52vh,420px)] space-y-3 overflow-y-auto pr-1" aria-label="Garden content">
      {rows.map((row) => {
        const display = getDisplayText(row);
        const copyPayload = getCopyPayload(row);
        return (
          <li
            key={row.id}
            className="rounded-xl border border-stone-700/80 bg-stone-900/80 p-3 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-stone-500">
              <span
                className={`rounded-full px-2 py-0.5 ${statusStyle(row.status)}`}
              >
                {row.status}
              </span>
              <span className="normal-case text-stone-300">{row.business}</span>
              <span className="normal-case text-emerald-200/90">
                {rowKindLabel(row)}
              </span>
              <span className="normal-case text-stone-500">· {row.agent}</span>
            </div>
            {row.scheduled_at ? (
              <p className="mt-1 text-xs text-stone-500">
                Scheduled:{" "}
                {new Date(row.scheduled_at).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            ) : null}

            <div
              className="mt-2 max-h-[min(220px,40vh)] overflow-y-auto rounded-lg border border-stone-600/60 bg-stone-950/70 p-3"
              style={{ touchAction: "pan-y" }}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-100">
                {display}
              </p>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-full border border-emerald-700/60 bg-emerald-900/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-800/50"
                style={{ touchAction: "manipulation" }}
                onClick={async () => {
                  try {
                    await copyTextToClipboard(copyPayload);
                    toast("Copied — paste into Facebook or your notes.");
                  } catch (e) {
                    toast(
                      e instanceof Error ? e.message : "Could not copy. Tap the dialog once, then try again.",
                    );
                  }
                }}
              >
                {"\u{1F4CB} Copy text"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
