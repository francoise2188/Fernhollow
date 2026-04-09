"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { LocationSlug } from "@/lib/locations";

type Row = { role: string; content: string };

/** Quick-pick emoji for chat — tap to insert at the cursor (or at the end). */
const CHAT_QUICK_EMOJIS = [
  "😊",
  "🥰",
  "😂",
  "🙌",
  "💛",
  "✨",
  "🌿",
  "🍄",
  "🌸",
  "🌼",
  "☕",
  "💌",
  "🎉",
  "💪",
  "🫶",
  "👏",
  "👍",
  "✅",
  "💭",
  "🔥",
  "🙏",
  "💫",
  "🌙",
  "🦋",
  "🍵",
  "🤍",
] as const;

function safeImageUrl(url: string): string | null {
  if (!url.startsWith("https://")) return null;
  return url;
}

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

function ChatWindowInner({
  slug,
  variant = "default",
  initialMessage,
  briefingContext,
}: {
  slug: LocationSlug;
  variant?: "default" | "dialogue";
  initialMessage?: string;
  briefingContext?: string;
}) {
  const hasSentInitial = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionAfterEmoji = useRef<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Row[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hasSentInitial.current = false;
  }, [slug, initialMessage, briefingContext]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/session?slug=${encodeURIComponent(slug)}`, {
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((d: { sessionId?: string; error?: string }) => {
        if (!cancelled && d.sessionId) {
          setSessionId(d.sessionId);
        }
      })
      .catch(() => {
        const key = `fh_session_${slug}`;
        let id = sessionStorage.getItem(key);
        if (!id) {
          id = crypto.randomUUID();
          sessionStorage.setItem(key, id);
        }
        if (!cancelled) setSessionId(id);
      });
    return () => {
      cancelled = true;
    };
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
        if (!cancelled) {
          if (briefingContext && rows.length === 0) {
            setMessages([{ role: "assistant", content: briefingContext }]);
          } else {
            setMessages(rows);
          }
        }
      } catch {
        if (!cancelled) setError("Could not load earlier messages.");
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, briefingContext]);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!sessionId || !trimmed) return;
      setInput("");
      setError(null);
      setMessages((m) => [...m, { role: "user", content: trimmed }]);
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          sessionId,
          message: trimmed,
          slug,
          briefingContext,
        }),
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
    },
    [sessionId, slug, briefingContext],
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    await sendText(text);
  }, [input, sendText]);

  const insertEmoji = useCallback(
    (emoji: string) => {
      const el = textareaRef.current;
      if (el && document.activeElement === el) {
        const start = el.selectionStart ?? input.length;
        const end = el.selectionEnd ?? input.length;
        const next = input.slice(0, start) + emoji + input.slice(end);
        selectionAfterEmoji.current = start + emoji.length;
        setInput(next);
      } else {
        setInput((prev) => prev + emoji);
        selectionAfterEmoji.current = null;
      }
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [input],
  );

  useLayoutEffect(() => {
    if (selectionAfterEmoji.current == null || !textareaRef.current) return;
    const pos = selectionAfterEmoji.current;
    selectionAfterEmoji.current = null;
    const ta = textareaRef.current;
    ta.setSelectionRange(pos, pos);
    ta.focus();
  }, [input]);

  useEffect(() => {
    if (
      !initialMessage?.trim() ||
      !sessionId ||
      loadingHistory ||
      hasSentInitial.current
    )
      return;
    hasSentInitial.current = true;
    setInput(initialMessage);
    const t = window.setTimeout(() => {
      void sendText(initialMessage.trim());
    }, 100);
    return () => window.clearTimeout(t);
  }, [initialMessage, sessionId, loadingHistory, sendText]);

  const outer =
    variant === "dialogue"
      ? "flex min-h-[320px] flex-col rounded-xl border-2 border-amber-900/20 bg-amber-50/40"
      : "flex min-h-[420px] flex-col rounded-2xl border border-stone-200 bg-white/90 dark:border-stone-700 dark:bg-stone-900/90";

  return (
    <div className={outer}>
      <div
        className={
          variant === "dialogue"
            ? "max-h-[min(50vh,420px)] flex-1 space-y-3 overflow-y-auto p-3 text-sm leading-relaxed"
            : "max-h-[min(60vh,520px)] flex-1 space-y-3 overflow-y-auto p-4 text-sm leading-relaxed"
        }
      >
        {loadingHistory ? (
          <p className={variant === "dialogue" ? "text-stone-500" : "text-stone-500"}>
            Loading your conversation…
          </p>
        ) : null}
        {!loadingHistory && messages.length === 0 && variant === "dialogue" ? (
          <p className="text-center text-sm text-stone-400 mt-8 italic">
            🌿 Say hello to start the conversation…
          </p>
        ) : null}
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            style={
              m.role === "user" && variant === "dialogue"
                ? { backgroundColor: "#d4e8c2" }
                : {}
            }
            className={
              m.role === "user"
                ? variant === "dialogue"
                  ? "ml-8 rounded-2xl rounded-br-sm px-4 py-3 text-stone-700 border border-green-200/50"
                  : "ml-8 rounded-2xl rounded-br-sm bg-emerald-100 px-4 py-3 text-stone-900 dark:bg-emerald-900/40 dark:text-stone-50"
                : variant === "dialogue"
                  ? "mr-8 rounded-2xl rounded-bl-sm bg-amber-50 px-4 py-3 text-stone-700 border border-amber-200/60"
                  : "mr-8 rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-3 text-stone-800 dark:bg-stone-800 dark:text-stone-100"
            }
          >
            {m.content.includes("![") ? (
              <div>
                {m.content.split(/!\[([^\]]*)\]\(([^)]+)\)/).map((part, idx) => {
                  if (idx % 3 === 0) {
                    return (
                      <span key={idx} className="whitespace-pre-wrap">
                        {part}
                      </span>
                    );
                  }
                  if (idx % 3 === 2) {
                    const safeUrl = safeImageUrl(part);
                    if (!safeUrl) {
                      return (
                        <span key={idx} className="whitespace-pre-wrap">
                          {`[image blocked: invalid url] ${part}`}
                        </span>
                      );
                    }
                    return (
                      <span
                        key={idx}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.35rem",
                          marginTop: "0.5rem",
                        }}
                      >
                        <img
                          src={safeUrl}
                          alt="Generated design"
                          style={{
                            maxWidth: "100%",
                            borderRadius: "8px",
                            border: "1px solid rgba(139,109,56,0.2)",
                          }}
                        />
                        <a
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "0.75rem",
                            color: "#56823c",
                            textDecoration: "underline",
                            width: "fit-content",
                          }}
                        >
                          Open image
                        </a>
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <span className="whitespace-pre-wrap">{m.content}</span>
            )}
          </div>
        ))}
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0",
            }}
          >
            <span
              style={{
                fontSize: "1.1rem",
                display: "inline-block",
                animation: "fernhollow-bounce 1.2s ease-in-out infinite",
              }}
            >
              🍄
            </span>
            <span
              style={{
                fontSize: "1.1rem",
                display: "inline-block",
                animation: "fernhollow-bounce 1.2s ease-in-out infinite",
                animationDelay: "0.2s",
              }}
            >
              🌿
            </span>
            <span
              style={{
                fontSize: "1.1rem",
                display: "inline-block",
                animation: "fernhollow-bounce 1.2s ease-in-out infinite",
                animationDelay: "0.4s",
              }}
            >
              🍄
            </span>
            <style>{`
              @keyframes fernhollow-bounce {
                0%, 100% { transform: translateY(0); opacity: 0.5; }
                50% { transform: translateY(-5px); opacity: 1; }
              }
            `}</style>
          </div>
        )}
      </div>
      {error ? (
        <p
          className={
            variant === "dialogue"
              ? "border-t border-amber-900/15 px-4 py-2 text-sm text-rose-600"
              : "border-t border-stone-200 px-4 py-2 text-sm text-rose-600 dark:border-stone-700 dark:text-rose-400"
          }
        >
          {error}
        </p>
      ) : null}
      <div
        className={
          variant === "dialogue"
            ? "flex gap-2 border-t border-amber-900/15 p-3"
            : "flex gap-2 border-t border-stone-200 p-3 dark:border-stone-700"
        }
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <textarea
            ref={textareaRef}
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
            className={
              variant === "dialogue"
                ? "min-h-[44px] w-full resize-none rounded-xl border border-amber-900/20 bg-white/80 px-3 py-2 text-stone-800 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-[Nunito,sans-serif]"
                : "min-h-[44px] w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-50"
            }
            disabled={loading || !sessionId}
          />
          <div
            className="flex max-h-[4.5rem] flex-wrap gap-1 overflow-y-auto sm:max-h-none"
            role="group"
            aria-label="Emoji quick picks"
          >
            {CHAT_QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                disabled={loading || !sessionId}
                title={`Add ${emoji}`}
                onClick={() => insertEmoji(emoji)}
                className={
                  variant === "dialogue"
                    ? "rounded-lg px-1.5 py-0.5 text-lg leading-none text-stone-700 transition hover:bg-amber-900/10 disabled:opacity-40"
                    : "rounded-lg px-1.5 py-0.5 text-lg leading-none text-stone-700 transition hover:bg-stone-200 disabled:opacity-40 dark:text-stone-200 dark:hover:bg-stone-800"
                }
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading || !sessionId || !input.trim()}
          style={variant === "dialogue" ? { fontFamily: 'Nunito, sans-serif' } : {}}
          className={
            variant === "dialogue"
              ? "self-end rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              : "self-end rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          }
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

export function ChatWindow({
  slug,
  variant = "default",
  initialMessage,
  briefingContext,
}: {
  slug: LocationSlug;
  variant?: "default" | "dialogue";
  initialMessage?: string;
  briefingContext?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ChatSkeleton />;
  }

  return (
    <ChatWindowInner
      slug={slug}
      variant={variant}
      initialMessage={initialMessage}
      briefingContext={briefingContext}
    />
  );
}
