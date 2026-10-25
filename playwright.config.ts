import { defineConfig, devices } from "@playwright/test";

// QA-3 asks for three engines (Chrome, Safari, Firefox) on phone-sized screens.
// Slice S0 runs Chromium only; S8 adds WebKit and Firefox projects.
// PW_CHROMIUM_PATH lets a machine with a pre-installed browser skip the download.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium-360",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 360, height: 740 },
        launchOptions: { executablePath },
      },
    },
  ],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
