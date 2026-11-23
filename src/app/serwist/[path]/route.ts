import { createSerwistRoute } from "@serwist/turbopack";

const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  // Le WASM du scan (près de 1 Mo) n'est chargé qu'au premier scan, pas mis en cache d'avance.
  globIgnores: ["**/node_modules/**/*", "public/zxing_reader.wasm"],
  swSrc: "src/app/sw.ts",
  useNativeEsbuild: true,
});
