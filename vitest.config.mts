import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://nguyenkiem@localhost:5432/ctsport_test",
      AUTH_SECRET: "test-secret-0123456789abcdef0123456789",
    },
    hookTimeout: 60000,
  },
});
