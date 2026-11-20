// @ts-check
import { defineConfig } from "eslint/config";

import { node } from "./node.js";

export default defineConfig(
  // Fixtures intentionally violate rules; they are linted by the tests instead.
  { ignores: ["test/fixtures/**"] },
  node,
);
