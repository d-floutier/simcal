import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

const E2E_ALLOWED_EMAILS = [
  "invite-mobile-chrome@exemple.fr",
  "invite-mobile-safari@exemple.fr",
  "profil-mobile-chrome@exemple.fr",
  "profil-mobile-safari@exemple.fr",
  "pwa-mobile-chrome@exemple.fr",
];

// Runs a production build against a fresh local PGlite folder, migrated with the
// production migrations. Never touches Neon: DATABASE_URL is forced empty.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
  ],
  webServer: {
    command: `rm -rf .pglite-e2e && pnpm build && pnpm db:migrate && pnpm exec next start -p ${PORT}`,
    url: `${baseURL}/connexion`,
    reuseExistingServer: false,
    timeout: 240_000,
    env: {
      DATABASE_URL: "",
      PGLITE_DIR: "./.pglite-e2e",
      BETTER_AUTH_SECRET: "e2e-secret-e2e-secret-e2e-secret-0000",
      BETTER_AUTH_URL: baseURL,
      SIMCAL_ALLOWED_EMAILS: E2E_ALLOWED_EMAILS.join(","),
    },
  },
});
