import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** CJS SDK expects Node `__dirname`; bundling it for serverless can throw. */
  serverExternalPackages: ["@anthropic-ai/sdk"],
  async rewrites() {
    const cozy = "/assets/fernhollow/cozy-people";
    return [
      // Legacy .mp3 URLs (old bundles) → real files (was middleware rewrites).
      {
        source: "/assets/fernhollow/audio/forest-ambience.mp3",
        destination: "/assets/fernhollow/audio/forest-ambience.wav",
      },
      {
        source: "/assets/fernhollow/audio/birdsong.mp3",
        destination: "/assets/fernhollow/audio/birdsong.wav",
      },
      {
        source: "/assets/fernhollow/audio/river.mp3",
        destination: "/assets/fernhollow/audio/river.wav",
      },
      {
        source: "/assets/fernhollow/audio/fireplace.mp3",
        destination: "/assets/fernhollow/audio/fireplace.m4a",
      },
      {
        source: `${cozy}/clothes/Dress.png`,
        destination: `${cozy}/clothes/dress.png`,
      },
      {
        source: `${cozy}/hair/Ponytail.png`,
        destination: `${cozy}/hair/ponytail.png`,
      },
      {
        source: `${cozy}/eyes/lipstick.png`,
        destination: `${cozy}/eyes/lipstick%20.png`,
      },
    ];
  },
};

export default nextConfig;
