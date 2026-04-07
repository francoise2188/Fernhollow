"use client";

import { useEffect, useMemo, useState } from "react";

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

type Tab = "draft" | "archive";

const GIRL_META: Record<string, { emoji: string; color: string; name: string }> = {
  clover: { emoji: "🍀", color: "#56823c", name: "Clover" },
  rosie: { emoji: "🌸", color: "#c4687a", name: "Rosie" },
  scout: { emoji: "⚙️", color: "#7a6a3a", name: "Scout" },
  wren: { emoji: "✨", color: "#4a7a8a", name: "Wren" },
};

const ARCHIVE_ORDER = ["clover", "rosie", "scout", "wren"];

function BriefingCard({
  briefing,
  isArchive,
  onAct,
}: {
  briefing: Briefing;
  isArchive: boolean;
  onAct: (id: string, status: "approved" | "dismissed") => void;
}) {
  const meta = GIRL_META[briefing.agent] ?? {
    emoji: "🌿",
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
              {briefing.status === "approved" ? "✦ approved" : "dismissed"}
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
            gap: "0.5rem",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={() => onAct(briefing.id, "dismissed")}
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
            Dismiss
          </button>
          <button
            type="button"
            onClick={() => onAct(briefing.id, "approved")}
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
            ✦ Approve
          </button>
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

  useEffect(() => {
    fetch(`/api/briefings?status=${tab}`)
      .then((r) => r.json())
      .then((d) => setBriefings(d.briefings ?? []))
      .catch(() => setError("Could not load briefings."))
      .finally(() => setLoading(false));
  }, [tab]);

  const onTabChange = (next: Tab) => {
    setTab(next);
    setLoading(true);
    setError(null);
  };

  const onAct = async (id: string, status: "approved" | "dismissed") => {
    setBriefings((items) => items.filter((x) => x.id !== id));
    await fetch(`/api/briefings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
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
            {t === "draft" ? "🌿 Inbox" : "📋 Archive"}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-center text-sm italic" style={{ color: "#8a7a5a" }}>
          🌿 Loading...
        </p>
      )}

      {error && (
        <p className="text-center text-sm" style={{ color: "#c0392b" }}>
          {error}
        </p>
      )}

      {!loading && !error && briefings.length === 0 && (
        <div className="py-8 text-center">
          <p style={{ fontSize: "2rem" }}>{tab === "draft" ? "🌸" : "📋"}</p>
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
          />
        ))}

      {!loading &&
        !error &&
        tab === "archive" &&
        archiveGroups.map((group) => {
          const meta = GIRL_META[group.agent] ?? {
            emoji: "🌿",
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
                />
              ))}
            </div>
          );
        })}
    </div>
  );
}
