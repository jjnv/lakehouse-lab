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
      "oai-authenticated-user-email": "qa.employee@example.com",
      "oai-authenticated-user-full-name": encodeURIComponent("Empleado de prueba"),
      "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    },
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    colorScheme: "light",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: startsLocalServer
    ? {
        command: `vite --host 127.0.0.1 --port ${localPort} --strictPort`,
        url: `${baseURL}/api/me/dashboard`,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          SITES_DEV_USER_EMAIL: "qa.employee@example.com",
          SITES_DEV_USER_NAME: "Empleado de prueba",
          SITES_PERSIST_STATE_PATH: ".wrangler/e2e",
        },
      }
    : undefined,
  projects: [
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "tablet-1024", use: { viewport: { width: 1024, height: 900 } } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 } } },
  ],
});
