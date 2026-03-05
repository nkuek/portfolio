import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.nkuek.dev",
        pathname: "/video/**",
      },
    ],
  },
};

export default nextConfig;
