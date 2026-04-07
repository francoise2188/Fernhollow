"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { FERNHOLLOW_OPEN_CHAT_EVENT } from "@/lib/assets";

type Briefing = {
  id: string;
  agent: string;
  business: string;
  content_type: string;
  content: string;
  created_at: string;
  platform: string | null;
  status: string;
};

type Chime = {
  id: string;
  from_agent: string;
  to_agent: string;
  message: string;
  context_type: string;
  created_at: string;
};

type Tab = "draft" | "archive" | "chimes";

const GIRL_META: Record<string, { emoji: string; color: string; name: string }> = {
  clover: { emoji: "\u{1F33F}", color: "#56823c", name: "Clover" },
  rosie: { emoji: "\u{1F338}", color: "#c4687a", name: "Rosie" },
  scout: { emoji: "\u2699\uFE0F", color: "#7a6a3a", name: "Scout" },
  wren: { emoji: "\u2728", color: "#4a7a8a", name: "Wren" },
};

const ARCHIVE_ORDER = ["clover", "rosie", "scout", "wren"];

function BriefingCard({
  briefing,
  isArchive,
  onAct,
  expandedCard,
  setExpandedCard,
  feedbackNotes,
  setFeedbackNotes,
  stopSuggesting,
  setStopSuggesting,
}: {
  briefing: Briefing;
  isArchive: boolean;
  onAct: (
    id: string,
    status: "approved" | "dismissed",
    note?: string,
    stopSuggestion?: boolean,
  ) => void;
  expandedCard: string | null;
  setExpandedCard: (id: string | null) => void;
  feedbackNotes: Record<string, string>;
  setFeedbackNotes: Dispatch<SetStateAction<Record<string, string>>>;
  stopSuggesting: Record<string, boolean>;
  setStopSuggesting: Dispatch<SetStateAction<Record<string, boolean>>>;
}) {
  const meta = GIRL_META[briefing.agent] ?? {
    emoji: "\u{1F33F}",
    color: "#56823c",
    name: briefing.agent,
  };

  return (
    <div
      style={{
        background: isArchive ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.7)",
        border: `2px solid ${meta.color}${isArchive ? "18" : "30"}`,
        borderRadius: "16px",
        overflow: "hidden",
        opacity: isArchive ? 0.85 : 1,
      }}
    >
      <div
        style={{
          background: `${meta.color}${isArchive ? "08" : "12"}`,
          borderBottom: `1px solid ${meta.color}20`,
          padding: "0.6rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "1rem" }}>{meta.emoji}</span>
          <span style={{ fontWeight: 700, fontSize: "0.8rem", color: meta.color }}>
            {meta.name}
          </span>
          <span
            style={{
              fontSize: "0.65rem",
              background: `${meta.color}18`,
              color: meta.color,
              padding: "0.15rem 0.5rem",
              borderRadius: "20px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {briefing.content_type}
          </span>
          {isArchive && (
            <span
              style={{
                fontSize: "0.65rem",
                background:
                  briefing.status === "approved"
                    ? "rgba(86,130,60,0.15)"
                    : "rgba(139,109,56,0.1)",
                color: briefing.status === "approved" ? "#56823c" : "#8a7a5a",
                padding: "0.15rem 0.5rem",
                borderRadius: "20px",
                fontWeight: 600,
              }}
            >
              {briefing.status === "approved" ? "\u2726 approved" : "dismissed"}
            </span>
          )}
        </div>
        <span style={{ fontSize: "0.65rem", color: "#a09070" }}>
          {new Date(briefing.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div style={{ padding: "0.85rem 1rem" }}>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#3d3020",
            lineHeight: "1.65",
            whiteSpace: "pre-wrap",
            margin: 0,
          }}
        >
          {briefing.content}
        </p>
      </div>

      {!isArchive && (
        <div
          style={{
            padding: "0.6rem 1rem",
            borderTop: "1px solid rgba(139,109,56,0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {expandedCard === briefing.id && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <input
                type="text"
                placeholder="Optional note (why you approved/dismissed)..."
                value={feedbackNotes[briefing.id] ?? ""}
                onChange={(e) =>
                  setFeedbackNotes((prev) => ({
                    ...prev,
                    [briefing.id]: e.target.value,
                  }))
                }
                style={{
                  padding: "0.4rem 0.75rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(139,109,56,0.25)",
                  background: "rgba(255,255,255,0.8)",
                  fontSize: "0.78rem",
                  fontFamily: "Nunito, sans-serif",
                  color: "#3d3020",
                  outline: "none",
                }}
              />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.75rem",
                  color: "#8a7a5a",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={stopSuggesting[briefing.id] ?? false}
                  onChange={(e) =>
                    setStopSuggesting((prev) => ({
                      ...prev,
                      [briefing.id]: e.target.checked,
                    }))
                  }
                />
                Stop suggesting this type of idea
              </label>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => {
                const slugMap: Record<string, string> = {
                  clover: "clovers-house",
                  rosie: "rosies-cottage",
                  scout: "scouts-workshop",
                  wren: "wrens-house",
                };
                const slug = slugMap[briefing.agent] ?? "clovers-house";
                window.dispatchEvent(
                  new CustomEvent(FERNHOLLOW_OPEN_CHAT_EVENT, {
                    detail: {
                      slug,
                      briefingContext: briefing.content,
                      initialMessage:
                        "I just read your morning briefing and want to talk about it. What would your next steps be?",
                    },
                  }),
                );
              }}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                border: "1px solid rgba(86,130,60,0.3)",
                background: "transparent",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#56823c",
                cursor: "pointer",
                fontFamily: "Nunito, sans-serif",
              }}
            >
              {"\u{1F4AC} Talk to "}
              {GIRL_META[briefing.agent]?.name ?? briefing.agent}
            </button>

            <button
              type="button"
              onClick={() => {
                if (expandedCard !== briefing.id) {
                  setExpandedCard(briefing.id);
                } else {
                  onAct(
                    briefing.id,
                    "dismissed",
                    feedbackNotes[briefing.id],
                    stopSuggesting[briefing.id],
                  );
                  setExpandedCard(null);
                }
              }}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                border: "1px solid rgba(139,109,56,0.25)",
                background: "transparent",
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "#8a7a5a",
                cursor: "pointer",
                fontFamily: "Nunito, sans-serif",
              }}
            >
              {expandedCard === briefing.id ? "Confirm Dismiss" : "Dismiss"}
            </button>

            <button
              type="button"
              onClick={() => {
                if (expandedCard !== briefing.id) {
                  setExpandedCard(briefing.id);
                } else {
                  onAct(
                    briefing.id,
                    "approved",
                    feedbackNotes[briefing.id],
                    stopSuggesting[briefing.id],
                  );
                  setExpandedCard(null);
                }
              }}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                border: "none",
                background: "linear-gradient(135deg, #56823c, #3d6b28)",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#f0ead8",
                cursor: "pointer",
                fontFamily: "Nunito, sans-serif",
                boxShadow: "0 2px 6px rgba(61,107,40,0.25)",
              }}
            >
              {expandedCard === briefing.id
                ? "\u2726 Confirm Approve"
                : "\u2726 Approve"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function VillageSquare() {
  const [tab, setTab] = useState<Tab>("draft");
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chimes, setChimes] = useState<Chime[]>([]);
  const [loadingChimes, setLoadingChimes] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState<Record<string, string>>({});
  const [stopSuggesting, setStopSuggesting] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (tab !== "draft" && tab !== "archive") return;
    setLoading(true);
    fetch(`/api/briefings?status=${tab}`)
      .then((r) => r.json())
      .then((d) => setBriefings(d.briefings ?? []))
      .catch(() => setError("Could not load briefings."))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    if (tab !== "chimes") return;
    setLoadingChimes(true);
    fetch("/api/chimes")
      .then((r) => r.json())
      .then((d) => setChimes(d.chimes ?? []))
      .catch(() => setError("Could not load chimes."))
      .finally(() => setLoadingChimes(false));
  }, [tab]);

  const onTabChange = (next: Tab) => {
    setTab(next);
    setLoading(true);
    setError(null);
  };

  const onAct = async (
    id: string,
    status: "approved" | "dismissed",
    note?: string,
    stopSuggestion?: boolean,
  ) => {
    setBriefings((items) => items.filter((x) => x.id !== id));
    await fetch(`/api/briefings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        note: note?.trim() || undefined,
        stopSuggesting: stopSuggestion ?? false,
      }),
    });
  };

  const sortedBriefings = useMemo(
    () =>
      [...briefings].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [briefings],
  );

  const archiveGroups = useMemo(() => {
    if (tab !== "archive") return [] as Array<{ agent: string; rows: Briefing[] }>;

    const grouped: Record<string, Briefing[]> = {};
    for (const row of sortedBriefings) {
      const key = row.agent || "unknown";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    }

    const orderedAgents = [
      ...ARCHIVE_ORDER.filter((agent) => grouped[agent]?.length),
      ...Object.keys(grouped)
        .filter((agent) => !ARCHIVE_ORDER.includes(agent))
        .sort(),
    ];

    return orderedAgents.map((agent) => ({ agent, rows: grouped[agent] }));
  }, [tab, sortedBriefings]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "2px solid rgba(139,109,56,0.15)",
          paddingBottom: "0.75rem",
        }}
      >
        {(["draft", "archive"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTabChange(t)}
            style={{
              padding: "0.35rem 1rem",
              borderRadius: "20px",
              border: tab === t ? "none" : "1px solid rgba(139,109,56,0.25)",
              background:
                tab === t
                  ? "linear-gradient(135deg, #56823c, #3d6b28)"
                  : "transparent",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: tab === t ? "#f0ead8" : "#8a7a5a",
              cursor: "pointer",
              fontFamily: "Nunito, sans-serif",
              boxShadow:
                tab === t ? "0 2px 6px rgba(61,107,40,0.25)" : "none",
            }}
          >
            {t === "draft" ? "\u{1F33F} Inbox" : "\u{1F4CB} Archive"}
          </button>
        ))}
        <button
          key="chimes"
          type="button"
          onClick={() => {
            setTab("chimes");
            setError(null);
          }}
          style={{
            padding: "0.35rem 1rem",
            borderRadius: "20px",
            border: tab === "chimes" ? "none" : "1px solid rgba(139,109,56,0.25)",
            background:
              tab === "chimes"
                ? "linear-gradient(135deg, #c4687a, #a0455a)"
                : "transparent",
            fontSize: "0.78rem",
            fontWeight: 700,
            color: tab === "chimes" ? "#f0ead8" : "#8a7a5a",
            cursor: "pointer",
            fontFamily: "Nunito, sans-serif",
            boxShadow:
              tab === "chimes" ? "0 2px 6px rgba(164,69,90,0.25)" : "none",
          }}
        >
          {"\u{1F338} Chimes"}
        </button>
      </div>

      {loading && (tab === "draft" || tab === "archive") && (
        <p className="text-center text-sm italic" style={{ color: "#8a7a5a" }}>
          {"\u{1F33F} Loading..."}
        </p>
      )}

      {error && (
        <p className="text-center text-sm" style={{ color: "#c0392b" }}>
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        (tab === "draft" || tab === "archive") &&
        briefings.length === 0 && (
        <div className="py-8 text-center">
          <p style={{ fontSize: "2rem" }}>
            {tab === "draft" ? "\u{1F338}" : "\u{1F4CB}"}
          </p>
          <p className="mt-2 text-sm italic" style={{ color: "#8a7a5a" }}>
            {tab === "draft"
              ? "All caught up! The girls are working on tomorrow's briefings."
              : "No archived briefings yet."}
          </p>
        </div>
      )}

      {!loading &&
        !error &&
        tab === "draft" &&
        sortedBriefings.map((briefing) => (
          <BriefingCard
            key={briefing.id}
            briefing={briefing}
            isArchive={false}
            onAct={onAct}
            expandedCard={expandedCard}
            setExpandedCard={setExpandedCard}
            feedbackNotes={feedbackNotes}
            setFeedbackNotes={setFeedbackNotes}
            stopSuggesting={stopSuggesting}
            setStopSuggesting={setStopSuggesting}
          />
        ))}

      {!loading &&
        !error &&
        tab === "archive" &&
        archiveGroups.map((group) => {
          const meta = GIRL_META[group.agent] ?? {
            emoji: "\u{1F33F}",
            color: "#56823c",
            name: group.agent,
          };

          return (
            <div
              key={group.agent}
              style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.25rem 0.15rem",
                }}
              >
                <span style={{ fontSize: "0.95rem" }}>{meta.emoji}</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: meta.color }}>
                  {meta.name}
                </span>
                <span style={{ fontSize: "0.68rem", color: "#8a7a5a" }}>
                  {group.rows.length} item{group.rows.length === 1 ? "" : "s"}
                </span>
              </div>

              {group.rows.map((briefing) => (
                <BriefingCard
                  key={briefing.id}
                  briefing={briefing}
                  isArchive
                  onAct={onAct}
                  expandedCard={expandedCard}
                  setExpandedCard={setExpandedCard}
                  feedbackNotes={feedbackNotes}
                  setFeedbackNotes={setFeedbackNotes}
                  stopSuggesting={stopSuggesting}
                  setStopSuggesting={setStopSuggesting}
                />
              ))}
            </div>
          );
        })}

      {tab === "chimes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {loadingChimes && (
            <p className="text-center text-sm italic" style={{ color: "#8a7a5a" }}>
              {"\u{1F33F} Loading chimes\u2026"}
            </p>
          )}
          {!loadingChimes && chimes.length === 0 && (
            <div className="text-center py-8">
              <p style={{ fontSize: "2rem" }}>{"\u{1F338}"}</p>
              <p className="mt-2 text-sm italic" style={{ color: "#8a7a5a" }}>
                {
                  "No chimes yet \u2014 the girls will start talking after the next briefing!"
                }
              </p>
            </div>
          )}
          {!loadingChimes &&
            chimes.map((c) => {
              const from = GIRL_META[c.from_agent] ?? {
                emoji: "\u{1F33F}",
                color: "#56823c",
                name: c.from_agent,
              };
              const to = GIRL_META[c.to_agent] ?? {
                emoji: "\u{1F33F}",
                color: "#56823c",
                name: c.to_agent,
              };
              return (
                <div
                  key={c.id}
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(139,109,56,0.2)",
                    borderRadius: "14px",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    <span>{from.emoji}</span>
                    <span style={{ fontWeight: 700, color: from.color }}>{from.name}</span>
                    <span style={{ color: "#a09070" }}>{"\u2192"}</span>
                    <span>{to.emoji}</span>
                    <span style={{ fontWeight: 700, color: to.color }}>{to.name}</span>
                    <span
                      style={{
                        marginLeft: "auto",
                        color: "#a09070",
                        fontSize: "0.65rem",
                      }}
                    >
                      {new Date(c.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#3d3020",
                      lineHeight: "1.6",
                      margin: 0,
                    }}
                  >
                    {c.message}
                  </p>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
