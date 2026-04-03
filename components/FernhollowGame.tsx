"use client";

import { useEffect, useRef } from "react";
import type { GameObjects, Scene } from "phaser";
import {
  CHARACTERS,
  COZY_PEOPLE_IMAGE_RETRY_CHAINS,
  COZY_PEOPLE_V2,
  FERNHOLLOW_OPEN_CHAT_EVENT,
  PHASER,
} from "@/lib/assets";
import {
  COZY_RIVER_HIT,
  WORLD_H,
  WORLD_SCALE,
  WORLD_W,
  createCozyEnvironment,
  preloadCozyHollow,
  worldCenterOfCell,
} from "@/lib/phaser-cozy-village";

const HOUSE_ZONES = [
  { slug: "clovers-house", nx: 13 / 30, ny: 0, nw: 4 / 30, nh: 3 / 20 },
  { slug: "rosies-cottage", nx: 0, ny: 0, nw: 5 / 30, nh: 3 / 20 },
  { slug: "scouts-workshop", nx: 25 / 30, ny: 0, nw: 5 / 30, nh: 3 / 20 },
  { slug: "wrens-house", nx: 24 / 30, ny: 16 / 20, nw: 6 / 30, nh: 4 / 20 },
] as const;

const HOUSE_LABELS = [
  { slug: "clovers-house", label: "🍀 Clover" },
  { slug: "rosies-cottage", label: "🌸 Rosie" },
  { slug: "scouts-workshop", label: "⚙️ Scout" },
  { slug: "wrens-house", label: "✨ Wren" },
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

type PaperDollLayerDef = {
  key: string;
  fileWidth: number;
  colorCount: number;
};

const { sheetFileWidth: SW, sheetColorColumns: SC } = COZY_PEOPLE_V2;

const CLOVER_PAPER_DOLL_LAYERS: PaperDollLayerDef[] = [
  { key: "clover-base", fileWidth: SW.base, colorCount: SC.base },
  { key: "clover-clothes", fileWidth: SW.clothes, colorCount: SC.clothes },
  { key: "clover-hair", fileWidth: SW.hair, colorCount: SC.hair },
  { key: "clover-acc", fileWidth: SW.accNarrow, colorCount: SC.accSingle },
];

const SCOUT_PAPER_DOLL_LAYERS: PaperDollLayerDef[] = [
  { key: "scout-base", fileWidth: SW.base, colorCount: SC.base },
  { key: "scout-clothes", fileWidth: SW.clothes, colorCount: SC.clothes },
  { key: "scout-hair", fileWidth: SW.hair, colorCount: SC.hair },
];

const WREN_PAPER_DOLL_LAYERS: PaperDollLayerDef[] = [
  { key: "wren-base", fileWidth: SW.base, colorCount: SC.base },
  { key: "wren-skirt", fileWidth: SW.clothes, colorCount: SC.clothes },
  { key: "wren-spaghetti", fileWidth: SW.clothes, colorCount: SC.clothes },
  { key: "wren-hair", fileWidth: SW.hair, colorCount: SC.hair },
  { key: "wren-acc", fileWidth: SW.accWide, colorCount: SC.accWide },
];

function emitOpenChat(slug: string) {
  window.dispatchEvent(
    new CustomEvent(FERNHOLLOW_OPEN_CHAT_EVENT, { detail: { slug } }),
  );
}

/** First walk cell: crop top-left `fileWidth/colorCount` × walk height (see `COZY_PEOPLE_V2.sheet*` + list.txt columns). */
function applyPaperDollWalkCrop(
  spr: GameObjects.Sprite,
  fileWidth: number,
  colorCount: number,
): void {
  const cropH = COZY_PEOPLE_V2.walkFrame.frameHeight;
  const cropW = Math.floor(fileWidth / colorCount);
  spr.setCrop();
  spr.setCrop(0, 0, cropW, cropH);
}

/** Bottom → top. Layers use `load.image` + crop (wide variant sheets are not reliable as uniform Phaser spritesheets). */
function createPaperDollContainer(
  scene: Scene,
  worldX: number,
  worldY: number,
  layerDefs: PaperDollLayerDef[],
): GameObjects.Container {
  const layers: GameObjects.Sprite[] = layerDefs.map(
    ({ key, fileWidth, colorCount }) => {
      const spr = scene.add.sprite(0, 0, key);
      applyPaperDollWalkCrop(spr, fileWidth, colorCount);
      spr.input = null;
      return spr;
    },
  );
  const c = scene.add.container(worldX, worldY, layers);
  c.setDepth(14);
  c.setScale(WORLD_SCALE * 0.5);
  return c;
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

export function FernhollowGame() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    let game: import("phaser").Game | null = null;
    let cancelled = false;

    void import("phaser").then((Phaser) => {
      if (cancelled || !parent) return;

      class VillageScene extends Phaser.Scene {
        /** Index into `COZY_PEOPLE_IMAGE_RETRY_CHAINS[key]` for the next URL to try. */
        assetRetryStep: Record<string, number> = {};

        constructor() {
          super({ key: "village" });
        }

        preload() {
          this.load.on("loaderror", (file: Phaser.Loader.File) => {
            console.error("PHASER LOAD ERROR:", file.key, file.url);
            const chain = COZY_PEOPLE_IMAGE_RETRY_CHAINS[file.key];
            if (!chain) return;
            const step = (this.assetRetryStep[file.key] ?? 0) + 1;
            this.assetRetryStep[file.key] = step;
            if (step < chain.length) {
              this.load.image(file.key, chain[step]);
              this.load.start();
            }
          });
          this.load.on(
            "filecomplete",
            (key: string, type: string, data: unknown) => {
              console.log("PHASER LOADED OK:", key, type);
            },
          );

          preloadCozyHollow(this);
          this.load.spritesheet("rosie", CHARACTERS.rosie, {
            frameWidth: PHASER.rosieSpritesheet.frameWidth,
            frameHeight: PHASER.rosieSpritesheet.frameHeight,
            endFrame: PHASER.rosieSpritesheet.frameCount - 1,
          });
          const v = COZY_PEOPLE_V2;
          const img = (key: string, url: string) => this.load.image(key, url);
          img("clover-base", v.clover.base);
          img("clover-clothes", v.clover.clothes);
          img("clover-hair", v.clover.hair);
          img("clover-acc", v.clover.acc);
          img("scout-base", v.scout.base);
          img("scout-clothes", v.scout.clothes);
          img("scout-hair", v.scout.hair);
          img("wren-base", v.wren.base);
          img("wren-skirt", v.wren.skirt);
          img("wren-spaghetti", v.wren.spaghetti);
          img("wren-hair", v.wren.hair);
          img("wren-acc", v.wren.acc);
          this.load.image("fig", CHARACTERS.figBunny);
          this.load.image("rue", CHARACTERS.rueFox);
        }

        create() {
          createCozyEnvironment(this);

          const w = WORLD_W;
          const h = WORLD_H;

          const scaleToWorld = (spr: { width: number; height: number }) =>
            Math.min((w * 0.12) / spr.width, (h * 0.2) / spr.height);

          const rosieTex = this.textures.get("rosie");
          const rosieFrameTotal = Math.max(
            0,
            rosieTex.frameTotal ??
              Object.keys(rosieTex.frames).filter((k) => k !== "__BASE")
                .length,
          );

          const rosiePos = worldCenterOfCell(2, 1);
          const rosie = this.add.sprite(rosiePos.x, rosiePos.y, "rosie");
          rosie.setScale(scaleToWorld(rosie));
          rosie.setDepth(14);

          if (rosieFrameTotal >= 2) {
            const end = Math.min(
              rosieFrameTotal - 1,
              PHASER.rosieSpritesheet.frameCount - 1,
            );
            if (!this.anims.exists("rosie-idle")) {
              this.anims.create({
                key: "rosie-idle",
                frames: this.anims.generateFrameNumbers("rosie", {
                  start: 0,
                  end,
                }),
                frameRate: 6,
                repeat: -1,
              });
            }
            const idle = this.anims.get("rosie-idle");
            if (idle?.frames?.length) {
              rosie.play("rosie-idle");
            } else {
              rosie.setFrame(0);
              this.tweens.add({
                targets: rosie,
                y: rosie.y - 3,
                duration: 700,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
              });
            }
          } else {
            rosie.setFrame(0);
            this.tweens.add({
              targets: rosie,
              y: rosie.y - 3,
              duration: 700,
              yoyo: true,
              repeat: -1,
              ease: "Sine.easeInOut",
            });
          }

          rosie.input = null;

          const cloverPos = worldCenterOfCell(15, 1);
          const cloverContainer = createPaperDollContainer(
            this,
            cloverPos.x,
            cloverPos.y,
            CLOVER_PAPER_DOLL_LAYERS,
          );

          const scoutPos = worldCenterOfCell(27, 1);
          const scoutContainer = createPaperDollContainer(
            this,
            scoutPos.x,
            scoutPos.y,
            SCOUT_PAPER_DOLL_LAYERS,
          );

          const wrenPos = worldCenterOfCell(27, 17);
          const wrenContainer = createPaperDollContainer(
            this,
            wrenPos.x,
            wrenPos.y,
            WREN_PAPER_DOLL_LAYERS,
          );

          const fig = this.add.sprite(rosiePos.x + 28, rosiePos.y + 10, "fig");
          fig.setScale(scaleToWorld(fig) * 0.85);
          fig.setDepth(13);
          fig.input = null;

          const rue = this.add.sprite(scoutContainer.x - 26, scoutContainer.y + 12, "rue");
          rue.setScale(scaleToWorld(rue) * 0.85);
          rue.setDepth(13);
          rue.input = null;

          this.input.keyboard?.disableGlobalCapture();

          const labelTextStyle = {
            fontSize: "8px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 2,
            resolution: 2,
          } as const;

          for (let i = 0; i < HOUSE_ZONES.length; i++) {
            const zone = HOUSE_ZONES[i];
            const { label, slug } = HOUSE_LABELS[i];
            let cx = w * (zone.nx + zone.nw / 2);
            let cy = h * (zone.ny + zone.nh / 2);
            if (slug === "clovers-house") {
              cx = cloverContainer.x;
              cy = cloverContainer.y - 20;
            } else if (slug === "scouts-workshop") {
              cx = scoutContainer.x;
              cy = scoutContainer.y - 20;
            } else if (slug === "wrens-house") {
              cx = wrenContainer.x;
              cy = wrenContainer.y - 20;
            } else {
              cy -= 20;
            }

            this.add
              .text(cx, cy, label, labelTextStyle)
              .setOrigin(0.5, 1)
              .setDepth(30);
          }

          for (const zone of HOUSE_ZONES) {
            const cx = w * (zone.nx + zone.nw / 2);
            const cy = h * (zone.ny + zone.nh / 2);
            const rw = w * zone.nw;
            const rh = h * zone.nh;
            addInvisibleHitZone(this, cx, cy, rw, rh, zone.slug);
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
          width: 480,
          height: 320,
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
    });

    return () => {
      document.body.style.cursor = "default";
      cancelled = true;
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
