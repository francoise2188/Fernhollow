/**
 * Single source of truth for /public/assets/fernhollow paths (URL-safe).
 * Flat layout: characters/, world/, ui/, audio/ — see EXPECTED_FILES.txt.
 */

export const ASSETS_ROOT = "/assets/fernhollow";

/**
 * Build a URL under ASSETS_ROOT with each path segment encoded for use in the browser.
 * Spaces and other special characters become percent-encoding (e.g. `Character v.2` → `Character%20v.2`).
 */
export function fernhollowAssetPath(...segments: string[]): string {
  return `${ASSETS_ROOT}/${segments.map((s) => encodeURIComponent(s)).join("/")}`;
}

/** Character and animal sprites (flat files in characters/). */
export const CHARACTERS = {
  pipBird: fernhollowAssetPath("characters", "pip-bird.png"),
  figBunny: fernhollowAssetPath("characters", "fig-bunny.png.png"),
  rueFox: fernhollowAssetPath("characters", "rue-fox.png.png"),
  hedgehog: fernhollowAssetPath("characters", "hedgehog.png"),
} as const;

/**
 * Cozy People paper doll assets under `public/assets/fernhollow/cozy-people/` (no spaces; copy of the pack).
 *
 * From the original pack `info.txt`:
 * - "GRID SIZE 32x32" — 32×32 px grid used when authoring the merged sheets.
 * - "CELL SIZE MERGED: 256x1568" — each merged layer PNG is 256×1568 px (base body sheets).
 * - Walk: "WALK FR: 100" (frame timing ms) and **"Cell Size: 256x128"** — each walk cell is **256×128 px**.
 * - Other animations (jump, pick up, carry, sword, …) each list their own **Cell Size** (often 160×128, 128×128, etc.).
 * - "LAYERS" draw order: 1 Characters → 2 Eyes/Blush/Lipstick → 3 Clothes (shirt → pants → shoes) → 4 Hair → 5 Accessories.
 *
 * `list.txt` only lists **hair / clothes / eye colour variant names** — it does **not** define pixel sizes or sheet layout.
 *
 * Measured on disk (`characters/char1.png`): **256×1568** (Python/PIL not available here; size confirmed via System.Drawing).
 * Layer sheets can be wider (e.g. clothes 2560×1568, hair 3584×1568); walk **cells** are still **256×128** per info.txt — only the number of columns per row changes.
 *
 * `list.txt`: **10** clothes colour columns, **14** hair columns (side‑by‑side variants). Crop width = `fileWidth / colorCount` for the first variant column.
 */

/**
 * Retry chains: canonical lowercase names (see `public/.../cozy-people/`).
 * `next.config.ts` rewrites `Dress.png` / `Ponytail.png` → `dress.png` / `ponytail.png` for stale bundles.
 */
const CLOVER_CLOTHES_URL_CHAIN = [
  fernhollowAssetPath("cozy-people", "clothes", "dress.png"),
  fernhollowAssetPath("cozy-people", "clothes", "overalls.png"),
] as const;

const SCOUT_HAIR_URL_CHAIN = [
  fernhollowAssetPath("cozy-people", "hair", "ponytail.png"),
  fernhollowAssetPath("cozy-people", "hair", "extra_long.png"),
] as const;

/** Keys = Phaser `load.image` keys; order = retry attempts after each failure. */
export const COZY_PEOPLE_IMAGE_RETRY_CHAINS: Record<string, readonly string[]> =
  {
    "clover-clothes": CLOVER_CLOTHES_URL_CHAIN,
    "scout-hair": SCOUT_HAIR_URL_CHAIN,
  };

export const COZY_PEOPLE_V2 = {
  /** Walk / idle: one cell from the merged sheet (info.txt: Cell Size 256×128). */
  walkFrame: { frameWidth: 256, frameHeight: 128 } as const,
  /** Measured PNG widths (`System.Drawing`); height 1568 for merged sheets. */
  sheetFileWidth: {
    base: 256,
    clothes: 2560,
    hair: 3584,
    accNarrow: 256,
    accWide: 2560,
  } as const,
  /** Colour columns per sheet type (`list.txt` clothes 10, hair 14; bases one column). */
  sheetColorColumns: {
    base: 1,
    clothes: 10,
    hair: 14,
    accSingle: 1,
    accWide: 10,
  } as const,
  clover: {
    base: fernhollowAssetPath("cozy-people", "characters", "char1.png"),
    clothes: CLOVER_CLOTHES_URL_CHAIN[0],
    hair: fernhollowAssetPath("cozy-people", "hair", "extra_long.png"),
    acc: fernhollowAssetPath("cozy-people", "acc", "earring_emerald.png"),
  },
  scout: {
    base: fernhollowAssetPath("cozy-people", "characters", "char2.png"),
    clothes: fernhollowAssetPath("cozy-people", "clothes", "overalls.png"),
    hair: SCOUT_HAIR_URL_CHAIN[0],
  },
  wren: {
    base: fernhollowAssetPath("cozy-people", "characters", "char3.png"),
    spaghetti: fernhollowAssetPath("cozy-people", "clothes", "spaghetti.png"),
    skirt: fernhollowAssetPath("cozy-people", "clothes", "skirt.png"),
    hair: fernhollowAssetPath("cozy-people", "hair", "spacebuns.png"),
    acc: fernhollowAssetPath("cozy-people", "acc", "glasses.png"),
  },
} as const;

/** World tilesets (world/) — optional fallback if not using Cozy Hollow paths. */
export const WORLD = {
  villageTileset: fernhollowAssetPath("world", "village-tileset.png"),
  housesTileset: fernhollowAssetPath("world", "houses-tileset.png"),
  natureTileset: fernhollowAssetPath("world", "nature-tileset.png"),
} as const;

/**
 * Cozy Hollow pack — composite these in Phaser (ground + meadow + water).
 * Place files under public/assets/fernhollow/ with this folder layout.
 */
export const COZY_HOLLOW = {
  groundTileset: fernhollowAssetPath(
    "Cozy Hollow V1.3",
    "Files",
    "Ground Tileset v3.png",
  ),
  meadowAssets: fernhollowAssetPath(
    "Cozy Hollow V1.3",
    "Files",
    "Meadow Assets V2.png",
  ),
  waterGrassTileset: fernhollowAssetPath(
    "Cozy Hollow V1.3",
    "Files",
    "Water grass tileset v2.png",
  ),
  animalSprites: fernhollowAssetPath(
    "Cozy Hollow V1.3",
    "Files",
    "Animal Sprites.png",
  ),
} as const;

/**
 * Serene Village pack — copy PNGs into `public/assets/fernhollow/Serene_Village_revamped_v1.9/`
 * (flat names). If your zip only has a `SERENE_VILLAGE_REVAMPED/` subfolder, either move the PNGs up
 * one level or rely on `next.config.ts` rewrites from the nested path to these files.
 */
export const SERENE_VILLAGE = {
  housesTileset: fernhollowAssetPath(
    "Serene_Village_revamped_v1.9",
    "Houses_TILESET_B-C-D-E.png",
  ),
  tileset16: fernhollowAssetPath(
    "Serene_Village_revamped_v1.9",
    "Serene_Village_16x16.png",
  ),
} as const;

/**
 * Extra world tilesets referenced by `fernhollow-map.json` (Tiled `name` → load key must match).
 */
export const MAP_EXTRA_TILESETS = {
  tileset: fernhollowAssetPath("Tiny garden_free pack", "tileset.png"),
  objects: fernhollowAssetPath("Tiny garden_free pack", "objects.png"),
  cozytown_tileset_fulll: fernhollowAssetPath(
    "cozy-series-town-tileset-v1.0",
    "CozyTown_AssetPack",
    "Tileset",
    "cozytown_tileset_fulll.png",
  ),
} as const;

/**
 * Cozy People merged sheets used as Tiled tilesets (names must match the map’s tileset `name`).
 * Paths align with `fernhollow-map-2/*.tsx` (32×32 tile grid in Tiled over each PNG).
 */
export const COZY_PEOPLE_TILED_TILESETS = {
  char_all: fernhollowAssetPath("cozy-people", "characters", "char_all.png"),
  wavy: fernhollowAssetPath("cozy-people", "hair", "wavy.png"),
  dress: fernhollowAssetPath("cozy-people", "clothes", "dress.png"),
  extra_long: fernhollowAssetPath("cozy-people", "hair", "extra_long.png"),
  extra_long_skirt: fernhollowAssetPath(
    "cozy-people",
    "hair",
    "extra_long_skirt.png",
  ),
  spacebuns: fernhollowAssetPath("cozy-people", "hair", "spacebuns.png"),
  floral: fernhollowAssetPath("cozy-people", "clothes", "floral.png"),
  pants: fernhollowAssetPath("cozy-people", "clothes", "pants.png"),
  shoes: fernhollowAssetPath("cozy-people", "clothes", "shoes.png"),
  eyes: fernhollowAssetPath("cozy-people", "eyes", "eyes.png"),
  blush_all: fernhollowAssetPath("cozy-people", "eyes", "blush_all.png"),
  /** Tiled tileset name is `lipstick ` (trailing space). File: `lipstick .png`. */
  "lipstick ": fernhollowAssetPath("cozy-people", "eyes", "lipstick .png"),
} as const;

/**
 * Tile grid size for Cozy Hollow sheets (adjust if your pack uses 32×32).
 * Frame indices are hints; tune in phaser-cozy-village if grass looks wrong.
 */
export const PHASER_COZY = {
  tile: 16,
  /** Visual scale of repeated tiles (2 = larger pixels on screen). */
  tileScale: 2,
  grassFrame: 0,
  /** Main dirt path (vertical stem). */
  pathFrame: 5,
  /** Cross-path / branch — contrasting frame on the same ground sheet. */
  pathFrameAccent: 12,
  waterFrame: 0,
  /** Shore / water edge decoration from water–grass tileset (banks). */
  waterBankFrameMin: 1,
  waterBankFrameMax: 7,
  /** Decorative sprites picked from random frame ranges (avoid empty tiles). */
  meadowDecorFrameMin: 8,
  meadowDecorFrameMax: 80,
} as const;

/** UI chrome (ui/). */
export const UI = {
  chatBubble: fernhollowAssetPath("ui", "chat-bubble.png"),
  nameplate: fernhollowAssetPath("ui", "nameplate.png"),
} as const;

/**
 * Ambient and music (Howler). Filenames must match `public/assets/fernhollow/audio/`.
 * (Avoid double extensions like `birdsong.mp3.wav` — use one extension per format.)
 */
export const AUDIO = {
  birdsong: fernhollowAssetPath("audio", "birdsong.wav"),
  river: fernhollowAssetPath("audio", "river.wav"),
  forestAmbience: fernhollowAssetPath("audio", "forest-ambience.wav"),
  fireplace: fernhollowAssetPath("audio", "fireplace.m4a"),
  backgroundMusic: fernhollowAssetPath("audio", "background-music.mp3"),
} as const;

/** Dispatched when the player taps a house or character to open chat (no route change). */
export const FERNHOLLOW_OPEN_CHAT_EVENT = "fernhollow:open-chat" as const;

/** @deprecated use FERNHOLLOW_OPEN_CHAT_EVENT */
export const FERNHOLLOW_HOUSE_CLICK_EVENT = FERNHOLLOW_OPEN_CHAT_EVENT;

/** Shell tells Howler which location context is active (river, fireplace, etc.). */
export const FERNHOLLOW_AUDIO_LOCATION_EVENT = "fernhollow:audio-location" as const;

export type FernhollowHouseClickDetail = { slug: string };
