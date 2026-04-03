import type { GameObjects, Scene } from "phaser";
import { COZY_HOLLOW, PHASER_COZY } from "@/lib/assets";

const { tile, grassFrame, pathFrame, waterFrame } = PHASER_COZY;

/** Logical map: 30×20 cells, 16×16 px each → 480×320 world. */
export const GRID_COLS = 30;
export const GRID_ROWS = 20;
export const TILE_PX = 16;
export const WORLD_W = GRID_COLS * TILE_PX;
export const WORLD_H = GRID_ROWS * TILE_PX;

/** Sprite scale on ground/path/water tiles (`setScale(1)` on 16×16 frames). Used for character sizing. */
export const WORLD_SCALE = 1;

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
 * Upside-down T path: stem bottom-center (col 15) to row 10, horizontal bar at row 10,
 * then stem up to top-center (Clover).
 */
function isPathCell(c: number, r: number): boolean {
  if (c === 15 && r >= 10 && r <= 19) return true;
  if (r === 10 && c >= 8 && c <= 22) return true;
  if (c === 15 && r >= 0 && r <= 9) return true;
  return false;
}

/** River: horizontal band on the left, rows 8–10 (inclusive). */
function isWaterCell(c: number, r: number): boolean {
  return r >= 8 && r <= 10 && c >= 0 && c <= 8;
}

/** Bottom-left garden patch (meadow props). */
function isGardenCell(c: number, r: number): boolean {
  return r >= 14 && r <= 19 && c >= 0 && c <= 6;
}

/** Outer rim for edge trees (skip path + water). */
function isEdgeCell(c: number, r: number): boolean {
  return c === 0 || c === GRID_COLS - 1 || r === 0 || r === GRID_ROWS - 1;
}

export function preloadCozyHollow(scene: Scene): void {
  scene.load.spritesheet("cozy-ground", COZY_HOLLOW.groundTileset, {
    frameWidth: tile,
    frameHeight: tile,
  });
  scene.load.spritesheet("cozy-water", COZY_HOLLOW.waterGrassTileset, {
    frameWidth: tile,
    frameHeight: tile,
  });
  scene.load.spritesheet("cozy-meadow", COZY_HOLLOW.meadowAssets, {
    frameWidth: tile,
    frameHeight: tile,
  });
}

/** Normalized hit rect for river (rows 8–10, left band). */
export const COZY_RIVER_HIT = {
  nx: 0,
  ny: 8 / GRID_ROWS,
  nw: 9 / GRID_COLS,
  nh: 3 / GRID_ROWS,
} as const;

function buildMeadowScale(scene: Scene) {
  const tex = scene.textures.get("cozy-meadow");
  const totalFrames = Math.max(
    1,
    tex.frameTotal ??
      Object.keys(tex.frames).filter((k) => k !== "__BASE").length,
  );
  const fMax = Math.min(PHASER_COZY.meadowDecorFrameMax, totalFrames - 1);
  const fMin = Math.min(PHASER_COZY.meadowDecorFrameMin, fMax);
  const span = fMax - fMin;
  const flowerMax = fMin + Math.max(0, Math.floor(span / 3));
  const bushMax = fMin + Math.max(0, Math.floor((span * 2) / 3));

  const frameScaleCache = new Map<number, number>();
  const meadowScale = (frame: number, mul: number) => {
    let unit = frameScaleCache.get(frame);
    if (unit === undefined) {
      const s = scene.add.sprite(0, 0, "cozy-meadow", frame);
      unit = (TILE_PX * 0.95) / Math.max(s.width, 8);
      s.destroy();
      frameScaleCache.set(frame, unit);
    }
    return unit * mul;
  };

  return { fMin, fMax, flowerMax, bushMax, meadowScale };
}

/**
 * Distinct house vignettes using meadow + ground sheets (sprites on top of base grid).
 */
function placeHouseStyleClusters(
  scene: Scene,
  ctx: ReturnType<typeof buildMeadowScale>,
) {
  const { fMin, fMax, flowerMax, bushMax, meadowScale } = ctx;
  const flowerSpan = Math.max(1, flowerMax - fMin + 1);

  const addMeadow = (
    col: number,
    row: number,
    frame: number,
    depth: number,
    scaleMul: number,
    rot: number,
  ) => {
    const { x, y } = worldCenterOfCell(col, row);
    const spr = scene.add.sprite(x, y, "cozy-meadow", frame);
    spr.setDepth(depth);
    spr.setScale(meadowScale(frame, scaleMul));
    spr.setRotation(rot);
  };

  const addGround = (
    col: number,
    row: number,
    frame: number,
    depth: number,
  ) => {
    const { x, y } = worldCenterOfCell(col, row);
    const spr = scene.add.sprite(x, y, "cozy-ground", frame);
    spr.setDepth(depth);
    spr.setScale(1);
  };

  /** Clover — top-center: dense flowers + “cottage” mass (overflowing garden) */
  for (let row = 0; row <= 5; row++) {
    for (let col = 10; col <= 19; col++) {
      if (isPathCell(col, row) || isWaterCell(col, row)) continue;
      const layers = row <= 2 ? 3 : 2;
      for (let k = 0; k < layers; k++) {
        const frame =
          fMin + ((col * 11 + row * 17 + k * 3) % flowerSpan);
        const ox = ((col * 3 + row + k) % 5) * 0.15;
        const oy = ((row * 5 + col + k) % 4) * 0.12;
        const { x, y } = worldCenterOfCell(col, row);
        const spr = scene.add.sprite(
          x + ox * TILE_PX,
          y + oy * TILE_PX,
          "cozy-meadow",
          frame,
        );
        spr.setDepth(6 + k);
        spr.setScale(meadowScale(frame, 0.65 + (k % 3) * 0.12));
        spr.setRotation((((col + row + k) % 9) - 4) * 0.12);
      }
    }
  }

  /** Rosie — top-left: path tiles as warm roof + flowers / ivy */
  for (let row = 0; row <= 3; row++) {
    for (let col = 0; col <= 6; col++) {
      if (isPathCell(col, row) || isWaterCell(col, row)) continue;
      if (row <= 1 && col <= 4) {
        addGround(col, row, pathFrame, 5);
      }
      const frame =
        fMin + ((col * 13 + row * 7) % Math.max(1, flowerMax - fMin));
      addMeadow(col, row, frame, 7, 0.72 + (col % 3) * 0.06, (col % 5) * 0.05);
    }
  }

  /** Scout — top-right: structured dark stone (path frames) in a rectangle */
  for (let row = 0; row <= 3; row++) {
    for (let col = 24; col <= 29; col++) {
      if (isPathCell(col, row) || isWaterCell(col, row)) continue;
      addGround(col, row, pathFrame, 5);
      if ((col + row) % 2 === 0) {
        addGround(col, row, grassFrame, 4);
      }
    }
  }
  for (let row = 0; row <= 2; row++) {
    for (let col = 25; col <= 28; col++) {
      if (isPathCell(col, row) || isWaterCell(col, row)) continue;
      addGround(col, row, pathFrame, 6);
    }
  }

  /** Wren — bottom-right: chaotic mix of meadow + occasional ground */
  for (let row = 14; row <= 19; row++) {
    for (let col = 21; col <= 29; col++) {
      if (isPathCell(col, row) || isWaterCell(col, row)) continue;
      const pick = (col * 31 + row * 19) % 10;
      if (pick < 2) {
        addGround(col, row, pathFrame, 5);
      } else if (pick < 4) {
        addGround(col, row, grassFrame, 5);
      } else {
        const frame =
          fMin + ((col * 23 + row * 41) % Math.max(1, fMax - fMin + 1));
        addMeadow(
          col,
          row,
          frame,
          6 + (pick % 3),
          0.55 + ((col + row) % 7) * 0.08,
          ((col % 11) - 5) * 0.15,
        );
      }
    }
  }
}

/**
 * Ground grid (grass / path / water), meadow garden + edge trees + house vignettes.
 */
export function createCozyEnvironment(scene: Scene) {
  const ctx = buildMeadowScale(scene);
  const { fMin, fMax, flowerMax, bushMax, meadowScale } = ctx;

  const flowerSpan = Math.max(1, flowerMax - fMin + 1);

  const waterSprites: GameObjects.Sprite[] = [];

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const { x, y } = worldCenterOfCell(col, row);
      let spr: GameObjects.Sprite;
      if (isWaterCell(col, row)) {
        spr = scene.add.sprite(x, y, "cozy-water", waterFrame);
        spr.setDepth(1);
        waterSprites.push(spr);
      } else if (isPathCell(col, row)) {
        spr = scene.add.sprite(x, y, "cozy-ground", pathFrame);
        spr.setDepth(1);
      } else {
        spr = scene.add.sprite(x, y, "cozy-ground", grassFrame);
        spr.setDepth(0);
      }
      spr.setScale(1);
    }
  }

  /** Garden: flowers + small props bottom-left */
  for (let row = 14; row <= 19; row++) {
    for (let col = 0; col <= 6; col++) {
      if (isPathCell(col, row) || isWaterCell(col, row)) continue;
      if ((col + row) % 2 !== 0) continue;
      const frame = fMin + ((col * 17 + row * 31) % flowerSpan);
      const { x, y } = worldCenterOfCell(col, row);
      const spr = scene.add.sprite(x, y, "cozy-meadow", frame);
      spr.setDepth(2);
      spr.setScale(meadowScale(frame, 0.75 + ((col + row) % 5) * 0.04));
      spr.setRotation((((col + row) % 7) - 3) * 0.08);
    }
  }

  /** Edge trees */
  const treeLo = Math.min(fMax, Math.max(bushMax, fMin));
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (!isEdgeCell(col, row)) continue;
      if (isGardenCell(col, row)) continue;
      if (isPathCell(col, row) || isWaterCell(col, row)) continue;
      const frame =
        treeLo + ((col * 3 + row * 5) % Math.max(1, fMax - treeLo + 1));
      const { x, y } = worldCenterOfCell(col, row);
      const spr = scene.add.sprite(x, y, "cozy-meadow", frame);
      spr.setDepth(3);
      spr.setScale(meadowScale(frame, 1.1 + ((col + row) % 4) * 0.06));
      spr.setRotation((((col + row) % 5) - 2) * 0.06);
    }
  }

  placeHouseStyleClusters(scene, ctx);

  for (let i = 0; i < waterSprites.length; i++) {
    const s = waterSprites[i];
    scene.tweens.add({
      targets: s,
      y: s.y + 1,
      duration: 1400 + (i % 5) * 120,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
