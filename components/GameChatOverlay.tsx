"use client";

import { useCallback, useEffect } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { GardenBoardClient } from "@/components/GardenBoardClient";
import { TreasuryDashboard } from "@/components/TreasuryDashboard";
import { useFernhollowToast } from "@/components/ToastProvider";
import { UsageSummaryStrip } from "@/components/UsageSummaryStrip";
import { VillageSquare } from "@/components/VillageSquare";
import { LOCATIONS, type LocationSlug } from "@/lib/locations";

type Props = {
  slug: LocationSlug;
  onClose: () => void;
  initialMessage?: string;
  briefingContext?: string;
};

export function GameChatOverlay({
  slug,
  onClose,
  initialMessage,
  briefingContext,
}: Props) {
  const { toast } = useFernhollowToast();
  const meta = LOCATIONS[slug];

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onKey]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');

        .fh-overlay-wrap {
          font-family: 'Nunito', sans-serif;
        }

        .fh-window {
          background: rgba(240, 235, 220, 0.98);
          border-radius: 20px;
          box-shadow:
            0 0 0 3px rgba(139,109,56,0.45),
            0 0 0 7px rgba(139,109,56,0.12),
            0 24px 60px rgba(0,0,0,0.55);
          overflow: hidden;
          position: relative;
        }

        .fh-window::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        .fh-header {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 1rem 1.25rem 0.9rem;
          border-bottom: 2px solid rgba(139,109,56,0.2);
          background: linear-gradient(to bottom, rgba(86,130,60,0.08), transparent);
        }

        .fh-header-left {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .fh-eyebrow {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #7a5c2e;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .fh-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #2d4a1e;
          margin: 0;
          line-height: 1.2;
        }

        .fh-sublabel {
          font-size: 0.78rem;
          color: #7a8c6a;
          font-weight: 500;
        }

        .fh-close-btn {
          flex-shrink: 0;
          padding: 0.4rem 0.9rem;
          border-radius: 20px;
          border: 2px solid rgba(139,109,56,0.35);
          background: rgba(255,255,255,0.6);
          font-family: 'Nunito', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          color: #5a4020;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          letter-spacing: 0.02em;
        }

        .fh-close-btn:hover {
          background: rgba(255,255,255,0.9);
          transform: scale(1.03);
        }

        .fh-fresh-btn {
          padding: 0.25rem 0.6rem;
          border-radius: 20px;
          border: 1px solid rgba(139,109,56,0.2);
          background: transparent;
          font-size: 0.65rem;
          font-weight: 600;
          color: #8a7a5a;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          flex-shrink: 0;
        }

        .fh-fresh-btn:hover {
          background: rgba(255,255,255,0.5);
        }

        .fh-body {
          position: relative;
          z-index: 1;
          padding: 1rem 1.25rem;
          overflow-y: auto;
          min-height: 0;
          flex: 1;
        }

        .fh-backdrop {
          position: absolute;
          inset: 0;
          cursor: default;
          background: rgba(10,20,10,0.6);
          backdrop-filter: blur(3px);
        }

        .fh-deco-strip {
          text-align: center;
          padding: 0.4rem;
          background: linear-gradient(to right, rgba(86,130,60,0.06), rgba(86,130,60,0.12), rgba(86,130,60,0.06));
          border-bottom: 1px solid rgba(139,109,56,0.15);
          font-size: 0.65rem;
          letter-spacing: 0.3em;
          color: rgba(139,109,56,0.5);
        }
      `}</style>

      <div
        className="fh-overlay-wrap fixed inset-0 z-[55] flex items-end justify-center pb-6 pt-16 sm:pb-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fh-dialogue-title"
        style={{ pointerEvents: "auto" }}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="fh-backdrop"
          aria-label="Close and return to the village"
          onClick={onClose}
          style={{ pointerEvents: "all" }}
        />
        <div
          className="fh-window relative z-10 mx-3 flex max-h-[min(85dvh,720px)] w-full max-w-2xl flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="fh-deco-strip">🍄 · 🌿 · 🌸 · 🍃 · 🌼 · 🍄</div>
          <div className="fh-header">
            <div className="fh-header-left">
              <p className="fh-eyebrow">
                <span>🌿</span> Fernhollow
              </p>
              <h2 id="fh-dialogue-title" className="fh-title">
                {meta.title}
              </h2>
              <p className="fh-sublabel">{meta.shortLabel}</p>
            </div>
            <div
              style={{
                display: "flex",
                flexShrink: 0,
                alignItems: "flex-start",
                gap: "0.5rem",
              }}
            >
              {meta.hasChat && slug !== "village-square" ? (
                <button
                  type="button"
                  className="fh-fresh-btn"
                  onClick={async () => {
                    if (
                      !confirm(
                        `Save a recap of your chats with ${meta.shortLabel} and start a new thread?`,
                      )
                    ) {
                      return;
                    }
                    try {
                      const r = await fetch("/api/session/recap", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ slug }),
                        credentials: "same-origin",
                      });
                      const data = (await r.json().catch(() => ({}))) as {
                        error?: string;
                      };
                      if (!r.ok) {
                        throw new Error(data.error ?? "Could not save recap.");
                      }
                      const del = await fetch(
                        `/api/session?slug=${encodeURIComponent(slug)}`,
                        { method: "DELETE", credentials: "same-origin" },
                      );
                      const delJson = (await del.json().catch(() => ({}))) as {
                        error?: string;
                      };
                      if (!del.ok) {
                        throw new Error(delJson.error ?? "Could not reset session.");
                      }
                      toast("Recap saved. Starting fresh…");
                      window.location.reload();
                    } catch (e) {
                      toast(
                        e instanceof Error ? e.message : "Something went wrong.",
                      );
                    }
                  }}
                >
                  {"\u{1F33F} Fresh start"}
                </button>
              ) : null}
              <button type="button" onClick={onClose} className="fh-close-btn">
                ✦ Close
              </button>
            </div>
          </div>
          <div className="fh-body">
            {slug === "village-square" ? (
              <VillageSquare />
            ) : slug === "garden" ? (
              <GardenBoardClient />
            ) : slug === "wrens-house" ? (
              <div className="space-y-6">
                <div className="flex justify-end">
                  <UsageSummaryStrip />
                </div>
                <TreasuryDashboard />
                <ChatWindow
                  slug={slug}
                  variant="dialogue"
                  initialMessage={initialMessage}
                  briefingContext={briefingContext}
                />
              </div>
            ) : meta.hasChat ? (
              <ChatWindow
                slug={slug}
                variant="dialogue"
                initialMessage={initialMessage}
                briefingContext={briefingContext}
              />
            ) : (
              <p className="text-sm" style={{ color: "#7a8c6a" }}>{meta.description}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
