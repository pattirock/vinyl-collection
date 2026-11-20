// @ts-check
import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import { next } from "../next.js";
import { node } from "../node.js";

const fixturesDir = fileURLToPath(new URL("./fixtures/", import.meta.url));

/**
 * Lint one fixture file with the given config and return the rule ids reported.
 * @param {import("eslint").Linter.Config[]} config
 * @param {string} fixture
 */
async function ruleIds(config, fixture) {
  const eslint = new ESLint({
    cwd: fixturesDir,
    overrideConfigFile: true,
    overrideConfig: [
      ...config,
      { languageOptions: { parserOptions: { tsconfigRootDir: fixturesDir } } },
    ],
  });
  const [result] = await eslint.lintFiles([fixture]);
  if (!result) throw new Error(`No lint result for ${fixture}`);
  const fatal = result.messages.filter((m) => m.fatal);
  if (fatal.length > 0)
    throw new Error(`Parsing failed: ${fatal.map((m) => m.message).join("; ")}`);
  return result.messages.map((m) => m.ruleId);
}

describe("node config", () => {
  it("reports nothing on clean code", async () => {
    expect(await ruleIds(node, "clean.ts")).toEqual([]);
  });

  it("flags unsafe TypeScript, security issues, console and floating promises", async () => {
    const ids = await ruleIds(node, "unsafe.ts");
    expect(ids).toEqual(
      expect.arrayContaining([
        "@typescript-eslint/no-explicit-any",
        "@typescript-eslint/no-non-null-assertion",
        "security/detect-non-literal-regexp",
        "no-console",
        "@typescript-eslint/no-floating-promises",
      ]),
    );
  });
});

describe("next config", () => {
  it("flags missing alt text, raw <img> and dangerouslySetInnerHTML", async () => {
    const ids = await ruleIds(next, "Cover.tsx");
    expect(ids).toEqual(
      expect.arrayContaining(["jsx-a11y/alt-text", "@next/next/no-img-element", "react/no-danger"]),
    );
  });
});

describe("@vinyl/tsconfig base", () => {
  /** @param {string} code */
  function diagnostics(code) {
    const configPath = fileURLToPath(new URL("../../tsconfig/base.json", import.meta.url));
    const { config } = ts.readConfigFile(configPath, (p) => ts.sys.readFile(p));
    const { options } = ts.parseJsonConfigFileContent(config, ts.sys, fixturesDir);
    const fileName = "snippet.ts";
    const host = ts.createCompilerHost({ ...options, noEmit: true, types: [] });
    const originalGetSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, languageVersion, ...rest) =>
      name === fileName
        ? ts.createSourceFile(name, code, languageVersion)
        : originalGetSourceFile(name, languageVersion, ...rest);
    const program = ts.createProgram([fileName], { ...options, noEmit: true, types: [] }, host);
    return ts.getPreEmitDiagnostics(program).map((d) => d.code);
  }

  it("enables strict mode and noUncheckedIndexedAccess", () => {
    // TS2532: object is possibly undefined (index access) · TS7006: implicit any (strict)
    expect(diagnostics("const a: number[] = []; export const n = a[0].toFixed();")).toContain(2532);
    expect(diagnostics("export function f(x) { return x; }")).toContain(7006);
  });

  it("accepts code that handles undefined explicitly", () => {
    expect(diagnostics("const a: number[] = []; export const n = a[0]?.toFixed() ?? '0';")).toEqual(
      [],
    );
  });
});
