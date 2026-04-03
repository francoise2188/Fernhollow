"use client";

import { useCallback, useEffect, useState } from "react";
import type { LocationSlug } from "@/lib/locations";

type Row = { role: string; content: string };

/** Same markup on server and first client paint to avoid hydration mismatches. */
function ChatSkeleton() {
  return (
    <div className="flex min-h-[420px] flex-col rounded-2xl border border-stone-200 bg-white/90 dark:border-stone-700 dark:bg-stone-900/90">
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-stone-500">
        Loading chat…
      </div>
      <div className="flex gap-2 border-t border-stone-200 p-3 dark:border-stone-700">
        <div
          className="h-[44px] flex-1 rounded-xl bg-stone-100 dark:bg-stone-800"
          aria-hidden
        />
        <div
          className="h-10 w-20 shrink-0 rounded-xl bg-stone-200 dark:bg-stone-700"
          aria-hidden
        />
      </div>
    </div>
  );
}

function ChatWindowInner({ slug }: { slug: LocationSlug }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Row[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = `fh_session_${slug}`;
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(key, id);
    }
    setSessionId(id);
  }, [slug]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      setLoadingHistory(true);
      try {
        const res = await fetch(
          `/api/chat?sessionId=${encodeURIComponent(sessionId)}`,
        );
        if (!res.ok) throw new Error("load");
        const data = await res.json();
        const rows: Row[] = (data.messages ?? []).map(
          (m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          }),
        );
        if (!cancelled) setMessages(rows);
      } catch {
        if (!cancelled) setError("Could not load earlier messages.");
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const send = useCallback(async () => {
    if (!sessionId || !input.trim()) return;
    const text = input.trim();
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text, slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Send failed",
        );
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply as string },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, slug, input]);

  return (
    <div className="flex min-h-[420px] flex-col rounded-2xl border border-stone-200 bg-white/90 dark:border-stone-700 dark:bg-stone-900/90">
      <div className="max-h-[min(60vh,520px)] flex-1 space-y-3 overflow-y-auto p-4 text-sm leading-relaxed">
        {loadingHistory ? (
          <p className="text-stone-500">Loading your conversation…</p>
        ) : null}
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl rounded-br-sm bg-emerald-100 px-4 py-3 text-stone-900 dark:bg-emerald-900/40 dark:text-stone-50"
                : "mr-8 rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-3 text-stone-800 dark:bg-stone-800 dark:text-stone-100"
            }
          >
            <span className="whitespace-pre-wrap">{m.content}</span>
          </div>
        ))}
      </div>
      {error ? (
        <p className="border-t border-stone-200 px-4 py-2 text-sm text-rose-600 dark:border-stone-700 dark:text-rose-400">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2 border-t border-stone-200 p-3 dark:border-stone-700">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          placeholder="Say something…"
          className="min-h-[44px] flex-1 resize-none rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-50"
          disabled={loading || !sessionId}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading || !sessionId || !input.trim()}
          className="self-end rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

export function ChatWindow({ slug }: { slug: LocationSlug }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ChatSkeleton />;
  }

  return <ChatWindowInner slug={slug} />;
}
