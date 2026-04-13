import type { Scene, Tilemaps } from "phaser";
import {
  COZY_HOLLOW,
  COZY_PEOPLE_TILED_TILESETS,
  fernhollowAssetPath,
} from "@/lib/assets";

/**
 * All tilesets used by `fernhollow-map2.tmj` (new 60×40 map).
 * Names must match exactly what Tiled embedded — including spaces and double extensions.
 *
 * Important: "Ground Tileset v3" and "cozytown_tileset_fulll" are different PNGs in Tiled
 * (208×160 vs 192×1776). Both keys must load the correct file or the ground layer glitches.
 *
 * `imageKey` = Phaser texture cache key when it must differ from Tiled’s `name` (e.g. avoid clashing with "tiles").
 */
type TilesetLoadSpec = { name: string; url: string; imageKey?: string };

const TILESET_NAME_TO_URL: ReadonlyArray<TilesetLoadSpec> = [
  // World / environment
  {
    name: "Ground Tileset v3",
    url: COZY_HOLLOW.groundTileset,
  },
  {
    name: "cozytown_tileset_fulll",
    url: fernhollowAssetPath("cozy-series-town-tileset-v1.0", "CozyTown_AssetPack", "Tileset", "cozytown_tileset_fulll.png"),
  },
  {
    name: "buildings",
    url: fernhollowAssetPath("cozy farm", "full version", "Buildings", "buildings.png"),
  },
  {
    name: "tiles",
    url: fernhollowAssetPath("cozy farm", "full version", "tiles", "tiles.png"),
  },
  // Tiled name stays "tileset"; unique texture key so this row is not confused with "tiles" above.
  {
    name: "tileset",
    imageKey: "tiny-garden-tileset",
    url: fernhollowAssetPath("Tiny garden_free pack", "tileset.png"),
  },
  {
    name: "fig-bunny.png",
    url: fernhollowAssetPath("characters", "fig-bunny.png.png"),
  },
  {
    name: "Meadow Assets V2",
    url: fernhollowAssetPath("Cozy Hollow V1.3", "Files", "Meadow Assets V2.png"),
  },
  {
    name: "UI_all",
    url: fernhollowAssetPath("cozy farm", "full version", "ui", "UI_all.png"),
  },
  // Character paper-doll sheets (cozy-people — matches animated sprites in FernhollowGame)
  ...Object.entries(COZY_PEOPLE_TILED_TILESETS).map(([name, url]) => ({
    name,
    url,
  })),
];

/** Tiled tileset `name` → texture key passed to `load.image` / `addTilesetImage` (2nd arg). */
const TEXTURE_KEY_BY_TILED_NAME: Readonly<Record<string, string>> =
  Object.fromEntries(
    TILESET_NAME_TO_URL.map(({ name, imageKey }) => [name, imageKey ?? name]),
  );

const TILESET_URL_BY_NAME: Readonly<Record<string, string>> = Object.fromEntries(
  TILESET_NAME_TO_URL.map(({ name, url }) => [name, url]),
);

/**
 * Logical map size — matches the new 60×40 Tiled map at 16px tiles.
 */
export const GRID_COLS = 60;
export const GRID_ROWS = 40;
export const TILE_PX = 16;
export const WORLD_W = GRID_COLS * TILE_PX;
export const WORLD_H = GRID_ROWS * TILE_PX;

export const WORLD_SCALE = 1;

/** Cache key for `this.load.tilemapTiledJSON` / `make.tilemap` — matches exported Tiled name. */
export const FERNHOLLOW_TILEMAP_KEY = "fernhollow-map2";

/**
 * Phaser’s Tiled parser throws (e.g. `AssignTileProperties` reading `[2]` of undefined) when tilesets
 * only reference external `.tsx` files (`source` with no embedded `image`). Browsers never load those.
 */
function fernhollowCachedTilemapSafeForPhaser(scene: Scene, key: string): boolean {
  const entry = scene.cache.tilemap.get(key) as { data?: unknown } | undefined;
  const data = entry?.data;
  if (!data || typeof data !== "object") return false;
  const tilesets = (data as { tilesets?: unknown }).tilesets;
  if (!Array.isArray(tilesets) || tilesets.length === 0) return false;
  for (const ts of tilesets) {
    if (!ts || typeof ts !== "object") return false;
    const o = ts as { source?: unknown; image?: unknown };
    const hasSource =
      typeof o.source === "string" && o.source.replace(/\s/g, "").length > 0;
    const hasImage =
      typeof o.image === "string" && o.image.replace(/\s/g, "").length > 0;
    if (hasSource && !hasImage) return false;
  }
  return true;
}

/** Center of a cell in world pixels (origin top-left of map). */
export function worldCenterOfCell(col: number, row: number): { x: number; y: number } {
  return { x: (col + 0.5) * TILE_PX, y: (row + 0.5) * TILE_PX };
}

/**
 * River hit area (normalized 0–1) — approximate position of the winding river
 * on the new 60×40 map. Adjust after visually confirming the layout.
 */
export const COZY_RIVER_HIT = {
  nx: 22 / GRID_COLS,
  ny: 0,
  nw: 6 / GRID_COLS,
  nh: 10 / GRID_ROWS,
} as const;

export function preloadCozyHollow(scene: Scene): void {
  scene.load.tilemapTiledJSON(
    FERNHOLLOW_TILEMAP_KEY,
    /** Tiled’s JSON map export uses `.tmj` by default — same format as `.json`. */
    fernhollowAssetPath("fernhollow-map2.tmj"),
  );

  /**
   * Bitmap sources for the map — **not** the `"image"` strings inside the JSON (those often
   * still say `Character v.2/...` from Tiled). Phaser uses `addTilesetImage(tiledName, textureKey)` with
   * these loaded textures, so replacing art = update files under `public/.../cozy-people/` (and
   * URLs here), not the path text in the exported `.json`.
   */
  for (const { name, url, imageKey } of TILESET_NAME_TO_URL) {
    scene.load.image(imageKey ?? name, url);
  }
}

/** Values for camera bounds / pan (map layers stay at offsetX, offsetY in world space). */
export type CozyVillageEnv = {
  map: Tilemaps.Tilemap;
  mapScale: number;
  offsetX: number;
  offsetY: number;
};

/**
 * Builds the village from `public/assets/fernhollow/fernhollow-map2.tmj`.
 * Links each Tiled tileset to the preloaded image whose key equals the tileset name.
 *
 * NOTE: The map embeds two tilesets both named `tiles` (different firstgids, same PNG).
 * `addTilesetImage(name)` only resolves the **first** matching name — we bind textures by
 * iterating `map.tilesets` and calling `setImage` on each entry so both ranges render.
 */
export function createCozyEnvironment(scene: Scene): CozyVillageEnv | null {
  console.log(
    "[fernhollow] cache has map?",
    scene.cache.tilemap.has(FERNHOLLOW_TILEMAP_KEY),
  );
  const raw = scene.cache.tilemap.get(FERNHOLLOW_TILEMAP_KEY);
  console.log(
    "[fernhollow] raw map data:",
    (raw as { data?: { tilesets?: unknown[] } } | undefined)?.data?.tilesets
      ?.length,
    "tilesets",
  );

  if (!scene.cache.tilemap.has(FERNHOLLOW_TILEMAP_KEY)) {
    console.error(
      "[fernhollow] Tilemap missing from cache — file did not load (check path / network).",
    );
    return null;
  }
  if (!fernhollowCachedTilemapSafeForPhaser(scene, FERNHOLLOW_TILEMAP_KEY)) {
    console.error(
      "[fernhollow] Tilemap uses external .tsx tilesets only (no embedded \"image\" per tileset). Phaser will crash while parsing. Fix: Tiled → Map → Save with embedded tilesets, then overwrite `public/assets/fernhollow/fernhollow-map2.tmj`. You can copy the good embedded file from `public/assets/fernhollow/fernhollow-map-2/fernhollow-map2.tmj`. Run: npm run verify:map",
    );
    return null;
  }

  let map: Tilemaps.Tilemap;
  try {
    map = scene.make.tilemap({ key: FERNHOLLOW_TILEMAP_KEY });
  } catch (e) {
    console.error(
      "[fernhollow] Tilemap failed to build (common cause: Tiled exported tilesets as external .tsx only — Phaser needs embedded tileset data). Fix: open the map in Tiled → Map → Save with embedded tilesets, save `fernhollow-map2.tmj`, then run: npm run verify:map",
      e,
    );
    return null;
  }

  const list = map.tilesets ?? [];
  let linked = 0;
  for (let i = 0; i < list.length; i++) {
    const ts = list[i];
    const name = ts?.name;
    if (!name) continue;

    if (!TILESET_URL_BY_NAME[name]) {
      console.warn(
        "[fernhollow] Map tileset not in TILESET_NAME_TO_URL — add it:",
        JSON.stringify(name),
      );
    }

    const textureKey = TEXTURE_KEY_BY_TILED_NAME[name] ?? name;
    if (!scene.textures.exists(textureKey)) {
      console.error(
        "[fernhollow] Missing texture for tileset",
        JSON.stringify(name),
        "key:",
        JSON.stringify(textureKey),
        "— check preload paths / spelling (spaces, double extensions).",
      );
      continue;
    }
    ts.setImage(scene.textures.get(textureKey));
    linked += 1;
  }

  const namedTilesetCount = list.filter((t) => Boolean(t?.name)).length;
  if (linked > 0 && linked < namedTilesetCount) {
    console.warn(
      `[fernhollow] Linked ${linked}/${namedTilesetCount} tilesets — missing textures will leave holes in the map.`,
    );
  }

  if (linked === 0) {
    console.error(
      "[fernhollow] No tilesets linked — map will be blank. Usual causes: (1) tilemap file failed to load (wrong path/extension), or (2) map uses external .tsx tilesets only — use Tiled → Map → Save with embedded tilesets so each tileset has an \"image\" field in the .tmj. Run: npm run verify:map",
    );
    return null;
  }

  /**
   * Layer order in the JSON is bottom → top (ground first, hair last). That matches Tiled’s
   * layer stack with hair at the top of the list. Phaser depth increases each step so hair
   * draws above everything else.
   */
  const layerNames = map.getTileLayerNames();
  const tilesetsForLayers = list;
  let depth = 0;
  for (const name of layerNames) {
    const layer = map.createLayer(name, tilesetsForLayers, 0, 0);
    if (layer) {
      layer.setDepth(depth);
      depth += 1;
    }
  }

  const scaleX = scene.scale.width / map.widthInPixels;
  const scaleY = scene.scale.height / map.heightInPixels;
  const mapScale = Math.min(scaleX, scaleY);

  const offsetX = (scene.scale.width - map.widthInPixels * mapScale) / 2;
  const offsetY = (scene.scale.height - map.heightInPixels * mapScale) / 2;

  console.log("[fernhollow] map layout", {
    offsetX,
    offsetY,
    mapScale,
    widthInPixels: map.widthInPixels,
    heightInPixels: map.heightInPixels,
  });

  for (const name of layerNames) {
    const layer = map.getLayer(name)?.tilemapLayer;
    if (!layer) continue;
    layer.setScale(mapScale);
    layer.setPosition(offsetX, offsetY);
  }

  return { map, mapScale, offsetX, offsetY };
}