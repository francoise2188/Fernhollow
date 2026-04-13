"use client";

import { useEffect, useRef } from "react";
import type { Scene } from "phaser";
import { FERNHOLLOW_OPEN_CHAT_EVENT, fernhollowAssetPath } from "@/lib/assets";
import {
  COZY_RIVER_HIT,
  WORLD_H,
  WORLD_W,
  createCozyEnvironment,
  preloadCozyHollow,
} from "@/lib/phaser-cozy-village";
import { registerTiledTileAnimations } from "@/lib/fernhollow-tiled-tile-animations";
import {
  CHARACTER_TILE_LAYERS,
  createVillagerAnimationSet,
  sampleVillagerFromMap,
} from "@/lib/fernhollow-villager-appearance";

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

/**
 * Top-left tile of each villager’s 2×2 body in `fernhollow-map2.tmj` (16×16 cells).
 * The map bakes static dolls here; we remove those tiles and draw animated sprites at the block center.
 */
const VILLAGER_BLOCKS = {
  clover: { tx: 19, ty: 16 },
  rosie: { tx: 13, ty: 36 },
  scout: { tx: 51, ty: 22 },
  wren: { tx: 46, ty: 30 },
} as const;

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

    const refreshScale = () => {
      gameRef.current?.scale.refresh();
    };
    window.addEventListener("resize", refreshScale);
    window.visualViewport?.addEventListener("resize", refreshScale);
    window.addEventListener("orientationchange", refreshScale);

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
            "braids_sheet",
            fernhollowAssetPath("cozy-people", "hair", "braids.png"),
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

          const villagerSamples = {
            clover: sampleVillagerFromMap(
              map,
              VILLAGER_BLOCKS.clover.tx,
              VILLAGER_BLOCKS.clover.ty,
            ),
            rosie: sampleVillagerFromMap(
              map,
              VILLAGER_BLOCKS.rosie.tx,
              VILLAGER_BLOCKS.rosie.ty,
            ),
            scout: sampleVillagerFromMap(
              map,
              VILLAGER_BLOCKS.scout.tx,
              VILLAGER_BLOCKS.scout.ty,
            ),
            wren: sampleVillagerFromMap(
              map,
              VILLAGER_BLOCKS.wren.tx,
              VILLAGER_BLOCKS.wren.ty,
            ),
          };

          const clearStaticVillagerFootprint = (topTx: number, topTy: number) => {
            for (const layerName of CHARACTER_TILE_LAYERS) {
              for (let dy = 0; dy <= 1; dy++) {
                for (let dx = 0; dx <= 1; dx++) {
                  map.removeTileAt(
                    topTx + dx,
                    topTy + dy,
                    true,
                    true,
                    layerName,
                  );
                }
              }
            }
          };

          for (const key of Object.keys(VILLAGER_BLOCKS) as Array<
            keyof typeof VILLAGER_BLOCKS
          >) {
            const { tx, ty } = VILLAGER_BLOCKS[key];
            clearStaticVillagerFootprint(tx, ty);
          }

          registerTiledTileAnimations(this, map);

          /** World center of a 2×2 block whose top-left tile is `(topTx, topTy)`. */
          const blockCenterWorld = (topTx: number, topTy: number) => ({
            wx: ((topTx + 1) * tileSize) * mapScale + offsetX,
            wy: ((topTy + 1) * tileSize) * mapScale + offsetY,
          });

          const { wx: cloverWX, wy: cloverWY } = blockCenterWorld(
            VILLAGER_BLOCKS.clover.tx,
            VILLAGER_BLOCKS.clover.ty,
          );
          const { wx: rosieWX, wy: rosieWY } = blockCenterWorld(
            VILLAGER_BLOCKS.rosie.tx,
            VILLAGER_BLOCKS.rosie.ty,
          );
          const { wx: scoutWX, wy: scoutWY } = blockCenterWorld(
            VILLAGER_BLOCKS.scout.tx,
            VILLAGER_BLOCKS.scout.ty,
          );
          const { wx: wrenWX, wy: wrenWY } = blockCenterWorld(
            VILLAGER_BLOCKS.wren.tx,
            VILLAGER_BLOCKS.wren.ty,
          );

          const cloverP = createVillagerAnimationSet(
            this,
            "clover",
            villagerSamples.clover,
          );
          const rosieP = createVillagerAnimationSet(
            this,
            "rosie",
            villagerSamples.rosie,
          );
          const scoutP = createVillagerAnimationSet(
            this,
            "scout",
            villagerSamples.scout,
          );
          const wrenP = createVillagerAnimationSet(
            this,
            "wren",
            villagerSamples.wren,
          );

          const scale = mapScale * 2;
          const body = this.add
            .sprite(0, 0, cloverP.body.key, cloverP.body.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const hair = this.add
            .sprite(0, 0, cloverP.hair.key, cloverP.hair.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const clothes = this.add
            .sprite(0, 0, cloverP.dress.key, cloverP.dress.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const shoes = this.add
            .sprite(0, 0, cloverP.shoes.key, cloverP.shoes.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const eyes = this.add
            .sprite(0, 0, cloverP.eyes.key, cloverP.eyes.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const blush = this.add
            .sprite(0, 0, "blush_sheet", 0)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const lipstick = this.add
            .sprite(0, 0, cloverP.lips.key, cloverP.lips.frame)
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
          cloverContainer.setDepth(24);

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
            body.setFrame(cloverP.body.frame);
            hair.setFrame(cloverP.hair.frame);
            clothes.setFrame(cloverP.dress.frame);
            shoes.setFrame(cloverP.shoes.frame);
            eyes.setFrame(cloverP.eyes.frame);
            blush.setFrame(0);
            lipstick.setFrame(cloverP.lips.frame);
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
            .sprite(0, 0, rosieP.body.key, rosieP.body.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieHair = this.add
            .sprite(0, 0, rosieP.hair.key, rosieP.hair.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieClothes = this.add
            .sprite(0, 0, rosieP.dress.key, rosieP.dress.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieBottom = this.add
            .sprite(0, 0, "pants_sheet", 56)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieShoes = this.add
            .sprite(0, 0, rosieP.shoes.key, rosieP.shoes.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieEyes = this.add
            .sprite(0, 0, rosieP.eyes.key, rosieP.eyes.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieBlush = this.add
            .sprite(0, 0, "blush_sheet", 8)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const rosieLipstick = this.add
            .sprite(0, 0, rosieP.lips.key, rosieP.lips.frame)
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
          rosieContainer.setDepth(24);

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
            rosieBody.setFrame(rosieP.body.frame);
            rosieHair.setFrame(rosieP.hair.frame);
            rosieClothes.setFrame(rosieP.dress.frame);
            rosieBottom.setFrame(56);
            rosieShoes.setFrame(rosieP.shoes.frame);
            rosieEyes.setFrame(rosieP.eyes.frame);
            rosieBlush.setFrame(8);
            rosieLipstick.setFrame(rosieP.lips.frame);
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
            .sprite(0, 0, scoutP.body.key, scoutP.body.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutHair = this.add
            .sprite(0, 0, scoutP.hair.key, scoutP.hair.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutClothes = this.add
            .sprite(0, 0, scoutP.dress.key, scoutP.dress.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutBottom = this.add
            .sprite(0, 0, "pants_sheet", 56)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutShoes = this.add
            .sprite(0, 0, scoutP.shoes.key, scoutP.shoes.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutEyes = this.add
            .sprite(0, 0, scoutP.eyes.key, scoutP.eyes.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutBlush = this.add
            .sprite(0, 0, "blush_sheet", 16)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const scoutLipstick = this.add
            .sprite(0, 0, scoutP.lips.key, scoutP.lips.frame)
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
          scoutContainer.setDepth(24);

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
            scoutBody.setFrame(scoutP.body.frame);
            scoutHair.setFrame(scoutP.hair.frame);
            scoutClothes.setFrame(scoutP.dress.frame);
            scoutBottom.setFrame(56);
            scoutShoes.setFrame(scoutP.shoes.frame);
            scoutEyes.setFrame(scoutP.eyes.frame);
            scoutBlush.setFrame(16);
            scoutLipstick.setFrame(scoutP.lips.frame);
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
            .sprite(0, 0, wrenP.body.key, wrenP.body.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const wrenHair = this.add
            .sprite(0, 0, wrenP.hair.key, wrenP.hair.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const wrenClothes = this.add
            .sprite(0, 0, wrenP.dress.key, wrenP.dress.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const wrenEyes = this.add
            .sprite(0, 0, wrenP.eyes.key, wrenP.eyes.frame)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const wrenBlush = this.add
            .sprite(0, 0, "blush_sheet", 8)
            .setOrigin(0.5, 0.5)
            .setScale(scale);
          const wrenLipstick = this.add
            .sprite(0, 0, wrenP.lips.key, wrenP.lips.frame)
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
          wrenContainer.setDepth(24);

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
            wrenBody.setFrame(wrenP.body.frame);
            wrenHair.setFrame(wrenP.hair.frame);
            wrenClothes.setFrame(wrenP.dress.frame);
            wrenEyes.setFrame(wrenP.eyes.frame);
            wrenBlush.setFrame(8);
            wrenLipstick.setFrame(wrenP.lips.frame);
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

          // ── Speech bubbles (latest chime above sender) ─────────────────────
          const BUBBLE_COLORS: Record<string, number> = {
            clover: 0x56823c,
            rosie: 0xc4687a,
            scout: 0x7a6a3a,
            wren: 0x4a7a8a,
          };

          const girlContainers: Record<string, Phaser.GameObjects.Container> = {
            clover: cloverContainer,
            rosie: rosieContainer,
            scout: scoutContainer,
            wren: wrenContainer,
          };

          let lastChimeId: string | null = null;

          /** Light cream-green panel; per-girl color is border accent only. */
          const BUBBLE_FILL = 0xe8f2e0;

          const showSpeechBubble = (
            container: Phaser.GameObjects.Container,
            fullMessage: string,
            accentColor: number,
          ) => {
            const maxWidthCompact = 128;
            const maxWidthExpanded = 224;
            const padding = 6;
            const spriteHalfH = (32 * mapScale * 2) / 2;

            const previewText =
              fullMessage.length > 48
                ? `${fullMessage.slice(0, 45)}...`
                : fullMessage;

            const label = this.add.text(0, 0, previewText, {
              fontSize: "11px",
              fontFamily: "Nunito, sans-serif",
              fontStyle: "bold",
              color: "#1a1816",
              wordWrap: { width: maxWidthCompact - padding * 2 },
              align: "left",
              resolution: 3,
              stroke: "#f5faf4",
              strokeThickness: 2,
            });

            const bg = this.add.graphics();

            const drawBubble = (bw: number, bh: number) => {
              bg.clear();
              bg.fillStyle(0x2d3d28, 0.12);
              bg.fillRoundedRect(1, 1, bw, bh, 6);
              bg.fillStyle(BUBBLE_FILL, 0.96);
              bg.fillRoundedRect(0, 0, bw, bh, 6);
              bg.lineStyle(1, accentColor, 0.85);
              bg.strokeRoundedRect(0, 0, bw, bh, 6);
              bg.fillStyle(BUBBLE_FILL, 0.96);
              bg.fillTriangle(
                bw / 2 - 4,
                bh,
                bw / 2 + 4,
                bh,
                bw / 2,
                bh + 5,
              );
            };

            let bw = Math.min(label.width + padding * 2, maxWidthCompact);
            let bh = label.height + padding * 2;
            drawBubble(bw, bh);
            label.setPosition(padding, padding);

            const bubbleContainer = this.add.container(0, 0, [bg, label]);
            let expanded = false;

            /** Keep bubble + tail inside the tiled map (not over the green border). */
            const mapPad = 6;
            const tailBelow = 8;
            const mapLeft = offsetX + mapPad;
            const mapRight =
              offsetX + map.widthInPixels * mapScale - mapPad;
            const mapTop = offsetY + mapPad;
            const mapBottom =
              offsetY + map.heightInPixels * mapScale - mapPad;

            const positionBubble = (w: number, h: number) => {
              let x = container.x - w / 2;
              let y = container.y - spriteHalfH - h - 12;
              const minX = mapLeft;
              const maxX = mapRight - w;
              const minY = mapTop;
              const maxY = mapBottom - h - tailBelow;
              if (maxX >= minX) {
                x = Phaser.Math.Clamp(x, minX, maxX);
              } else {
                x = minX;
              }
              if (maxY >= minY) {
                y = Phaser.Math.Clamp(y, minY, maxY);
              } else {
                y = minY;
              }
              bubbleContainer.setPosition(x, y);
            };
            positionBubble(bw, bh);

            bubbleContainer.setDepth(100);

            const tailPad = 8;
            const setHitArea = (w: number, h: number) => {
              const hit = bubbleContainer.input?.hitArea as
                | Phaser.Geom.Rectangle
                | undefined;
              if (hit) {
                hit.setSize(w, h + tailPad);
              } else {
                bubbleContainer.setInteractive(
                  new Phaser.Geom.Rectangle(0, 0, w, h + tailPad),
                  Phaser.Geom.Rectangle.Contains,
                );
                bubbleContainer.input!.cursor = "pointer";
              }
            };
            setHitArea(bw, bh);

            let fadeTimer: Phaser.Time.TimerEvent | null = null;
            const clearFade = () => {
              if (fadeTimer) {
                fadeTimer.remove(false);
                fadeTimer = null;
              }
            };
            const scheduleFade = (ms: number) => {
              clearFade();
              fadeTimer = this.time.delayedCall(ms, () => {
                this.tweens.add({
                  targets: bubbleContainer,
                  alpha: 0,
                  duration: 500,
                  ease: "Power2",
                  onComplete: () => {
                    clearFade();
                    bubbleContainer.destroy();
                  },
                });
              });
            };

            bubbleContainer.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
              pointer.event?.stopPropagation?.();
              pointer.event?.preventDefault?.();
              if (expanded) return;
              expanded = true;
              label.setText(fullMessage);
              label.setWordWrapWidth(maxWidthExpanded - padding * 2, true);
              label.setFontSize("10px");
              bw = Math.min(label.width + padding * 2, maxWidthExpanded);
              bh = label.height + padding * 2;
              drawBubble(bw, bh);
              label.setPosition(padding, padding);
              positionBubble(bw, bh);
              setHitArea(bw, bh);
              scheduleFade(10000);
            });

            bubbleContainer.setAlpha(0);
            this.tweens.add({
              targets: bubbleContainer,
              alpha: 1,
              duration: 250,
              ease: "Power2",
            });

            scheduleFade(4000);
          };

          const pollLatestChime = () => {
            fetch("/api/chimes?limit=1", { credentials: "include" })
              .then((r) => r.json())
              .then(
                (d: {
                  chimes?: Array<{
                    id: string;
                    from_agent: string;
                    message: string;
                  }>;
                }) => {
                  const latest = d.chimes?.[0];
                  if (!latest || latest.id === lastChimeId) return;
                  lastChimeId = latest.id;

                  const container = girlContainers[latest.from_agent];
                  if (!container) return;

                  const color =
                    BUBBLE_COLORS[latest.from_agent] ?? 0x56823c;
                  showSpeechBubble(container, latest.message, color);
                },
              )
              .catch(() => {});
          };

          this.time.addEvent({
            delay: 12000,
            loop: true,
            callback: pollLatestChime,
          });

          this.time.delayedCall(3000, pollLatestChime);

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
      window.removeEventListener("resize", refreshScale);
      window.visualViewport?.removeEventListener("resize", refreshScale);
      window.removeEventListener("orientationchange", refreshScale);
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
        width: "100%",
        height: "100%",
        minHeight: "100dvh",
        backgroundColor: "#7cac58",
      }}
    />
  );
}
