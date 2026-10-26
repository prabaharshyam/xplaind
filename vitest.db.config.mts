import { defineConfig } from "vitest/config";

// Database tests (SC-2 row-level security). Need a Postgres server: set
// TEST_DATABASE_URL, or run one on localhost:54329. CI starts one.
export default defineConfig({
  test: {
    environment: "node",
    include: ["supabase/tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
