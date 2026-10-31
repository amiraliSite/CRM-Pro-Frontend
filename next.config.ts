import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" is for self-hosting (Render / VPS). On Netlify the Next.js
  // runtime manages the output itself and must not use standalone.
  // STATIC_EXPORT=1 produces a pure static site in ./out (drag & drop to any
  // static host — no build minutes, no Node runtime needed on the host).
  // GH_PAGES_BASE=/RepoName sets the sub-path for GitHub Pages project sites.
  ...(process.env.STATIC_EXPORT
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        ...(process.env.GH_PAGES_BASE
          ? { basePath: process.env.GH_PAGES_BASE }
          : {}),
      }
    : process.env.NETLIFY
      ? {}
      : { output: "standalone" as const }),
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Disable the dev-tools bubble — it injects DOM nodes into the page and can
  // trigger "insertBefore" NotFoundError crashes in the browser
  devIndicators: false,
};

export default nextConfig;
