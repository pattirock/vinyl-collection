import { parseArgs } from "node:util";

export const ISSUE_KEY_PATTERN = /^VINYL-[1-9]\d*$/;

export const USAGE = "Usage: npm run agents -- VINYL-<n> [--dry-run]";

export interface CliArgs {
  issueKey: string;
  dryRun: boolean;
}

export class CliUsageError extends Error {
  override readonly name = "CliUsageError";
}

export function parseCliArgs(argv: readonly string[]): CliArgs {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      allowPositionals: true,
      strict: true,
      options: { "dry-run": { type: "boolean", default: false } },
    });
  } catch (error) {
    throw new CliUsageError(`${error instanceof Error ? error.message : String(error)}\n${USAGE}`);
  }

  const [issueKey, ...extra] = parsed.positionals;
  if (issueKey === undefined || extra.length > 0) {
    throw new CliUsageError(`Expected exactly one Jira issue key.\n${USAGE}`);
  }
  if (!ISSUE_KEY_PATTERN.test(issueKey)) {
    throw new CliUsageError(`Invalid issue key "${issueKey}" (expected VINYL-<n>).\n${USAGE}`);
  }

  return { issueKey, dryRun: parsed.values["dry-run"] };
}
