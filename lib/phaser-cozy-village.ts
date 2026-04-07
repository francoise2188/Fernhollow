import type { Scene, Tilemaps } from "phaser";
import {
  COZY_HOLLOW,
  COZY_PEOPLE_TILED_TILESETS,
  MAP_EXTRA_TILESETS,
  SERENE_VILLAGE,
  fernhollowAssetPath,
} from "@/lib/assets";

/**
 * World / village tilesets (names must match Tiled).
 * Cozy People paper-doll sheets are listed in `COZY_PEOPLE_TILED_TILESETS` in `assets.ts` and merged in below.
 */
const WORLD_TILESET_LOADS: ReadonlyArray<{ name: string; url: string }> = [
  { name: "Ground Tileset v3", url: COZY_HOLLOW.groundTileset },
  { name: "Houses_TILESET_B-C-D-E", url: SERENE_VILLAGE.housesTileset },
  { name: "Meadow Assets V2", url: COZY_HOLLOW.meadowAssets },
  { name: "Water grass tileset v2", url: COZY_HOLLOW.waterGrassTileset },
  { name: "Serene_Village_16x16", url: SERENE_VILLAGE.tileset16 },
  { name: "Animal Sprites", url: COZY_HOLLOW.animalSprites },
];

const COZY_PEOPLE_TILESET_LOADS: ReadonlyArray<{ name: string; url: string }> =
  (
    Object.entries(COZY_PEOPLE_TILED_TILESETS) as [
      keyof typeof COZY_PEOPLE_TILED_TILESETS,
      string,
    ][]
  ).map(([name, url]) => ({ name, url }));

const MAP_EXTRA_TILESET_LOADS: ReadonlyArray<{ name: string; url: string }> = (
  Object.entries(MAP_EXTRA_TILESETS) as [keyof typeof MAP_EXTRA_TILESETS, string][]
).map(([name, url]) => ({ name, url }));

const TILESET_NAME_TO_URL: ReadonlyArray<{
  name: string;
  url: string;
}> = [
  ...WORLD_TILESET_LOADS,
  ...COZY_PEOPLE_TILESET_LOADS,
  ...MAP_EXTRA_TILESET_LOADS,
];

/** Preloaded as spritesheet (see `preloadCozyHollow`); URL kept for tileset mapping warnings. */
export const WATER_ANIMATION_32_KEY = "water_animation_32x32" as const;
/** Must match Tiled tileset `tilecount` for `water_animation_32x32`. */
export const WATER_ANIMATION_FRAME_COUNT = 5;
const WATER_ANIMATION_32_URL = fernhollowAssetPath("water_animation_32x32.png");

const TILESET_URL_BY_NAME: Readonly<Record<string, string>> = {
  ...Object.fromEntries(TILESET_NAME_TO_URL.map(({ name, url }) => [name, url])),
  [WATER_ANIMATION_32_KEY]: WATER_ANIMATION_32_URL,
};

/**
 * Logical map size in tiles — must match `public/assets/fernhollow/fernhollow-map.json`.
 * Regenerate the file with `node scripts/generate-fernhollow-tiled-map.mjs` or update these
 * values when you resize the map in Tiled.
 */
export const GRID_COLS = 30;
export const GRID_ROWS = 20;
export const TILE_PX = 16;
export const WORLD_W = GRID_COLS * TILE_PX;
export const WORLD_H = GRID_ROWS * TILE_PX;

export const WORLD_SCALE = 1;

/** Cache key for `this.load.tilemapTiledJSON` / `make.tilemap`. */
export const FERNHOLLOW_TILEMAP_KEY = "fernhollow-map";

/** Center of a cell in world pixels (origin top-left of map). */
export function worldCenterOfCell(
  col: number,
  row: number,
): {
  x: number;
  y: number;
} {
  return { x: (col + 0.5) * TILE_PX, y: (row + 0.5) * TILE_PX };
}

/**
 * River hit area (normalized 0–1) — update when your Tiled water layer changes.
 * Default matches the older left-band layout; tweak `nx/ny/nw/nh` to fit your design.
 */
export const COZY_RIVER_HIT = {
  nx: 22 / GRID_COLS,
  ny: 0,
  nw: 6 / GRID_COLS,
  nh: 6 / GRID_ROWS,
} as const;

export function preloadCozyHollow(scene: Scene): void {
  scene.load.tilemapTiledJSON(
    FERNHOLLOW_TILEMAP_KEY,
    fernhollowAssetPath("fernhollow-map.json"),
  );

  for (const { name, url } of TILESET_NAME_TO_URL) {
    scene.load.image(name, url);
  }

  scene.load.spritesheet(WATER_ANIMATION_32_KEY, WATER_ANIMATION_32_URL, {
    frameWidth: 32,
    frameHeight: 32,
  });
}

/** Values for camera bounds / pan (map layers stay at offsetX, offsetY in world space). */
export type CozyVillageEnv = {
  map: Tilemaps.Tilemap;
  mapScale: number;
  offsetX: number;
  offsetY: number;
};

/**
 * Builds the village from `public/assets/fernhollow/fernhollow-map.json`.
 * Links each Tiled tileset to the preloaded image whose key equals the tileset name.
 */
export function createCozyEnvironment(scene: Scene): CozyVillageEnv | null {
  let map: Tilemaps.Tilemap;
  try {
    map = scene.make.tilemap({ key: FERNHOLLOW_TILEMAP_KEY });
  } catch (e) {
    console.error(
      "[fernhollow] Failed to parse tilemap JSON — use Tiled with embedded tilesets (not external .tsx only).",
      e,
    );
    return null;
  }

  const tilesets: Tilemaps.Tileset[] = [];
  const parsed = map.tilesets ?? [];

  for (const ts of parsed) {
    const name = ts?.name;
    if (!name) continue;

    if (!TILESET_URL_BY_NAME[name]) {
      console.warn(
        "[fernhollow] Map tileset not in TILESET_NAME_TO_URL — add preload + mapping:",
        name,
      );
    }

    const added = map.addTilesetImage(name, name);
    if (added) tilesets.push(added);
    else
      console.error(
        "[fernhollow] addTilesetImage failed — missing texture or wrong name. Tiled name:",
        name,
        "(expected load.image key to match exactly)",
      );
  }

  if (tilesets.length === 0) {
    console.warn(
      "[fernhollow] No tilesets from map — retrying known Tiled names from TILESET_NAME_TO_URL.",
    );
    for (const { name } of TILESET_NAME_TO_URL) {
      const added = map.addTilesetImage(name, name);
      if (added) tilesets.push(added);
    }
  }

  if (tilesets.length === 0) {
    console.error(
      "[fernhollow] No tilesets linked — check PNG paths in TILESET_NAME_TO_URL and Tiled names.",
    );
    return null;
  }

  const layerNames = map.getTileLayerNames();

  const layers: (Tilemaps.TilemapLayer | null)[] = [];
  let depth = 0;
  for (const name of layerNames) {
    const layer = map.createLayer(name, tilesets, 0, 0);
    if (layer) {
      layer.setDepth(depth);
      depth += 1;
    }
    layers.push(layer);
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

  layers.forEach((layer) => {
    if (!layer) return;
    layer.setScale(mapScale);
    layer.setPosition(offsetX, offsetY);
  });

  return { map, mapScale, offsetX, offsetY };
}
