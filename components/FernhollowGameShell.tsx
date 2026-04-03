"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
      const d = (e as CustomEvent<{ slug?: string }>).detail;
      if (d?.slug && isLocationSlug(d.slug)) {
        router.replace(`/?chat=${encodeURIComponent(d.slug)}`, {
          scroll: false,
        });
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
        <FernhollowGame />
      </div>
      {openSlug ? (
        <GameChatOverlay slug={openSlug} onClose={close} />
      ) : null}
      <div className="pointer-events-none absolute inset-0 z-[58]">
        <div className="pointer-events-auto absolute top-4 right-4 flex gap-2">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
