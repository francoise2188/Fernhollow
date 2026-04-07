"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  attachFernhollowAudioUnlock,
  getMuted,
  isAmbientAudioStarted,
  syncAudioToLocation,
  toggleMute,
  unlockAmbientAudioIfNeeded,
} from "@/lib/audio";
import { FERNHOLLOW_AUDIO_LOCATION_EVENT } from "@/lib/assets";
import {
  isLocationSlug,
  pathnameToLocationSlug,
} from "@/lib/locations";

/** Unlock + Howler. Village context comes from fernhollow:audio-location (game shell) or legacy routes. */
export function FernhollowAudio() {
  const pathname = usePathname();

  useEffect(() => {
    attachFernhollowAudioUnlock();
  }, []);

  useEffect(() => {
    const onAudioLoc = (e: Event) => {
      const raw = (e as CustomEvent<{ slug?: string | null }>).detail?.slug;
      if (raw === null || raw === undefined) {
        syncAudioToLocation(null);
        return;
      }
      syncAudioToLocation(isLocationSlug(raw) ? raw : null);
    };
    window.addEventListener(FERNHOLLOW_AUDIO_LOCATION_EVENT, onAudioLoc);
    return () =>
      window.removeEventListener(FERNHOLLOW_AUDIO_LOCATION_EVENT, onAudioLoc);
  }, []);

  useEffect(() => {
    if (pathname === "/" || pathname === "") return;
    syncAudioToLocation(pathnameToLocationSlug(pathname));
  }, [pathname]);

  return null;
}

/** Global mute for all Howler sounds (matches lib/audio.ts). */
export function FernhollowMuteButton() {
  const [muted, setMutedUi] = useState(() => getMuted());

  return (
    <button
      type="button"
      data-fernhollow-audio-control
      onClick={() => {
        void (async () => {
          const wasStarted = isAmbientAudioStarted();
          await unlockAmbientAudioIfNeeded();
          if (!wasStarted) {
            setMutedUi(false);
            return;
          }
          setMutedUi(toggleMute());
        })();
      }}
      className="fixed right-4 bottom-4 z-[100] rounded-full border border-stone-300 bg-white/90 px-3 py-2 text-sm text-stone-800 shadow-sm backdrop-blur dark:border-stone-600 dark:bg-stone-900/90 dark:text-stone-100"
      aria-label={muted ? "Unmute Fernhollow audio" : "Mute Fernhollow audio"}
    >
      {muted ? "Unmute" : "Mute"}
    </button>
  );
}
