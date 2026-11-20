// @ts-check
import { defineConfig } from "eslint/config";
import globals from "globals";

import { base } from "./base.js";

/** Config for Node.js services and tooling (apps/api, tools/*, packages/shared). */
export const node = defineConfig(base, {
  name: "vinyl/node",
  languageOptions: {
    globals: { ...globals.node },
  },
  rules: {
    // Services log through pino, never console.
    "no-console": "error",
  },
});
