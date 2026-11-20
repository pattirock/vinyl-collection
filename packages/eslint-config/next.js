// @ts-check
import nextPlugin from "@next/eslint-plugin-next";
import { defineConfig } from "eslint/config";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

import { base } from "./base.js";

/**
 * Fail loudly if a plugin stops shipping a preset we rely on (e.g. after an upgrade).
 * @template T
 * @param {T | undefined} preset
 * @param {string} name
 * @returns {T}
 */
function required(preset, name) {
  if (preset === undefined) throw new Error(`ESLint preset not found: ${name}`);
  return preset;
}

/** Config for the Next.js app (apps/web): React, hooks, accessibility and Next rules. */
export const next = defineConfig(base, {
  name: "vinyl/next",
  files: ["**/*.{ts,tsx,js,jsx}"],
  extends: [
    required(react.configs.flat["recommended"], "react/recommended"),
    required(react.configs.flat["jsx-runtime"], "react/jsx-runtime"),
    reactHooks.configs.flat["recommended"],
    jsxA11y.flatConfigs.strict,
    nextPlugin.configs.recommended,
    nextPlugin.configs["core-web-vitals"],
  ],
  languageOptions: {
    globals: { ...globals.browser },
  },
  settings: {
    react: { version: "detect" },
  },
  rules: {
    // TypeScript already checks props.
    "react/prop-types": "off",
    // Never render raw HTML without sanitising it first.
    "react/no-danger": "error",
  },
});
