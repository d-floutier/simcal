import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite loads its WASM and data files from node_modules at runtime: don't bundle it.
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
