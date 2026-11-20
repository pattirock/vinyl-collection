import { describe, expect, it } from "vitest";

import { CliUsageError, parseCliArgs } from "./args.js";

describe("parseCliArgs", () => {
  it("parses an issue key", () => {
    expect(parseCliArgs(["VINYL-22"])).toEqual({ issueKey: "VINYL-22", dryRun: false });
  });

  it("parses --dry-run before or after the key", () => {
    expect(parseCliArgs(["VINYL-22", "--dry-run"]).dryRun).toBe(true);
    expect(parseCliArgs(["--dry-run", "VINYL-22"]).dryRun).toBe(true);
  });

  it.each([
    ["no key", []],
    ["two keys", ["VINYL-1", "VINYL-2"]],
    ["another project", ["KAN-1"]],
    ["lower case", ["vinyl-1"]],
    ["zero", ["VINYL-0"]],
    ["shell metacharacters", ["VINYL-1;rm -rf /"]],
    ["an unknown flag", ["VINYL-1", "--force"]],
  ])("rejects %s", (_label, argv) => {
    expect(() => parseCliArgs(argv)).toThrow(CliUsageError);
  });
});
