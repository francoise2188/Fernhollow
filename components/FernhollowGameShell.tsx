"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ActivityFeed } from "@/components/ActivityFeed";
import { FernhollowGame } from "@/components/FernhollowGame";
import { GameChatOverlay } from "@/components/GameChatOverlay";
import { LogoutButton } from "@/components/LogoutButton";
import {
  FERNHOLLOW_AUDIO_LOCATION_EVENT,
  FERNHOLLOW_OPEN_CHAT_EVENT,
} from "@/lib/assets";
import { isLocationSlug, type LocationSlug } from "@/lib/locations";

export function FernhollowGameShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatParam = searchParams.get("chat");
  const initialMessage = searchParams.get("msg") ?? undefined;
  /** `URLSearchParams` / Next already decode; avoid decodeURIComponent (breaks on "%" in text). */
  const briefingContext = searchParams.get("ctx") ?? undefined;
  const openSlug: LocationSlug | null =
    chatParam && isLocationSlug(chatParam) ? chatParam : null;

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(FERNHOLLOW_AUDIO_LOCATION_EVENT, {
        detail: { slug: openSlug },
      }),
    );
  }, [openSlug]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (
        e as CustomEvent<{
          slug?: string;
          initialMessage?: string;
          briefingContext?: string;
        }>
      ).detail;
      if (d?.slug && isLocationSlug(d.slug)) {
        const params = new URLSearchParams();
        params.set("chat", d.slug);
        if (d.initialMessage) params.set("msg", d.initialMessage);
        if (d.briefingContext) {
          params.set("ctx", d.briefingContext.slice(0, 500));
        }
        router.replace(`/?${params.toString()}`, { scroll: false });
      }
    };
    window.addEventListener(FERNHOLLOW_OPEN_CHAT_EVENT, onOpen);
    return () =>
      window.removeEventListener(FERNHOLLOW_OPEN_CHAT_EVENT, onOpen);
  }, [router]);

  const close = () => router.replace("/", { scroll: false });

  return (
    <div className="fixed inset-0 z-0 bg-[#0f160f]">
      <div className="absolute inset-0">
        <FernhollowGame chatOverlayOpen={!!openSlug} />
      </div>
      {openSlug ? (
        <GameChatOverlay
          slug={openSlug}
          onClose={close}
          initialMessage={initialMessage}
          briefingContext={briefingContext}
        />
      ) : null}

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[57]">
        <ActivityFeed />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[58]">
        <div className="pointer-events-auto absolute top-4 right-4 flex gap-2">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
