import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { EXIT_NOT_IMPLEMENTED, EXIT_OK, EXIT_USAGE, run } from "./run.js";

function capture() {
  const out: string[] = [];
  const err: string[] = [];
  return {
    io: { stdout: (l: string) => out.push(l), stderr: (l: string) => err.push(l) },
    out,
    err,
  };
}

const repo = tmpdir();

describe("agents CLI (smoke)", () => {
  it("validates the configuration on --dry-run without credentials", () => {
    const { io, out, err } = capture();
    const code = run(["VINYL-46", "--dry-run"], {}, io, repo);

    expect(code).toBe(EXIT_OK);
    expect(err).toEqual([]);
    const summary = JSON.parse(out[0] ?? "{}") as Record<string, unknown>;
    expect(summary).toMatchObject({
      issue: "VINYL-46",
      model: "claude-opus-5-5",
      dryRun: true,
      jira: "not configured",
    });
  });

  it("does not print secrets on --dry-run", () => {
    const { io, out } = capture();
    run(["VINYL-46", "--dry-run"], { ANTHROPIC_API_KEY: "sk-secret-123" }, io, repo);
    expect(out.join("\n")).not.toContain("sk-secret-123");
  });

  it("exits with a usage error for a bad issue key", () => {
    const { io, err } = capture();
    expect(run(["not-a-key"], {}, io, repo)).toBe(EXIT_USAGE);
    expect(err.join("\n")).toContain("Usage:");
  });

  it("asks for Jira credentials on a real run", () => {
    const { io, err } = capture();
    expect(run(["VINYL-46"], {}, io, repo)).toBe(EXIT_USAGE);
    expect(err.join("\n")).toContain("JIRA_API_TOKEN");
  });

  it("reports that the graph is not implemented yet on a configured real run", () => {
    const { io, err } = capture();
    const env = {
      JIRA_BASE_URL: "https://example.atlassian.net",
      JIRA_EMAIL: "dev@example.com",
      JIRA_API_TOKEN: "token",
    };
    expect(run(["VINYL-46"], env, io, repo)).toBe(EXIT_NOT_IMPLEMENTED);
    expect(err.join("\n")).toContain("VINYL-47");
  });
});
