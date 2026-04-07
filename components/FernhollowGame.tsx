"use client";

import { useEffect, useRef } from "react";
import type { Scene } from "phaser";
import { FERNHOLLOW_OPEN_CHAT_EVENT, fernhollowAssetPath } from "@/lib/assets";
import {
  COZY_RIVER_HIT,
  WATER_ANIMATION_32_KEY,
  WATER_ANIMATION_FRAME_COUNT,
  WORLD_H,
  WORLD_W,
  createCozyEnvironment,
  preloadCozyHollow,
} from "@/lib/phaser-cozy-village";

/** House labels + tap targets (normalized 0–1). */
const HOUSE_LABEL_ANCHORS = [
  {
    slug: "clovers-house",
    label: "🍀 Clover",
    nx: 0.22,
    ny: 0.13,
    nw: 0.18,
    nh: 0.18,
  },
  {
    slug: "rosies-cottage",
    label: "🌸 Rosie",
    nx: 0.18,
    ny: 0.6,
    nw: 0.18,
    nh: 0.18,
  },
  {
    slug: "scouts-workshop",
    label: "⚙️ Scout",
    nx: 0.9,
    ny: 0.28,
    nw: 0.16,
    nh: 0.18,
  },
  {
    slug: "wrens-house",
    label: "✨ Wren",
    nx: 0.82,
    ny: 0.74,
    nw: 0.18,
    nh: 0.18,
  },
] as const;

const WORLD_HOTSPOTS = [
  { slug: "river", ...COZY_RIVER_HIT },
  { slug: "garden", nx: 0, ny: 14 / 20, nw: 7 / 30, nh: 6 / 20 },
  {
    slug: "village-square",
    nx: 13 / 30,
    ny: 9 / 20,
    nw: 4 / 30,
    nh: 3 / 20,
  },
] as const;

/** Map cells for animated villagers (skip static paper-doll tiles here). */
const CLOVER_CELL = { tx: 5, ty: 6 } as const;
const ROSIE_CELL = { tx: 25, ty: 9 } as const;
const SCOUT_CELL = { tx: 4, ty: 15 } as const;
const WREN_CELL = { tx: 25, ty: 18 } as const;

const CHARACTER_SKIP_CELLS = [
  CLOVER_CELL,
  ROSIE_CELL,
  SCOUT_CELL,
  WREN_CELL,
];

function emitOpenChat(slug: string) {
  window.dispatchEvent(
    new CustomEvent(FERNHOLLOW_OPEN_CHAT_EVENT, { detail: { slug } }),
  );
}

function addInvisibleHitZone(
  scene: Scene,
  cx: number,
  cy: number,
  rw: number,
  rh: number,
  slug: string,
) {
  const zone = scene.add.zone(cx, cy, rw, rh);
  zone.setDepth(25);
  zone.setInteractive({ useHandCursor: true });
  zone.on("pointerdown", () => emitOpenChat(slug));
  zone.on("pointerover", () => {
    document.body.style.cursor = "pointer";
  });
  zone.on("pointerout", () => {
    document.body.style.cursor = "default";
  });
}

export function FernhollowGame({
  chatOverlayOpen = false,
}: {
  chatOverlayOpen?: boolean;
} = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const chatOverlayOpenRef = useRef(chatOverlayOpen);
  chatOverlayOpenRef.current = chatOverlayOpen;

  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    g.input.enabled = !chatOverlayOpen;
  }, [chatOverlayOpen]);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    let game: import("phaser").Game | null = null;
    let cancelled = false;

    void import("phaser").then((Phaser) => {
      if (cancelled || !parent) return;

      class VillageScene extends Phaser.Scene {
        constructor() {
          super({ key: "village" });
        }

        preload() {
          this.load.on("loaderror", (file: Phaser.Loader.File) => {
            console.error("PHASER LOAD ERROR:", file.key, file.url);
          });
          this.load.on("filecomplete", (key: string, type: string) => {
            console.log("PHASER LOADED OK:", key, type);
          });

          preloadCozyHollow(this);
          this.load.spritesheet(
            "char_all_sheet",
            fernhollowAssetPath("cozy-people", "characters", "char_all.png"),
            { frameWidth: 32, frameHeight: 32 },
          );
          this.load.spritesheet(
            "wavy_sheet",
            fernhollowAssetPath("cozy-people", "hair", "wavy.png"),
            { frameWidth: 32, frameHeight: 32 },
          );
          this.load.spritesheet(
            "dress_sheet",
            fernhollowAssetPath("cozy-people", "clothes", "dress.png"),
            { frameWidth: 32, frameHeight: 32 },
          );
          this.load.spritesheet(
            "pants_sheet",
            fernhollowAssetPath("cozy-people", "clothes", "pants.png"),
            { frameWidth: 32, frameHeight: 32 },
          );
          this.load.spritesheet(
            "shoes_sheet",
            fernhollowAssetPath("cozy-people", "clothes", "shoes.png"),
            { frameWidth: 32, frameHeight: 32 },
          );
          this.load.spritesheet(
            "spacebuns_sheet",
            fernhollowAssetPath("cozy-people", "hair", "spacebuns.png"),
            { frameWidth: 32, frameHeight: 32 },
          );
          this.load.spritesheet(
            "extra_long_sheet",
            fernhollowAssetPath("cozy-people", "hair", "extra_long.png"),
            { frameWidth: 32, frameHeight: 32 },
          );
          this.load.spritesheet(
            "extra_long_skirt_sheet",
            fernhollowAssetPath("cozy-people", "hair", "extra_long_skirt.png"),
            { frameWidth: 32, frameHeight: 32 },
          );
          this.load.spritesheet(
            "floral_sheet",
            fernhollowAssetPath("cozy-people", "clothes", "floral.png"),
            { frameWidth: 32, frameHeight: 32 },
          );
          this.load.spritesheet(
            "eyes_sheet",
            fernhollowAssetPath("cozy-people", "eyes", "eyes.png"),
            { frameWidth: 32, frameHeight: 32 },
          );
          this.load.spritesheet(
            "blush_sheet",
            fernhollowAssetPath("cozy-people", "eyes", "blush_all.png"),
            { frameWidth: 32, frameHeight: 32 },
          );
          this.load.spritesheet(
            "lipstick_sheet",
            fernhollowAssetPath("cozy-people", "eyes", "lipstick .png"),
            { frameWidth: 32, frameHeight: 32 },
          );
        }

        create() {
          const prevWarn = console.warn;
          console.warn = (...args: unknown[]) => {
            if (
              typeof args[0] === "string" &&
              args[0].includes("Image tile area not tile size multiple")
            ) {
              return;
            }
            prevWarn.apply(console, args as Parameters<typeof console.warn>);
          };
          let env;
          try {
            env = createCozyEnvironment(this);
          } finally {
            console.warn = prevWarn;
          }
          if (!env) return;

          const { map, mapScale, offsetX, offsetY } = env;
          const tileSize = map.tileWidth;

          /**
           * Tiled layers can mix tiles from several tilesets. Only draw when the tile GID
           * (`tile.index`) falls inside this tileset's global id range, so the spritesheet
           * frame index stays valid.
           */
          const renderLayerAsSprites = (
            layerName: string,
            textureKey: string,
            tilesetName: string,
            depth: number,
            skipCells?: ReadonlyArray<{ tx: number; ty: number }>,
          ) => {
            const tileset = map.tilesets.find((t) => t.name === tilesetName);
            if (!tileset || tileset.total <= 0) return;

            const firstgid = tileset.firstgid;
            const lastGid = firstgid + tileset.total - 1;

            const skipSet =
              skipCells && skipCells.length > 0
                ? new Set(skipCells.map((c) => `${c.tx},${c.ty}`))
                : null;

            const layerData = map.getLayer(layerName);
            layerData?.tilemapLayer?.setVisible(false);
            for (let ty = 0; ty < map.height; ty++) {
              for (let tx = 0; tx < map.width; tx++) {
                if (skipSet?.has(`${tx},${ty}`)) continue;
                const tile = map.getTileAt(tx, ty, false, layerName);
                if (!tile || tile.index <= 0) continue;
                const gid = tile.index;
                if (gid < firstgid || gid > lastGid) continue;
                const frame = gid - firstgid;
                const wx =
                  (tx * tileSize + tileSize / 2) * mapScale + offsetX;
                const wy =
                  (ty * tileSize + tileSize / 2) * mapScale + offsetY;
                this.add
                  .image(wx, wy, textureKey, frame)
                  .setOrigin(0.5, 0.5)
                  .setScale(mapScale * 2)
                  .setDepth(depth);
              }
            }
          };

          renderLayerAsSprites(
            "girls",
            "char_all_sheet",
            "char_all",
            20,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "hair",
            "wavy_sheet",
            "wavy",
            21,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "hair",
            "spacebuns_sheet",
            "spacebuns",
            21,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "hair",
            "extra_long_sheet",
            "extra_long",
            21,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "hair",
            "extra_long_skirt_sheet",
            "extra_long_skirt",
            21,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "clothes",
            "dress_sheet",
            "dress",
            22,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "clothes",
            "floral_sheet",
            "floral",
            22,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "clothes bottom",
            "pants_sheet",
            "pants",
            21,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "clothes bottom",
            "extra_long_skirt_sheet",
            "extra_long_skirt",
            21,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "clothes bottom",
            "dress_sheet",
            "dress",
            21,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "shoes",
            "shoes_sheet",
            "shoes",
            20,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "eyes",
            "eyes_sheet",
            "eyes",
            23,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "blush",
            "blush_sheet",
            "blush_all",
            23,
            CHARACTER_SKIP_CELLS,
          );
          renderLayerAsSprites(
            "lipstick",
            "lipstick_sheet",
            "lipstick ",
            23,
            CHARACTER_SKIP_CELLS,
          );

          map.getLayer("water")?.tilemapLayer?.setVisible(false);
          const waterAnimLayerData = map.getLayer("water animation");
          const waterDepth = waterAnimLayerData?.tilemapLayer?.depth ?? 1;
          waterAnimLayerData?.tilemapLayer?.setVisible(false);

          let waterFrame = 0;
          const waterSprites: Phaser.GameObjects.Image[] = [];
          for (let ty = 0; ty < map.height; ty++) {
            for (let tx = 0; tx < map.width; tx++) {
              const tile = map.getTileAt(tx, ty, false, "water animation");
              if (!tile || tile.index <= 0) continue;
              const wx =
                (tx * tileSize + tileSize / 2) * mapScale + offsetX;
              const wy =
                (ty * tileSize + tileSize / 2) * mapScale + offsetY;
              waterSprites.push(
                this.add
                  .image(wx, wy, WATER_ANIMATION_32_KEY, 0)
                  .setOrigin(0.5, 0.5)
                  .setScale(mapScale * 2)
                  .setDepth(waterDepth),
              );
            }
          }

          this.time.addEvent({
            delay: 150,
            loop: true,
            callback: () => {
              waterFrame =
                (waterFrame + 1) % WATER_ANIMATION_FRAME_COUNT;
              for (const sprite of waterSprites) {
                sprite.setFrame(waterFrame);
              }
            },
          });

          const cloverTX = CLOVER_CELL.tx;
          const cloverTY = CLOVER_CELL.ty;
          const cloverWX =
            (cloverTX * tileSize + tileSize / 2) * mapScale + offsetX;
          const cloverWY =
            (cloverTY * tileSize + tileSize / 2) * mapScale + offsetY;

          const rosieTX = ROSIE_CELL.tx;
          const rosieTY = ROSIE_CELL.ty;
          const rosieWX =
            (rosieTX * tileSize + tileSize / 2) * mapScale + offsetX;
          const rosieWY =
            (rosieTY * tileSize + tileSize / 2) * mapScale + offsetY;

          const scoutTX = SCOUT_CELL.tx;
          const scoutTY = SCOUT_CELL.ty;
          const scoutWX =
            (scoutTX * tileSize + tileSize / 2) * mapScale + offsetX;
          const scoutWY =
            (scoutTY * tileSize + tileSize / 2) * mapScale + offsetY;

          const wrenTX = WREN_CELL.tx;
          const wrenTY = WREN_CELL.ty;
          const wrenWX =
            (wrenTX * tileSize + tileSize / 2) * mapScale + offsetX;
          const wrenWY =
            (wrenTY * tileSize + tileSize / 2) * mapScale + offsetY;

          /** Body — 64 cols, col 0 (down / up / right / left rows). */
          this.anims.create({
            key: "clover-walk-down",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [0, 1, 2, 3],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-walk-up",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [64, 65, 66, 67],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-walk-right",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [128, 129, 130, 131],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-walk-left",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [192, 193, 194, 195],
            }),
            frameRate: 8,
            repeat: -1,
          });

          /** Wavy hair — 112 cols, col 12 */
          this.anims.create({
            key: "clover-hair-down",
            frames: this.anims.generateFrameNumbers("wavy_sheet", {
              frames: [12, 13, 14, 15],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-hair-up",
            frames: this.anims.generateFrameNumbers("wavy_sheet", {
              frames: [124, 125, 126, 127],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-hair-right",
            frames: this.anims.generateFrameNumbers("wavy_sheet", {
              frames: [236, 237, 238, 239],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-hair-left",
            frames: this.anims.generateFrameNumbers("wavy_sheet", {
              frames: [348, 349, 350, 351],
            }),
            frameRate: 8,
            repeat: -1,
          });

          /** Dress — col base 2370, 80 cols per row (down / up / right / left). */
          this.anims.create({
            key: "clover-clothes-down",
            frames: this.anims.generateFrameNumbers("dress_sheet", {
              frames: [2370],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-clothes-up",
            frames: this.anims.generateFrameNumbers("dress_sheet", {
              frames: [2370 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-clothes-right",
            frames: this.anims.generateFrameNumbers("dress_sheet", {
              frames: [2370 + 160],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-clothes-left",
            frames: this.anims.generateFrameNumbers("dress_sheet", {
              frames: [2370 + 240],
            }),
            frameRate: 8,
            repeat: -1,
          });

          /** Shoes — 80 cols, col 76 */
          this.anims.create({
            key: "clover-shoes-down",
            frames: this.anims.generateFrameNumbers("shoes_sheet", {
              frames: [76, 77, 78, 79],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-shoes-up",
            frames: this.anims.generateFrameNumbers("shoes_sheet", {
              frames: [156, 157, 158, 159],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-shoes-right",
            frames: this.anims.generateFrameNumbers("shoes_sheet", {
              frames: [236, 237, 238, 239],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-shoes-left",
            frames: this.anims.generateFrameNumbers("shoes_sheet", {
              frames: [316, 317, 318, 319],
            }),
            frameRate: 8,
            repeat: -1,
          });

          /** Eyes — 112 cols, col 19 */
          this.anims.create({
            key: "clover-eyes-down",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [19, 20, 21, 22],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-eyes-up",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [131, 132, 133, 134],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-eyes-right",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [243, 244, 245, 246],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-eyes-left",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [355, 356, 357, 358],
            }),
            frameRate: 8,
            repeat: -1,
          });

          /** Blush — 40 cols, col 0 */
          this.anims.create({
            key: "clover-blush-down",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [0, 1, 2, 3],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-blush-up",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [40, 41, 42, 43],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-blush-right",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [80, 81, 82, 83],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-blush-left",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [120, 121, 122, 123],
            }),
            frameRate: 8,
            repeat: -1,
          });

          /** Lipstick — 40 cols, col 8 */
          this.anims.create({
            key: "clover-lipstick-down",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [8, 9, 10, 11],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-lipstick-up",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [48, 49, 50, 51],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-lipstick-right",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [88, 89, 90, 91],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "clover-lipstick-left",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [128, 129, 130, 131],
            }),
            frameRate: 8,
            repeat: -1,
          });

          /** ── Rosie (char col 25) */
          this.anims.create({
            key: "rosie-walk-down",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [25, 26, 27, 28],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-walk-up",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [89, 90, 91, 92],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-walk-right",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [153, 154, 155, 156],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-walk-left",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [217, 218, 219, 220],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-hair-down",
            frames: this.anims.generateFrameNumbers("extra_long_sheet", {
              frames: [49, 50, 51, 52],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-hair-up",
            frames: this.anims.generateFrameNumbers("extra_long_sheet", {
              frames: [161, 162, 163, 164],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-hair-right",
            frames: this.anims.generateFrameNumbers("extra_long_sheet", {
              frames: [273, 274, 275, 276],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-hair-left",
            frames: this.anims.generateFrameNumbers("extra_long_sheet", {
              frames: [385, 386, 387, 388],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-clothes-down",
            frames: this.anims.generateFrameNumbers("floral_sheet", {
              frames: [53],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-clothes-up",
            frames: this.anims.generateFrameNumbers("floral_sheet", {
              frames: [53 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-clothes-right",
            frames: this.anims.generateFrameNumbers("floral_sheet", {
              frames: [53 + 160],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-clothes-left",
            frames: this.anims.generateFrameNumbers("floral_sheet", {
              frames: [53 + 240],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-bottom-down",
            frames: this.anims.generateFrameNumbers("pants_sheet", {
              frames: [56],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-bottom-up",
            frames: this.anims.generateFrameNumbers("pants_sheet", {
              frames: [56 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-bottom-right",
            frames: this.anims.generateFrameNumbers("pants_sheet", {
              frames: [56 + 160],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-bottom-left",
            frames: this.anims.generateFrameNumbers("pants_sheet", {
              frames: [56 + 240],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-shoes-down",
            frames: this.anims.generateFrameNumbers("shoes_sheet", {
              frames: [60],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-shoes-up",
            frames: this.anims.generateFrameNumbers("shoes_sheet", {
              frames: [60 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-shoes-right",
            frames: this.anims.generateFrameNumbers("shoes_sheet", {
              frames: [60 + 160],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-shoes-left",
            frames: this.anims.generateFrameNumbers("shoes_sheet", {
              frames: [60 + 240],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-eyes-down",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [40],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-eyes-up",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [40 + 112],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-eyes-right",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [40 + 224],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-eyes-left",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [40 + 336],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-blush-down",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [8],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-blush-up",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [8 + 40],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-blush-right",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [8 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-blush-left",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [8 + 120],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-lipstick-down",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [8],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-lipstick-up",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [8 + 40],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-lipstick-right",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [8 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "rosie-lipstick-left",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [8 + 120],
            }),
            frameRate: 8,
            repeat: -1,
          });

          /** ── Scout (char col 24) */
          this.anims.create({
            key: "scout-walk-down",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [24, 25, 26, 27],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-walk-up",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [88, 89, 90, 91],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-walk-right",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [152, 153, 154, 155],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-walk-left",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [216, 217, 218, 219],
            }),
            frameRate: 8,
            repeat: -1,
          });
          /** Four frames per dir so hair tracks walk (single frame left scalp visible vs body). */
          this.anims.create({
            key: "scout-hair-down",
            frames: this.anims.generateFrameNumbers("extra_long_skirt_sheet", {
              frames: [64, 65, 66, 67],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-hair-up",
            frames: this.anims.generateFrameNumbers("extra_long_skirt_sheet", {
              frames: [176, 177, 178, 179],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-hair-right",
            frames: this.anims.generateFrameNumbers("extra_long_skirt_sheet", {
              frames: [288, 289, 290, 291],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-hair-left",
            frames: this.anims.generateFrameNumbers("extra_long_skirt_sheet", {
              frames: [400, 401, 402, 403],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-clothes-down",
            frames: this.anims.generateFrameNumbers("floral_sheet", {
              frames: [59],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-clothes-up",
            frames: this.anims.generateFrameNumbers("floral_sheet", {
              frames: [59 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-clothes-right",
            frames: this.anims.generateFrameNumbers("floral_sheet", {
              frames: [59 + 160],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-clothes-left",
            frames: this.anims.generateFrameNumbers("floral_sheet", {
              frames: [59 + 240],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-bottom-down",
            frames: this.anims.generateFrameNumbers("pants_sheet", {
              frames: [56],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-bottom-up",
            frames: this.anims.generateFrameNumbers("pants_sheet", {
              frames: [56 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-bottom-right",
            frames: this.anims.generateFrameNumbers("pants_sheet", {
              frames: [56 + 160],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-bottom-left",
            frames: this.anims.generateFrameNumbers("pants_sheet", {
              frames: [56 + 240],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-shoes-down",
            frames: this.anims.generateFrameNumbers("shoes_sheet", {
              frames: [20],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-shoes-up",
            frames: this.anims.generateFrameNumbers("shoes_sheet", {
              frames: [20 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-shoes-right",
            frames: this.anims.generateFrameNumbers("shoes_sheet", {
              frames: [20 + 160],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-shoes-left",
            frames: this.anims.generateFrameNumbers("shoes_sheet", {
              frames: [20 + 240],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-eyes-down",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [64],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-eyes-up",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [64 + 112],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-eyes-right",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [64 + 224],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-eyes-left",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [64 + 336],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-blush-down",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [16],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-blush-up",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [16 + 40],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-blush-right",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [16 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-blush-left",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [16 + 120],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-lipstick-down",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [0],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-lipstick-up",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [40],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-lipstick-right",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "scout-lipstick-left",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [120],
            }),
            frameRate: 8,
            repeat: -1,
          });

          /** ── Wren (char col 36) */
          this.anims.create({
            key: "wren-walk-down",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [36, 37, 38, 39],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-walk-up",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [100, 101, 102, 103],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-walk-right",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [164, 165, 166, 167],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-walk-left",
            frames: this.anims.generateFrameNumbers("char_all_sheet", {
              frames: [228, 229, 230, 231],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-hair-down",
            frames: this.anims.generateFrameNumbers("spacebuns_sheet", {
              frames: [81, 82, 83, 84],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-hair-up",
            frames: this.anims.generateFrameNumbers("spacebuns_sheet", {
              frames: [193, 194, 195, 196],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-hair-right",
            frames: this.anims.generateFrameNumbers("spacebuns_sheet", {
              frames: [305, 306, 307, 308],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-hair-left",
            frames: this.anims.generateFrameNumbers("spacebuns_sheet", {
              frames: [417, 418, 419, 420],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-clothes-down",
            frames: this.anims.generateFrameNumbers("dress_sheet", {
              frames: [45],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-clothes-up",
            frames: this.anims.generateFrameNumbers("dress_sheet", {
              frames: [45 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-clothes-right",
            frames: this.anims.generateFrameNumbers("dress_sheet", {
              frames: [45 + 160],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-clothes-left",
            frames: this.anims.generateFrameNumbers("dress_sheet", {
              frames: [45 + 240],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-eyes-down",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [48],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-eyes-up",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [48 + 112],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-eyes-right",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [48 + 224],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-eyes-left",
            frames: this.anims.generateFrameNumbers("eyes_sheet", {
              frames: [48 + 336],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-blush-down",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [8],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-blush-up",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [8 + 40],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-blush-right",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [8 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-blush-left",
            frames: this.anims.generateFrameNumbers("blush_sheet", {
              frames: [8 + 120],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-lipstick-down",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [24],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-lipstick-up",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [24 + 40],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-lipstick-right",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [24 + 80],
            }),
            frameRate: 8,
            repeat: -1,
          });
          this.anims.create({
            key: "wren-lipstick-left",
            frames: this.anims.generateFrameNumbers("lipstick_sheet", {
              frames: [24 + 120],
            }),
            frameRate: 8,
            repeat: -1,
          });

          const scale = mapScale * 2;
          const body = this.add
            .sprite(0, 0, "char_all_sheet", 0)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const hair = this.add
            .sprite(0, 0, "wavy_sheet", 12)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const clothes = this.add
            .sprite(0, 0, "dress_sheet", 2370)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const shoes = this.add
            .sprite(0, 0, "shoes_sheet", 76)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const eyes = this.add
            .sprite(0, 0, "eyes_sheet", 19)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const blush = this.add
            .sprite(0, 0, "blush_sheet", 0)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const lipstick = this.add
            .sprite(0, 0, "lipstick_sheet", 8)
            .setOrigin(0.5, 0.5)
            .setScale(scale);

          const cloverContainer = this.add.container(cloverWX, cloverWY, [
            body,
            shoes,
            clothes,
            hair,
            eyes,
            blush,
            lipstick,
          ]);
          cloverContainer.setDepth(20);

          const playCloverAnim = (dir: "down" | "left" | "right" | "up") => {
            body.play(`clover-walk-${dir}`);
            hair.play(`clover-hair-${dir}`);
            clothes.play(`clover-clothes-${dir}`);
            shoes.play(`clover-shoes-${dir}`);
            eyes.play(`clover-eyes-${dir}`);
            blush.play(`clover-blush-${dir}`);
            lipstick.play(`clover-lipstick-${dir}`);
          };

          const resetCloverIdle = () => {
            body.anims.stop();
            hair.anims.stop();
            clothes.anims.stop();
            shoes.anims.stop();
            eyes.anims.stop();
            blush.anims.stop();
            lipstick.anims.stop();
            body.setFrame(0);
            hair.setFrame(12);
            clothes.setFrame(2370);
            shoes.setFrame(76);
            eyes.setFrame(19);
            blush.setFrame(0);
            lipstick.setFrame(8);
          };

          body.play("clover-walk-down");
          hair.play("clover-hair-down");
          clothes.play("clover-clothes-down");
          shoes.play("clover-shoes-down");
          eyes.play("clover-eyes-down");
          blush.play("clover-blush-down");
          lipstick.play("clover-lipstick-down");

          const roamRadius = 60 * mapScale;

          const roamClover = () => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 * mapScale + Math.random() * roamRadius;
            const targetX = cloverWX + Math.cos(angle) * dist;
            const targetY = cloverWY + Math.sin(angle) * dist;
            const dx = targetX - cloverContainer.x;
            const dy = targetY - cloverContainer.y;

            if (Math.abs(dx) > Math.abs(dy)) {
              playCloverAnim(dx > 0 ? "right" : "left");
            } else {
              playCloverAnim(dy > 0 ? "down" : "up");
            }

            const distance = Math.sqrt(dx * dx + dy * dy);
            this.tweens.add({
              targets: cloverContainer,
              x: targetX,
              y: targetY,
              duration: (distance / (30 * mapScale)) * 1000,
              ease: "Linear",
              onComplete: () => {
                resetCloverIdle();
                this.time.delayedCall(
                  1000 + Math.random() * 2000,
                  roamClover,
                );
              },
            });
          };

          this.time.delayedCall(500, roamClover);

          const rosieBody = this.add
            .sprite(0, 0, "char_all_sheet", 25)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieHair = this.add
            .sprite(0, 0, "extra_long_sheet", 49)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieClothes = this.add
            .sprite(0, 0, "floral_sheet", 53)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieBottom = this.add
            .sprite(0, 0, "pants_sheet", 56)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieShoes = this.add
            .sprite(0, 0, "shoes_sheet", 60)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieEyes = this.add
            .sprite(0, 0, "eyes_sheet", 40)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieBlush = this.add
            .sprite(0, 0, "blush_sheet", 8)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieLipstick = this.add
            .sprite(0, 0, "lipstick_sheet", 8)
            .setOrigin(0.5, 0.5)
            .setScale(scale);

          const rosieContainer = this.add.container(rosieWX, rosieWY, [
            rosieBody,
            rosieShoes,
            rosieBottom,
            rosieClothes,
            rosieEyes,
            rosieBlush,
            rosieHair,
            rosieLipstick,
          ]);
          rosieContainer.setDepth(20);

          const syncRosieHairToBodyWalk = (
            anim: { key: string },
            frame: { index: number },
          ) => {
            if (!anim.key.startsWith("rosie-walk")) return;
            const hairKey = anim.key.replace("rosie-walk", "rosie-hair");
            const hairAnim = this.anims.get(hairKey);
            if (!hairAnim || frame.index >= hairAnim.frames.length) return;
            rosieHair.anims.stop();
            rosieHair.setFrame(hairAnim.frames[frame.index].frame);
          };
          rosieBody.on("animationstart", syncRosieHairToBodyWalk);
          rosieBody.on("animationupdate", syncRosieHairToBodyWalk);

          const playRosieAnim = (dir: "down" | "left" | "right" | "up") => {
            rosieBody.play(`rosie-walk-${dir}`);
            rosieClothes.play(`rosie-clothes-${dir}`);
            rosieBottom.play(`rosie-bottom-${dir}`);
            rosieShoes.play(`rosie-shoes-${dir}`);
            rosieEyes.play(`rosie-eyes-${dir}`);
            rosieBlush.play(`rosie-blush-${dir}`);
            rosieLipstick.play(`rosie-lipstick-${dir}`);
          };

          const resetRosieIdle = () => {
            rosieBody.anims.stop();
            rosieHair.anims.stop();
            rosieClothes.anims.stop();
            rosieBottom.anims.stop();
            rosieShoes.anims.stop();
            rosieEyes.anims.stop();
            rosieBlush.anims.stop();
            rosieLipstick.anims.stop();
            rosieBody.setFrame(25);
            rosieHair.setFrame(49);
            rosieClothes.setFrame(53);
            rosieBottom.setFrame(56);
            rosieShoes.setFrame(60);
            rosieEyes.setFrame(40);
            rosieBlush.setFrame(8);
            rosieLipstick.setFrame(8);
          };

          playRosieAnim("down");

          const roamRosie = () => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 * mapScale + Math.random() * roamRadius;
            const targetX = rosieWX + Math.cos(angle) * dist;
            const targetY = rosieWY + Math.sin(angle) * dist;
            const dx = targetX - rosieContainer.x;
            const dy = targetY - rosieContainer.y;
            if (Math.abs(dx) > Math.abs(dy)) {
              playRosieAnim(dx > 0 ? "right" : "left");
            } else {
              playRosieAnim(dy > 0 ? "down" : "up");
            }
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.tweens.add({
              targets: rosieContainer,
              x: targetX,
              y: targetY,
              duration: (distance / (30 * mapScale)) * 1000,
              ease: "Linear",
              onComplete: () => {
                resetRosieIdle();
                this.time.delayedCall(
                  1000 + Math.random() * 2000,
                  roamRosie,
                );
              },
            });
          };
          this.time.delayedCall(800, roamRosie);

          const scoutBody = this.add
            .sprite(0, 0, "char_all_sheet", 24)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutHair = this.add
            .sprite(0, 0, "extra_long_skirt_sheet", 64)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutClothes = this.add
            .sprite(0, 0, "floral_sheet", 59)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutBottom = this.add
            .sprite(0, 0, "pants_sheet", 56)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutShoes = this.add
            .sprite(0, 0, "shoes_sheet", 20)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutEyes = this.add
            .sprite(0, 0, "eyes_sheet", 64)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutBlush = this.add
            .sprite(0, 0, "blush_sheet", 16)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutLipstick = this.add
            .sprite(0, 0, "lipstick_sheet", 0)
            .setOrigin(0.5, 0.5)
            .setScale(scale);

          const scoutContainer = this.add.container(scoutWX, scoutWY, [
            scoutBody,
            scoutShoes,
            scoutBottom,
            scoutClothes,
            scoutHair,
            scoutEyes,
            scoutBlush,
            scoutLipstick,
          ]);
          scoutContainer.setDepth(20);

          const syncScoutHairToBodyWalk = (
            anim: { key: string },
            frame: { index: number },
          ) => {
            if (!anim.key.startsWith("scout-walk")) return;
            const hairKey = anim.key.replace("scout-walk", "scout-hair");
            const hairAnim = this.anims.get(hairKey);
            if (!hairAnim || frame.index >= hairAnim.frames.length) return;
            scoutHair.anims.stop();
            scoutHair.setFrame(hairAnim.frames[frame.index].frame);
          };
          scoutBody.on("animationstart", syncScoutHairToBodyWalk);
          scoutBody.on("animationupdate", syncScoutHairToBodyWalk);

          const playScoutAnim = (dir: "down" | "left" | "right" | "up") => {
            scoutBody.play(`scout-walk-${dir}`);
            scoutClothes.play(`scout-clothes-${dir}`);
            scoutBottom.play(`scout-bottom-${dir}`);
            scoutShoes.play(`scout-shoes-${dir}`);
            scoutEyes.play(`scout-eyes-${dir}`);
            scoutBlush.play(`scout-blush-${dir}`);
            scoutLipstick.play(`scout-lipstick-${dir}`);
          };

          const resetScoutIdle = () => {
            scoutBody.anims.stop();
            scoutHair.anims.stop();
            scoutClothes.anims.stop();
            scoutBottom.anims.stop();
            scoutShoes.anims.stop();
            scoutEyes.anims.stop();
            scoutBlush.anims.stop();
            scoutLipstick.anims.stop();
            scoutBody.setFrame(24);
            scoutHair.setFrame(64);
            scoutClothes.setFrame(59);
            scoutBottom.setFrame(56);
            scoutShoes.setFrame(20);
            scoutEyes.setFrame(64);
            scoutBlush.setFrame(16);
            scoutLipstick.setFrame(0);
          };

          playScoutAnim("down");

          const roamScout = () => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 * mapScale + Math.random() * roamRadius;
            const targetX = scoutWX + Math.cos(angle) * dist;
            const targetY = scoutWY + Math.sin(angle) * dist;
            const dx = targetX - scoutContainer.x;
            const dy = targetY - scoutContainer.y;
            if (Math.abs(dx) > Math.abs(dy)) {
              playScoutAnim(dx > 0 ? "right" : "left");
            } else {
              playScoutAnim(dy > 0 ? "down" : "up");
            }
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.tweens.add({
              targets: scoutContainer,
              x: targetX,
              y: targetY,
              duration: (distance / (30 * mapScale)) * 1000,
              ease: "Linear",
              onComplete: () => {
                resetScoutIdle();
                this.time.delayedCall(
                  1000 + Math.random() * 2000,
                  roamScout,
                );
              },
            });
          };
          this.time.delayedCall(1100, roamScout);

          const wrenBody = this.add
            .sprite(0, 0, "char_all_sheet", 36)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const wrenHair = this.add
            .sprite(0, 0, "spacebuns_sheet", 81)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const wrenClothes = this.add
            .sprite(0, 0, "dress_sheet", 45)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const wrenEyes = this.add
            .sprite(0, 0, "eyes_sheet", 48)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const wrenBlush = this.add
            .sprite(0, 0, "blush_sheet", 8)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const wrenLipstick = this.add
            .sprite(0, 0, "lipstick_sheet", 24)
            .setOrigin(0.5, 0.5)
            .setScale(scale);

          const wrenContainer = this.add.container(wrenWX, wrenWY, [
            wrenBody,
            wrenClothes,
            wrenEyes,
            wrenBlush,
            wrenLipstick,
            wrenHair,
          ]);
          wrenContainer.setDepth(20);

          const syncWrenHairToBodyWalk = (
            anim: { key: string },
            frame: { index: number },
          ) => {
            if (!anim.key.startsWith("wren-walk")) return;
            const hairKey = anim.key.replace("wren-walk", "wren-hair");
            const hairAnim = this.anims.get(hairKey);
            if (!hairAnim || frame.index >= hairAnim.frames.length) return;
            wrenHair.anims.stop();
            wrenHair.setFrame(hairAnim.frames[frame.index].frame);
          };
          wrenBody.on("animationstart", syncWrenHairToBodyWalk);
          wrenBody.on("animationupdate", syncWrenHairToBodyWalk);

          const playWrenAnim = (dir: "down" | "left" | "right" | "up") => {
            wrenBody.play(`wren-walk-${dir}`);
            wrenClothes.play(`wren-clothes-${dir}`);
            wrenEyes.play(`wren-eyes-${dir}`);
            wrenBlush.play(`wren-blush-${dir}`);
            wrenLipstick.play(`wren-lipstick-${dir}`);
          };

          const resetWrenIdle = () => {
            wrenBody.anims.stop();
            wrenHair.anims.stop();
            wrenClothes.anims.stop();
            wrenEyes.anims.stop();
            wrenBlush.anims.stop();
            wrenLipstick.anims.stop();
            wrenBody.setFrame(36);
            wrenHair.setFrame(81);
            wrenClothes.setFrame(45);
            wrenEyes.setFrame(48);
            wrenBlush.setFrame(8);
            wrenLipstick.setFrame(24);
          };

          playWrenAnim("down");

          const roamWren = () => {
            const angle = Math.random() * Math.PI * 2;
            const dist = 15 * mapScale + Math.random() * (30 * mapScale);
            const targetX = Phaser.Math.Clamp(
              wrenWX + Math.cos(angle) * dist,
              offsetX + 20,
              offsetX + map.widthInPixels * mapScale - 20,
            );
            const targetY = Phaser.Math.Clamp(
              wrenWY + Math.sin(angle) * dist,
              offsetY + 20,
              offsetY + map.heightInPixels * mapScale - 20,
            );
            const dx = targetX - wrenContainer.x;
            const dy = targetY - wrenContainer.y;
            if (Math.abs(dx) > Math.abs(dy)) {
              playWrenAnim(dx > 0 ? "right" : "left");
            } else {
              playWrenAnim(dy > 0 ? "down" : "up");
            }
            const distance = Math.sqrt(dx * dx + dy * dy);
            this.tweens.add({
              targets: wrenContainer,
              x: targetX,
              y: targetY,
              duration: (distance / (30 * mapScale)) * 1000,
              ease: "Linear",
              onComplete: () => {
                resetWrenIdle();
                this.time.delayedCall(
                  1000 + Math.random() * 2000,
                  roamWren,
                );
              },
            });
          };
          this.time.delayedCall(1400, roamWren);

          const sw = map.widthInPixels * mapScale;
          const sh = map.heightInPixels * mapScale;
          const cam = this.cameras.main;
          /** World size: map sits at (offsetX, offsetY) … (offsetX+sw, offsetY+sh). */
          const worldW = offsetX + sw;
          const worldH = offsetY + sh;

          cam.setBounds(0, 0, worldW, worldH);
          cam.setScroll(0, 0);

          const scrollMaxX = Math.max(0, worldW - cam.width);
          const scrollMaxY = Math.max(0, worldH - cam.height);
          const panStart = this.time.now;

          this.time.addEvent({
            delay: 40,
            loop: true,
            callback: () => {
              const t = (this.time.now - panStart) / 1000;
              const sx =
                scrollMaxX > 1
                  ? ((Math.sin(t * 0.045) + 1) / 2) * scrollMaxX
                  : Math.sin(t * 0.12) * 6;
              const sy =
                scrollMaxY > 1
                  ? ((Math.cos(t * 0.038) + 1) / 2) * scrollMaxY
                  : Math.cos(t * 0.095) * 5;
              cam.setScroll(
                Phaser.Math.Clamp(sx, 0, scrollMaxX),
                Phaser.Math.Clamp(sy, 0, scrollMaxY),
              );
            },
          });

          const w = WORLD_W;
          const h = WORLD_H;

          this.input.keyboard?.disableGlobalCapture();

          const labelTextStyle = {
            fontSize: "8px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 2,
            resolution: 2,
          } as const;

          for (const { slug, label, nx, ny, nw, nh } of HOUSE_LABEL_ANCHORS) {
            this.add
              .text(w * nx, h * ny, label, labelTextStyle)
              .setOrigin(0.5, 1)
              .setDepth(30);
            addInvisibleHitZone(this, w * nx, h * ny, w * nw, h * nh, slug);
          }

          for (const z of WORLD_HOTSPOTS) {
            const cx = w * (z.nx + z.nw / 2);
            const cy = h * (z.ny + z.nh / 2);
            const rw = w * z.nw;
            const rh = h * z.nh;
            addInvisibleHitZone(this, cx, cy, rw, rh, z.slug);
          }

          this.input.setDefaultCursor("default");
        }
      }

      game = new Phaser.Game({
        type: Phaser.AUTO,
        transparent: false,
        backgroundColor: "#7cac58",
        physics: {
          default: "arcade",
          arcade: { debug: false },
        },
        input: {
          debug: false,
        } as Phaser.Types.Core.InputConfig,
        render: {
          pixelArt: true,
          antialias: false,
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: WORLD_W,
          height: WORLD_H,
          parent: "phaser-container",
        },
        callbacks: {
          postBoot: (bootedGame) => {
            bootedGame.scene.scenes.forEach((scene) => {
              if (scene.input) {
                scene.input.setGlobalTopOnly(true);
              }
            });
          },
        },
        scene: [VillageScene],
        audio: { noAudio: true },
      });
      gameRef.current = game;
      game.input.enabled = !chatOverlayOpenRef.current;
    });

    return () => {
      document.body.style.cursor = "default";
      cancelled = true;
      gameRef.current = null;
      game?.destroy(true);
      game = null;
    };
  }, []);

  return (
    <div
      id="phaser-container"
      ref={containerRef}
      className="pointer-events-auto [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:max-w-none"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#7cac58",
      }}
    />
  );
}
