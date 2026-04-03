"use client";

import { useCallback, useEffect } from "react";
import { ChatWindow } from "@/components/ChatWindow";
import { GardenBoardClient } from "@/components/GardenBoardClient";
import { TreasuryDashboard } from "@/components/TreasuryDashboard";
import { LOCATIONS, type LocationSlug } from "@/lib/locations";

type Props = {
  slug: LocationSlug;
  onClose: () => void;
};

export function GameChatOverlay({ slug, onClose }: Props) {
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
    <div
      className="fixed inset-0 z-[55] flex items-end justify-center pb-6 pt-16 sm:pb-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fh-dialogue-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-[2px]"
        aria-label="Close and return to the village"
        onClick={onClose}
      />
      <div
        className="relative z-10 mx-3 flex max-h-[min(85dvh,720px)] w-full max-w-2xl flex-col rounded-xl border-4 border-amber-900/70 bg-[#141210]/95 text-stone-100 shadow-[0_0_40px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-amber-900/50 px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-200/90">
              Fernhollow
            </p>
            <h2
              id="fh-dialogue-title"
              className="mt-1 font-serif text-xl font-semibold text-amber-50"
            >
              {meta.title}
            </h2>
            <p className="mt-1 text-sm text-stone-400">{meta.shortLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-stone-600 bg-stone-800/80 px-3 py-1.5 text-sm text-stone-200 hover:bg-stone-700"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {slug === "garden" ? (
            <GardenBoardClient />
          ) : slug === "wrens-house" ? (
            <div className="space-y-6">
              <TreasuryDashboard />
              <ChatWindow slug={slug} variant="dialogue" />
            </div>
          ) : meta.hasChat ? (
            <ChatWindow slug={slug} variant="dialogue" />
          ) : (
            <p className="text-sm text-stone-400">{meta.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
