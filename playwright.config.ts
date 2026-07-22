import { defineConfig } from "@playwright/test";

const localPort = process.env.E2E_PORT ?? "4173";
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${localPort}`;
const startsLocalServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  globalSetup: startsLocalServer ? "./tests/e2e/global-setup.ts" : undefined,
  use: {
    baseURL,
    extraHTTPHeaders: {
      "x-lakehouse-test-session": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    colorScheme: "light",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: startsLocalServer
    ? {
        command: `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${localPort}`,
        url: `${baseURL}/`,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          TURSO_DATABASE_URL: "file:.data/e2e.db",
        },
      }
    : undefined,
  projects: [
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "tablet-1024", use: { viewport: { width: 1024, height: 900 } } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 } } },
  ],
});
