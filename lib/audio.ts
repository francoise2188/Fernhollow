import type { Howl } from "howler";
import { AUDIO } from "@/lib/assets";
import type { LocationSlug } from "@/lib/locations";

/** Forest ambience and background music (per spec). */
const VOL_FOREST = 0.28;
const VOL_BGM = 0.28;
/** Birdsong loop. */
const VOL_BIRD = 0.22;
/** River and fireplace when active. */
const VOL_RIVER = 0.25;
const VOL_FIRE = 0.25;

const RIVER_FADE_MS = 2000;
const FIREPLACE_FADE_IN_MS = 1000;
const FIREPLACE_FADE_OUT_MS = 1000;

const FILES = {
  birdsong: AUDIO.birdsong,
  river: AUDIO.river,
  forest: AUDIO.forestAmbience,
  fireplace: AUDIO.fireplace,
  bgm: AUDIO.backgroundMusic,
} as const;

type Howls = {
  forest: Howl;
  bgm: Howl;
  birdsong: Howl;
  river: Howl;
  fireplace: Howl;
};

let howls: Howls | null = null;
let ambientStarted = false;
let unlockListenersAttached = false;
/** Window capture listener — removed once audio unlocks (any path). */
let windowPointerUnlockHandler: ((e: PointerEvent) => void) | null = null;
let userMuted = false;
let riverSceneActive = false;
let fireplaceSceneActive = false;
let lastSlug: LocationSlug | null = null;

function getHowler() {
  return import("howler").then((m) => m.Howler);
}

async function createHowls(): Promise<Howls> {
  const { Howl } = await import("howler");
  return {
    forest: new Howl({
      src: [FILES.forest],
      loop: true,
      volume: VOL_FOREST,
      preload: true,
      html5: true,
    }),
    bgm: new Howl({
      src: [FILES.bgm],
      loop: true,
      volume: VOL_BGM,
      preload: true,
      html5: true,
    }),
    birdsong: new Howl({
      src: [FILES.birdsong],
      loop: true,
      volume: VOL_BIRD,
      preload: true,
      html5: true,
    }),
    river: new Howl({
      src: [FILES.river],
      loop: true,
      volume: 0,
      preload: true,
      html5: true,
    }),
    fireplace: new Howl({
      src: [FILES.fireplace],
      loop: true,
      volume: 0,
      preload: true,
      html5: true,
    }),
  };
}

function detachWindowUnlockListener(): void {
  if (!windowPointerUnlockHandler) return;
  window.removeEventListener(
    "pointerdown",
    windowPointerUnlockHandler as EventListener,
    { capture: true },
  );
  windowPointerUnlockHandler = null;
}

async function unlockAndStartAmbient(): Promise<void> {
  if (typeof window === "undefined" || ambientStarted) return;
  ambientStarted = true;
  detachWindowUnlockListener();

  const Howler = await getHowler();
  howls = await createHowls();
  Howler.mute(userMuted);

  howls.forest.play();
  howls.bgm.play();
  howls.birdsong.play();

  applySceneLayers(lastSlug);
}

/** Await after first user gesture so Howler can start (browsers block audio until then). */
export async function unlockAmbientAudioIfNeeded(): Promise<void> {
  await unlockAndStartAmbient();
}

export function isAmbientAudioStarted(): boolean {
  return ambientStarted;
}

/**
 * First pointerdown outside `[data-fernhollow-audio-control]` unlocks audio.
 * The mute button is marked with that attribute so its first click can unlock **without**
 * immediately toggling mute (capture-phase document listeners used to run before the button
 * and left Howler unmuted for one tick, then the button flipped mute on — silent village).
 */
export function attachFernhollowAudioUnlock(): void {
  if (typeof window === "undefined" || unlockListenersAttached) return;
  unlockListenersAttached = true;

  windowPointerUnlockHandler = (e: PointerEvent) => {
    const el = e.target as HTMLElement | null;
    if (el?.closest?.("[data-fernhollow-audio-control]")) return;
    void unlockAndStartAmbient();
  };

  window.addEventListener(
    "pointerdown",
    windowPointerUnlockHandler as EventListener,
    { capture: true },
  );
}

function applyRiver(active: boolean): void {
  if (!howls) return;
  const h = howls.river;
  if (active) {
    if (riverSceneActive) return;
    riverSceneActive = true;
    h.stop();
    h.volume(0);
    h.play();
    h.fade(0, VOL_RIVER, RIVER_FADE_MS);
  } else {
    if (!riverSceneActive) return;
    riverSceneActive = false;
    if (!h.playing()) {
      h.volume(0);
      return;
    }
    const v = h.volume();
    h.fade(v, 0, RIVER_FADE_MS);
    window.setTimeout(() => {
      h.stop();
      h.volume(0);
    }, RIVER_FADE_MS);
  }
}

function applyFireplace(active: boolean): void {
  if (!howls) return;
  const h = howls.fireplace;
  if (active) {
    if (fireplaceSceneActive) return;
    fireplaceSceneActive = true;
    h.stop();
    h.volume(0);
    h.play();
    h.fade(0, VOL_FIRE, FIREPLACE_FADE_IN_MS);
  } else {
    if (!fireplaceSceneActive) return;
    fireplaceSceneActive = false;
    if (!h.playing()) {
      h.volume(0);
      return;
    }
    const v = h.volume();
    h.fade(v, 0, FIREPLACE_FADE_OUT_MS);
    window.setTimeout(() => {
      h.stop();
      h.volume(0);
    }, FIREPLACE_FADE_OUT_MS);
  }
}

function applySceneLayers(slug: LocationSlug | null): void {
  const atRiver = slug === "river";
  const atScout = slug === "scouts-workshop";
  applyRiver(atRiver);
  applyFireplace(atScout);
}

/**
 * Call when the village location changes (e.g. from the URL).
 * Remembers the last slug so river/fireplace apply correctly after the first unlock.
 */
export function syncAudioToLocation(slug: LocationSlug | null): void {
  lastSlug = slug;
  if (!ambientStarted || !howls) return;
  applySceneLayers(slug);
}

/** Global mute (Howler-wide). Works before or after unlock; applies to future sounds too. */
export function setMuted(muted: boolean): void {
  userMuted = muted;
  void getHowler().then((Howler) => Howler.mute(muted));
}

export function getMuted(): boolean {
  return userMuted;
}

export function toggleMute(): boolean {
  setMuted(!userMuted);
  return userMuted;
}
