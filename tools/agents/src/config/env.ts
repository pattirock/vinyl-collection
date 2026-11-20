import { existsSync, statSync } from "node:fs";
import { isAbsolute } from "node:path";

import { z } from "zod";

export const EFFORT_LEVELS = ["low", "medium", "high", "xhigh", "max"] as const;
export type Effort = (typeof EFFORT_LEVELS)[number];

const optionalSecret = z
  .string()
  .optional()
  .transform((value) => (value === undefined || value.trim() === "" ? undefined : value));

const baseSchema = z.object({
  ANTHROPIC_API_KEY: optionalSecret,
  ANTHROPIC_AUTH_TOKEN: optionalSecret,
  AGENTS_REPO_PATH: z
    .string()
    .refine((path) => isAbsolute(path), "must be an absolute path")
    .refine(
      // The path comes from the operator's own environment (not from agents or Jira) and is
      // only checked for existence; it has already been required to be absolute.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      (path) => existsSync(path) && statSync(path).isDirectory(),
      "must be an existing directory",
    ),
  AGENTS_EFFORT: z.enum(EFFORT_LEVELS).default("high"),
});

const jiraSchema = z.object({
  JIRA_BASE_URL: z.url({ protocol: /^https$/, error: "must be an https URL" }),
  JIRA_EMAIL: z.email(),
  JIRA_API_TOKEN: z.string().min(1, "is required"),
});

export interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface AgentsEnv {
  repoPath: string;
  effort: Effort;
  /** Where Claude credentials come from; the values themselves are never exposed here. */
  anthropicCredentials: "api-key" | "auth-token" | "sdk-default";
  jira: JiraConfig | undefined;
}

export class EnvError extends Error {
  override readonly name = "EnvError";
}

export interface LoadEnvOptions {
  /** Real runs talk to Jira; dry runs do not need credentials. */
  requireJira: boolean;
  /** Used when AGENTS_REPO_PATH is not set. */
  defaultRepoPath: string;
}

/** Validate the environment. Error messages name variables, never their values. */
export function loadEnv(source: NodeJS.ProcessEnv, options: LoadEnvOptions): AgentsEnv {
  const base = baseSchema.safeParse({
    ...source,
    AGENTS_REPO_PATH: source["AGENTS_REPO_PATH"] ?? options.defaultRepoPath,
  });
  if (!base.success) throw new EnvError(formatIssues(base.error));

  let jira: JiraConfig | undefined;
  if (options.requireJira) {
    const parsed = jiraSchema.safeParse(source);
    if (!parsed.success) throw new EnvError(formatIssues(parsed.error));
    jira = {
      baseUrl: parsed.data.JIRA_BASE_URL,
      email: parsed.data.JIRA_EMAIL,
      apiToken: parsed.data.JIRA_API_TOKEN,
    };
  }

  return {
    repoPath: base.data.AGENTS_REPO_PATH,
    effort: base.data.AGENTS_EFFORT,
    anthropicCredentials: base.data.ANTHROPIC_API_KEY
      ? "api-key"
      : base.data.ANTHROPIC_AUTH_TOKEN
        ? "auth-token"
        : "sdk-default",
    jira,
  };
}

/** Safe-to-log view of the environment: secrets are reduced to "set". */
export function describeEnv(env: AgentsEnv): Record<string, string> {
  return {
    repoPath: env.repoPath,
    effort: env.effort,
    anthropicCredentials: env.anthropicCredentials,
    jira: env.jira ? `${env.jira.baseUrl} as ${env.jira.email} (token set)` : "not configured",
  };
}

function formatIssues(error: z.ZodError): string {
  const lines = error.issues.map(
    (issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
  return `Invalid environment:\n${lines.join("\n")}`;
}
