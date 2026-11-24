import { defineConfig } from "@playwright/test";

const PORT = 5180;

// Interface tests (end to end) of the login flow. The backend is simulated in e2e/support/api.ts,
// with the same responses as docs/API.md of the backend, so the tests run without the server.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  // The dev server compiles each screen on first use; more browsers at once only slow it down.
  workers: 3,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  // npm run test:e2e:coverage: merges the coverage collected in each test (e2e/support/coverage.ts).
  globalTeardown: "./e2e/support/coverage-teardown.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Uses the installed Google Chrome; PW_CHANNEL= (empty) switches to Playwright's own Chromium.
    channel: process.env.PW_CHANNEL ?? "chrome",
    locale: "pt-BR",
    timezoneId: "America/Recife",
    viewport: { width: 1280, height: 720 },
    // The PWA service worker would send API calls around the simulated backend (page.route does not see them).
    serviceWorkers: "block",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "e2e" },
    // Same tests, also measuring which screen code they run (report in coverage-e2e/).
    { name: "coverage" },
    {
      // Slow, captioned run of the full journey, recorded on video for the presentation.
      name: "demo",
      grep: /@demo/,
      use: {
        video: { mode: "on", size: { width: 1280, height: 720 } },
        launchOptions: { slowMo: 350 },
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
