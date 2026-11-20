// @ts-check
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import security from "eslint-plugin-security";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

/**
 * Base config shared by every workspace: strict, type-aware TypeScript rules,
 * security rules and Prettier compatibility (always last).
 *
 * Consumers must lint from a directory with a tsconfig.json (typed linting
 * uses the TypeScript project service).
 */
export const base = defineConfig(
  {
    name: "vinyl/ignores",
    ignores: ["**/dist/**", "**/.next/**", "**/coverage/**", "**/.turbo/**", "**/node_modules/**"],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  security.configs.recommended,
  {
    name: "vinyl/base",
    languageOptions: {
      parserOptions: { projectService: true },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      eqeqeq: ["error", "always"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  {
    // Plain JS files (configs, scripts) are not part of a typed project.
    name: "vinyl/javascript",
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    name: "vinyl/tests",
    files: ["**/*.test.{ts,tsx,js}", "**/__tests__/**", "**/e2e/**"],
    rules: {
      // Test fixtures routinely build paths and objects dynamically.
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-object-injection": "off",
    },
  },
  prettier,
);
