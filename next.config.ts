import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Headers configuration for CORS and security policies
  // YouTube embeds require specific policies to work properly
  async headers() {
    return [
      {
        // Library page needs relaxed policy for YouTube embeds - MUST be first to take precedence
        source: "/library/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          // No COEP header for library - allows YouTube embeds
        ],
      },
      {
        // Also handle the exact /library route
        source: "/library",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
      {
        // API routes for YouTube need relaxed policies
        source: "/api/youtube/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
        ],
      },
      {
        // Apply strict COEP only to pages that need ffmpeg (not library with YouTube embeds)
        // Using negative lookahead to exclude library routes
        source: "/((?!library|api/youtube).*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
        ],
      },
    ];
  },
  // Allow external resources needed for ffmpeg.wasm and video generation
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
