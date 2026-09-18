import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/setup/chat", destination: "/", permanent: false },
      { source: "/ontology/discover", destination: "/setup/map", permanent: false },
    ];
  },
};

export default nextConfig;
