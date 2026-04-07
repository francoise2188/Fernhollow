import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const cozy = "/assets/fernhollow/cozy-people";
    return [
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
