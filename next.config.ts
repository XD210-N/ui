import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "172.17.0.2", "localhost"],
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: "/api/v1/:path*",
      },
      {
        source: "/langgraph/:path*",
        destination: "/api/langgraph/:path*",
      },
    ];
  },
};

export default nextConfig;
