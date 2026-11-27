import { defineConfig, devices } from "@playwright/test";

// APP-0: browser tests that run signed in. They use their own build with accounts switched on (npm run build:app),
// pointed at a local stand-in for Supabase (e2e-app/mock-supabase.mjs), and a fake session cookie placed in the
// browser (e2e-app/signed-in.ts). No real account or Supabase project is involved. Run: npm run build:app && npm run test:e2e:app
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e-app",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: "http://localhost:3200", trace: "on-first-retry" },
  projects: [
    { name: "app-360", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 740 }, launchOptions: { executablePath } } },
    { name: "app-1280", use: { viewport: { width: 1280, height: 800 }, launchOptions: { executablePath } } },
  ],
  webServer: [
    { command: "npm run mock:supabase", url: "http://localhost:54321/health", reuseExistingServer: !process.env.CI, timeout: 30_000 },
    { command: "npm run start:app", url: "http://localhost:3200", reuseExistingServer: !process.env.CI, timeout: 120_000 },
  ],
});
