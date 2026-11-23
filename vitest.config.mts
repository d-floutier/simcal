import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Aucun appel réseau : la source Open Food Facts par défaut est la fausse source.
    env: { SIMCAL_OPEN_FOOD_FACTS: "faux" },
  },
});
