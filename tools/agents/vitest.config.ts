import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // Tests must never reach the real Anthropic or Jira APIs.
    env: { ANTHROPIC_API_KEY: "", JIRA_API_TOKEN: "" },
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/cli.ts"],
      reporter: ["text", "lcov"],
    },
  },
});
