import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static-rs.rentsyst.com',
      },
    ],
  },
};

export default nextConfig;
