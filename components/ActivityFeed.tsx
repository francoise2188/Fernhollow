"use client";

import { useEffect, useState } from "react";

type Task = {
  id?: string;
  agent: string;
  task_type: string;
  status: "running" | "complete" | "failed";
  run_at: string | null;
  completed_at: string | null;
  output: string | null;
};

type FailureTask = Task & { id: string };

const GIRL_META: Record<string, { emoji: string; color: string; name: string }> = {
  clover: { emoji: "\u{1F340}", color: "#56823c", name: "Clover" },
  rosie: { emoji: "\u{1F338}", color: "#c4687a", name: "Rosie" },
  scout: { emoji: "\u2699\uFE0F", color: "#7a6a3a", name: "Scout" },
  wren: { emoji: "\u2728", color: "#4a7a8a", name: "Wren" },
};

const TASK_LABELS: Record<string, string> = {
  morning_briefing: "writing morning briefing",
  weekly_content: "drafting weekly content",
  income_report: "running income report",
  community_scan: "scanning the community",
  auto_draft: "drafting content",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const FAILURES_HIDE_BEFORE_KEY = "fh_activity_failures_hide_before_ms";

function failureSortTime(f: FailureTask): number {
  const raw = f.completed_at ?? f.run_at;
  if (!raw) return 0;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function ActivityFeed() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [failures, setFailures] = useState<FailureTask[]>([]);
  const [hideFailuresBeforeMs, setHideFailuresBeforeMs] = useState(0);
  const [, setTick] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAILURES_HIDE_BEFORE_KEY);
      const n = raw ? parseInt(raw, 10) : 0;
      if (Number.isFinite(n) && n > 0) setHideFailuresBeforeMs(n);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const fetchTasks = () => {
      fetch("/api/activity")
        .then((r) => r.json())
        .then((d) => {
          setTasks(d.tasks ?? []);
          setFailures(d.recentFailures ?? []);
        })
        .catch(() => {});
    };
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const visibleFailures = failures.filter(
    (f) => failureSortTime(f) > hideFailuresBeforeMs,
  );

  const dismissFailureAlerts = () => {
    const now = Date.now();
    try {
      localStorage.setItem(FAILURES_HIDE_BEFORE_KEY, String(now));
    } catch {
      /* ignore */
    }
    setHideFailuresBeforeMs(now);
  };

  if (tasks.length === 0 && visibleFailures.length === 0) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700&display=swap');

        .activity-feed {
          font-family: 'Nunito', sans-serif;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.35rem 1rem;
          background: rgba(20, 18, 10, 0.75);
          backdrop-filter: blur(8px);
          border-top: 1px solid rgba(139,109,56,0.2);
          overflow-x: auto;
          scrollbar-width: none;
          white-space: nowrap;
          pointer-events: auto;
        }

        .activity-feed::-webkit-scrollbar { display: none; }

        .activity-label {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(139,109,56,0.6);
          flex-shrink: 0;
        }

        .activity-item {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          flex-shrink: 0;
        }

        .activity-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .activity-dot.running {
          animation: activity-pulse 1.5s ease-in-out infinite;
        }

        .activity-name {
          font-size: 0.7rem;
          font-weight: 700;
        }

        .activity-task {
          font-size: 0.7rem;
          color: rgba(240,234,216,0.6);
          font-weight: 500;
        }

        .activity-time {
          font-size: 0.65rem;
          color: rgba(139,109,56,0.5);
          font-weight: 500;
        }

        .activity-divider {
          color: rgba(139,109,56,0.25);
          font-size: 0.6rem;
          flex-shrink: 0;
        }

        @keyframes activity-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .activity-failures {
          font-family: 'Nunito', sans-serif;
          padding: 0.4rem 1rem 0.15rem;
          background: rgba(120, 30, 30, 0.45);
          border-top: 1px solid rgba(192, 57, 43, 0.5);
          color: #f5e0dc;
          font-size: 0.68rem;
          line-height: 1.45;
          pointer-events: auto;
          max-height: 5.5rem;
          overflow-y: auto;
        }

        .activity-failures-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.1rem;
        }

        .activity-failures-dismiss {
          flex-shrink: 0;
          font-family: inherit;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          border: 1px solid rgba(245, 224, 220, 0.45);
          background: rgba(40, 12, 12, 0.35);
          color: #f5e0dc;
          cursor: pointer;
        }

        .activity-failures-dismiss:hover {
          background: rgba(60, 20, 20, 0.55);
        }

        .activity-failures-hint {
          font-size: 0.58rem;
          opacity: 0.75;
          margin-top: 0.15rem;
        }
      `}</style>

      {visibleFailures.length > 0 && (
        <div className="activity-failures">
          <div className="activity-failures-header">
            <strong style={{ letterSpacing: "0.06em" }}>Automation needs attention</strong>
            <button
              type="button"
              className="activity-failures-dismiss"
              onClick={dismissFailureAlerts}
            >
              Hide for now
            </button>
          </div>
          <div className="activity-failures-hint">
            Last 24h only — hides until a newer failure happens.
          </div>
          {visibleFailures.map((f) => {
            const label = TASK_LABELS[f.task_type] ?? f.task_type.replace(/_/g, " ");
            const hint = f.output ? `: ${f.output.slice(0, 120)}${f.output.length > 120 ? "…" : ""}` : "";
            return (
              <div key={f.id} style={{ marginTop: "0.25rem" }}>
                {GIRL_META[f.agent]?.emoji ?? "\u{1F33F}"}{" "}
                <span style={{ fontWeight: 700 }}>{GIRL_META[f.agent]?.name ?? f.agent}</span>
                {" — "}
                {label}
                {hint}
              </div>
            );
          })}
        </div>
      )}

      {tasks.length > 0 ? (
      <div className="activity-feed">
        <span className="activity-label">village</span>
        {tasks.map((t, i) => {
          const meta = GIRL_META[t.agent] ?? {
            emoji: "\u{1F33F}",
            color: "#56823c",
            name: t.agent,
          };
          const label = TASK_LABELS[t.task_type] ?? t.task_type.replace(/_/g, " ");
          const timeStr =
            t.status === "running"
              ? "working now"
              : timeAgo(t.completed_at ?? t.run_at) || "recently";
          const statusVerb =
            t.status === "running"
              ? label
              : t.status === "complete"
                ? `finished ${label}`
                : `couldn't finish ${label}`;

          return (
            <span
              key={t.id ?? `${t.agent}-${t.run_at ?? i}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
            >
              {i > 0 && <span className="activity-divider">·</span>}
              <span className="activity-item">
                <span
                  className={`activity-dot ${t.status}`}
                  style={{
                    background:
                      t.status === "running"
                        ? meta.color
                        : t.status === "complete"
                          ? "#56823c"
                          : "#c0392b",
                  }}
                />
                <span className="activity-name" style={{ color: meta.color }}>
                  {meta.emoji} {meta.name}
                </span>
                <span className="activity-task">{statusVerb}</span>
                <span className="activity-time">{timeStr}</span>
              </span>
            </span>
          );
        })}
      </div>
      ) : null}
    </>
  );
}
