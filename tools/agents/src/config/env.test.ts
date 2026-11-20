import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { EnvError, describeEnv, loadEnv } from "./env.js";

const repo = tmpdir();
const SECRET = "super-secret-token-value";
const jira = {
  JIRA_BASE_URL: "https://example.atlassian.net",
  JIRA_EMAIL: "dev@example.com",
  JIRA_API_TOKEN: SECRET,
};

function errorOf(fn: () => unknown): EnvError {
  try {
    fn();
  } catch (error) {
    if (error instanceof EnvError) return error;
    throw error;
  }
  throw new Error("expected loadEnv to throw");
}

describe("loadEnv", () => {
  it("uses defaults for a dry run without any credentials", () => {
    const env = loadEnv({}, { requireJira: false, defaultRepoPath: repo });
    expect(env).toEqual({
      repoPath: repo,
      effort: "high",
      anthropicCredentials: "sdk-default",
      jira: undefined,
    });
  });

  it("parses Jira settings and credential source for a real run", () => {
    const env = loadEnv(
      { ...jira, ANTHROPIC_API_KEY: "sk-test", AGENTS_EFFORT: "xhigh" },
      { requireJira: true, defaultRepoPath: repo },
    );
    expect(env.anthropicCredentials).toBe("api-key");
    expect(env.effort).toBe("xhigh");
    expect(env.jira).toEqual({
      baseUrl: jira.JIRA_BASE_URL,
      email: jira.JIRA_EMAIL,
      apiToken: SECRET,
    });
  });

  it("treats blank secrets as unset and detects an auth token", () => {
    const env = loadEnv(
      { ANTHROPIC_API_KEY: "  ", ANTHROPIC_AUTH_TOKEN: "tok" },
      { requireJira: false, defaultRepoPath: repo },
    );
    expect(env.anthropicCredentials).toBe("auth-token");
  });

  it("requires Jira credentials for a real run", () => {
    const error = errorOf(() => loadEnv({}, { requireJira: true, defaultRepoPath: repo }));
    expect(error.message).toContain("JIRA_BASE_URL");
    expect(error.message).toContain("JIRA_EMAIL");
    expect(error.message).toContain("JIRA_API_TOKEN");
  });

  it("rejects a non-https Jira URL", () => {
    const error = errorOf(() =>
      loadEnv(
        { ...jira, JIRA_BASE_URL: "http://example.atlassian.net" },
        { requireJira: true, defaultRepoPath: repo },
      ),
    );
    expect(error.message).toContain("JIRA_BASE_URL");
  });

  it.each([
    ["a relative path", "relative/path"],
    ["a missing directory", "/definitely/not/here/vinyl"],
  ])("rejects AGENTS_REPO_PATH that is %s", (_label, path) => {
    const error = errorOf(() =>
      loadEnv({ AGENTS_REPO_PATH: path }, { requireJira: false, defaultRepoPath: repo }),
    );
    expect(error.message).toContain("AGENTS_REPO_PATH");
  });

  it("rejects an unknown effort level", () => {
    const error = errorOf(() =>
      loadEnv({ AGENTS_EFFORT: "extreme" }, { requireJira: false, defaultRepoPath: repo }),
    );
    expect(error.message).toContain("AGENTS_EFFORT");
  });

  it("never includes secret values in validation errors", () => {
    const error = errorOf(() =>
      loadEnv(
        { ...jira, JIRA_EMAIL: "not-an-email", ANTHROPIC_API_KEY: SECRET },
        { requireJira: true, defaultRepoPath: repo },
      ),
    );
    expect(error.message).toContain("JIRA_EMAIL");
    expect(error.message).not.toContain(SECRET);
  });
});

describe("describeEnv", () => {
  it("never exposes the Jira token or Claude key", () => {
    const env = loadEnv(
      { ...jira, ANTHROPIC_API_KEY: SECRET },
      { requireJira: true, defaultRepoPath: repo },
    );
    const described = JSON.stringify(describeEnv(env));
    expect(described).not.toContain(SECRET);
    expect(described).toContain("token set");
    expect(described).toContain("api-key");
  });

  it("reports Jira as not configured on dry runs", () => {
    const env = loadEnv({}, { requireJira: false, defaultRepoPath: repo });
    expect(describeEnv(env)["jira"]).toBe("not configured");
  });
});
