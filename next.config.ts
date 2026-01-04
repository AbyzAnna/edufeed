import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for ffmpeg.wasm to work (SharedArrayBuffer support)
  // Using "credentialless" for COEP allows YouTube embeds while maintaining SharedArrayBuffer
  async headers() {
    return [
      {
        // Apply strict COEP only to pages that need ffmpeg (not library with YouTube embeds)
        source: "/((?!library).*)",
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
      {
        // Library page needs relaxed policy for YouTube embeds
        source: "/library",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
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
