import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Nibras does not serve user-uploaded images in the MVP. Disable runtime image
  // optimization until Sharp has a patched upstream release.
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true
};
export default nextConfig;
