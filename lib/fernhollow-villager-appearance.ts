import type { Scene, Tilemaps } from "phaser";

/** Tiled layer names for paper-doll stacks (bottom → top draw order in map). */
export const CHARACTER_TILE_LAYERS = [
  "girls",
  "dress",
  "face",
  "lips",
  "shoes",
  "hair",
] as const;

export type PartKey = "body" | "dress" | "eyes" | "lips" | "shoes" | "hair";

export type PartBinding = { key: string; frame: number };

export type VillagerSample = Record<PartKey, PartBinding>;

/** Tiled tileset `name` → Phaser texture key (must match `load` keys in FernhollowGame). */
const TILESET_TO_TEXTURE: Record<string, string> = {
  char_all: "char_all_sheet",
  "dress ": "dress_sheet",
  dress: "dress_sheet",
  eyes: "eyes_sheet",
  blush_all: "blush_sheet",
  "lipstick ": "lipstick_sheet",
  lipstick: "lipstick_sheet",
  shoes: "shoes_sheet",
  wavy: "wavy_sheet",
  extra_long: "extra_long_sheet",
  extra_long_skirt: "extra_long_skirt_sheet",
  spacebuns: "spacebuns_sheet",
  braids: "braids_sheet",
  "long_straight ": "extra_long_sheet",
  long_straight: "extra_long_sheet",
  floral: "floral_sheet",
};

function textureKeyForTileset(name: string): string | null {
  if (TILESET_TO_TEXTURE[name] !== undefined) {
    return TILESET_TO_TEXTURE[name];
  }
  const t = name.trim();
  return TILESET_TO_TEXTURE[t] ?? null;
}

/**
 * Map uses 16×16 cells on the same PNGs; sprites use 32×32 frames. Converts top-left GID of a
 * 2×2 block to the Phaser spritesheet frame index for the combined cell.
 */
export function gidToSpritesheetFrame(
  map: Tilemaps.Tilemap,
  gid: number,
): PartBinding | null {
  if (gid < 1) return null;
  const ts = map.tilesets.find((t) => t.containsTileIndex(gid));
  if (!ts?.name) return null;
  const texKey = textureKeyForTileset(ts.name);
  if (!texKey) return null;
  const iw = ts.image?.source[0]?.width;
  if (!iw || ts.columns < 1) return null;

  const local = gid - ts.firstgid;
  const c16 = local % ts.columns;
  const r16 = Math.floor(local / ts.columns);
  const phaserCols = Math.floor(iw / 32);
  if (phaserCols < 1) return null;
  const frame =
    Math.floor(r16 / 2) * phaserCols + Math.floor(c16 / 2);
  return { key: texKey, frame };
}

export function sampleVillagerFromMap(
  map: Tilemaps.Tilemap,
  topTx: number,
  topTy: number,
): Partial<Record<PartKey, PartBinding>> {
  const out: Partial<Record<PartKey, PartBinding>> = {};

  const read = (layer: string): PartBinding | null => {
    const tile = map.getTileAt(topTx, topTy, false, layer);
    if (!tile?.index) return null;
    return gidToSpritesheetFrame(map, tile.index);
  };

  const girls = read("girls");
  if (girls) out.body = girls;

  const dress = read("dress");
  if (dress) out.dress = dress;

  const face = read("face");
  if (face) {
    if (face.key === "eyes_sheet") out.eyes = face;
    else if (face.key === "blush_sheet") {
      /* rare: face layer uses blush only */
    }
  }

  const lips = read("lips");
  if (lips) out.lips = lips;

  const shoes = read("shoes");
  if (shoes) out.shoes = shoes;

  const hair = read("hair");
  if (hair) out.hair = hair;

  return out;
}

export type VillagerAnimProfile = {
  id: "clover" | "rosie" | "scout" | "wren";
  /** Clover: 4-frame shoe/eye walk; others use one frame per direction. */
  richShoesAndEyes: boolean;
  hasPants: boolean;
  hasShoesLayer: boolean;
};

export const VILLAGER_ANIM_PROFILES: Record<
  VillagerAnimProfile["id"],
  VillagerAnimProfile
> = {
  clover: {
    id: "clover",
    richShoesAndEyes: true,
    hasPants: false,
    hasShoesLayer: true,
  },
  rosie: {
    id: "rosie",
    richShoesAndEyes: false,
    hasPants: true,
    hasShoesLayer: true,
  },
  scout: {
    id: "scout",
    richShoesAndEyes: false,
    hasPants: true,
    hasShoesLayer: true,
  },
  wren: {
    id: "wren",
    richShoesAndEyes: false,
    hasPants: false,
    hasShoesLayer: false,
  },
};

const CHAR_ROW = 64;
const HAIR_ROW = 112;
const DRESS_ROW = 80;
const SHOES_ROW = 80;
const EYES_ROW = 112;
const BLUSH_ROW = 40;
const LIP_ROW = 40;
const PANTS_ROW = 80;

function createCharWalk(
  scene: Scene,
  prefix: string,
  base: number,
  textureKey: string,
) {
  const dirs = ["down", "up", "right", "left"] as const;
  const rowMul = [0, 1, 2, 3];
  for (let i = 0; i < 4; i++) {
    const r = rowMul[i]! * CHAR_ROW;
    scene.anims.create({
      key: `${prefix}-walk-${dirs[i]}`,
      frames: scene.anims.generateFrameNumbers(textureKey, {
        frames: [base + r, base + r + 1, base + r + 2, base + r + 3],
      }),
      frameRate: 8,
      repeat: -1,
    });
  }
}

function createHairWalk(
  scene: Scene,
  prefix: string,
  base: number,
  textureKey: string,
) {
  const dirs = ["down", "up", "right", "left"] as const;
  const rowMul = [0, 1, 2, 3];
  for (let i = 0; i < 4; i++) {
    const r = rowMul[i]! * HAIR_ROW;
    scene.anims.create({
      key: `${prefix}-hair-${dirs[i]}`,
      frames: scene.anims.generateFrameNumbers(textureKey, {
        frames: [base + r, base + r + 1, base + r + 2, base + r + 3],
      }),
      frameRate: 8,
      repeat: -1,
    });
  }
}

function createDressDir(
  scene: Scene,
  prefix: string,
  base: number,
  textureKey: string,
  keyPrefix: string,
) {
  const dirs = ["down", "up", "right", "left"] as const;
  const rowMul = [0, 1, 2, 3];
  for (let i = 0; i < 4; i++) {
    scene.anims.create({
      key: `${prefix}-${keyPrefix}-${dirs[i]}`,
      frames: scene.anims.generateFrameNumbers(textureKey, {
        frames: [base + rowMul[i]! * DRESS_ROW],
      }),
      frameRate: 8,
      repeat: -1,
    });
  }
}

function createPantsDir(scene: Scene, prefix: string, base: number) {
  createDressDir(scene, prefix, base, "pants_sheet", "bottom");
}

function createShoes(
  scene: Scene,
  prefix: string,
  base: number,
  textureKey: string,
  walk4: boolean,
) {
  const dirs = ["down", "up", "right", "left"] as const;
  for (let i = 0; i < 4; i++) {
    const r = i * SHOES_ROW;
    const frames = walk4
      ? [base + r, base + r + 1, base + r + 2, base + r + 3]
      : [base + r];
    scene.anims.create({
      key: `${prefix}-shoes-${dirs[i]}`,
      frames: scene.anims.generateFrameNumbers(textureKey, { frames }),
      frameRate: 8,
      repeat: -1,
    });
  }
}

function createEyes(
  scene: Scene,
  prefix: string,
  base: number,
  textureKey: string,
  walk4: boolean,
) {
  const dirs = ["down", "up", "right", "left"] as const;
  for (let i = 0; i < 4; i++) {
    const r = i * EYES_ROW;
    const frames = walk4
      ? [base + r, base + r + 1, base + r + 2, base + r + 3]
      : [base + r];
    scene.anims.create({
      key: `${prefix}-eyes-${dirs[i]}`,
      frames: scene.anims.generateFrameNumbers(textureKey, { frames }),
      frameRate: 8,
      repeat: -1,
    });
  }
}

function createBlushDir(scene: Scene, prefix: string, base: number) {
  const dirs = ["down", "up", "right", "left"] as const;
  for (let i = 0; i < 4; i++) {
    scene.anims.create({
      key: `${prefix}-blush-${dirs[i]}`,
      frames: scene.anims.generateFrameNumbers("blush_sheet", {
        frames: [base + i * BLUSH_ROW],
      }),
      frameRate: 8,
      repeat: -1,
    });
  }
}

function createLipstickDir(scene: Scene, prefix: string, base: number) {
  const dirs = ["down", "up", "right", "left"] as const;
  for (let i = 0; i < 4; i++) {
    scene.anims.create({
      key: `${prefix}-lipstick-${dirs[i]}`,
      frames: scene.anims.generateFrameNumbers("lipstick_sheet", {
        frames: [base + i * LIP_ROW],
      }),
      frameRate: 8,
      repeat: -1,
    });
  }
}

const DEFAULTS: Record<
  VillagerAnimProfile["id"],
  VillagerSample
> = {
  clover: {
    body: { key: "char_all_sheet", frame: 0 },
    dress: { key: "dress_sheet", frame: 2370 },
    eyes: { key: "eyes_sheet", frame: 19 },
    lips: { key: "lipstick_sheet", frame: 8 },
    shoes: { key: "shoes_sheet", frame: 76 },
    hair: { key: "wavy_sheet", frame: 12 },
  },
  rosie: {
    body: { key: "char_all_sheet", frame: 25 },
    dress: { key: "floral_sheet", frame: 53 },
    eyes: { key: "eyes_sheet", frame: 40 },
    lips: { key: "lipstick_sheet", frame: 8 },
    shoes: { key: "shoes_sheet", frame: 60 },
    hair: { key: "extra_long_sheet", frame: 49 },
  },
  scout: {
    body: { key: "char_all_sheet", frame: 24 },
    dress: { key: "floral_sheet", frame: 59 },
    eyes: { key: "eyes_sheet", frame: 64 },
    lips: { key: "lipstick_sheet", frame: 0 },
    shoes: { key: "shoes_sheet", frame: 20 },
    hair: { key: "extra_long_skirt_sheet", frame: 64 },
  },
  wren: {
    body: { key: "char_all_sheet", frame: 36 },
    dress: { key: "dress_sheet", frame: 45 },
    eyes: { key: "eyes_sheet", frame: 48 },
    lips: { key: "lipstick_sheet", frame: 24 },
    shoes: { key: "shoes_sheet", frame: 0 },
    hair: { key: "spacebuns_sheet", frame: 81 },
  },
};

function mergeSample(
  id: VillagerAnimProfile["id"],
  sample: Partial<Record<PartKey, PartBinding>>,
): VillagerSample {
  const d = DEFAULTS[id];
  const keys: PartKey[] = [
    "body",
    "dress",
    "eyes",
    "lips",
    "shoes",
    "hair",
  ];
  const out = { ...d };
  for (const k of keys) {
    const s = sample[k];
    if (s && typeof s.frame === "number" && s.key) {
      out[k] = { key: s.key, frame: s.frame };
    }
  }
  return out;
}

/** If a map tileset points at a texture that never loaded, fall back so Phaser does not draw the “missing texture” black square. */
function coerceLoadedTextures(
  scene: Scene,
  id: VillagerAnimProfile["id"],
  p: VillagerSample,
): VillagerSample {
  const d = DEFAULTS[id];
  const out = { ...p };
  const keys: PartKey[] = [
    "body",
    "dress",
    "eyes",
    "lips",
    "shoes",
    "hair",
  ];
  for (const k of keys) {
    if (!scene.textures.exists(out[k].key)) {
      console.warn(
        `[fernhollow] Missing texture "${out[k].key}" for ${id}.${k} — using default (${d[k].key}). Add the PNG under public/assets/fernhollow/cozy-people/ or fix the map tileset.`,
      );
      out[k] = { ...d[k] };
    }
  }
  return out;
}

/** Creates `prefix-*` walk animations from merged map sample + fallbacks. */
export function createVillagerAnimationSet(
  scene: Scene,
  prefix: VillagerAnimProfile["id"],
  sample: Partial<Record<PartKey, PartBinding>>,
): VillagerSample {
  const profile = VILLAGER_ANIM_PROFILES[prefix];
  const p = coerceLoadedTextures(scene, prefix, mergeSample(prefix, sample));

  createCharWalk(scene, prefix, p.body.frame, p.body.key);

  createHairWalk(scene, prefix, p.hair.frame, p.hair.key);

  createDressDir(scene, prefix, p.dress.frame, p.dress.key, "clothes");

  if (profile.hasPants) {
    createPantsDir(scene, prefix, 56);
  }

  if (profile.hasShoesLayer) {
    createShoes(
      scene,
      prefix,
      p.shoes.frame,
      p.shoes.key,
      profile.richShoesAndEyes,
    );
  }
  createEyes(
    scene,
    prefix,
    p.eyes.frame,
    p.eyes.key,
    profile.richShoesAndEyes,
  );

  const blushBase =
    prefix === "clover" ? 0 : prefix === "rosie" ? 8 : prefix === "scout" ? 16 : 8;
  createBlushDir(scene, prefix, blushBase);
  createLipstickDir(scene, prefix, p.lips.frame);

  return p;
}
