import { AGENT_MODEL } from "./claude/client.js";
import { CliUsageError, parseCliArgs } from "./cli/args.js";
import { EnvError, describeEnv, loadEnv } from "./config/env.js";

export interface RunIO {
  stdout: (line: string) => void;
  stderr: (line: string) => void;
}

export const EXIT_OK = 0;
export const EXIT_USAGE = 1;
export const EXIT_NOT_IMPLEMENTED = 2;

/** CLI logic, separated from process globals so it can be tested. Returns the exit code. */
export function run(
  argv: readonly string[],
  source: NodeJS.ProcessEnv,
  io: RunIO,
  defaultRepoPath: string,
): number {
  let args;
  let env;
  try {
    args = parseCliArgs(argv);
    env = loadEnv(source, { requireJira: !args.dryRun, defaultRepoPath });
  } catch (error) {
    if (error instanceof CliUsageError || error instanceof EnvError) {
      io.stderr(error.message);
      return EXIT_USAGE;
    }
    throw error;
  }

  if (args.dryRun) {
    io.stdout(
      JSON.stringify(
        { issue: args.issueKey, model: AGENT_MODEL, dryRun: true, ...describeEnv(env) },
        null,
        2,
      ),
    );
    io.stdout("Dry run: configuration is valid; no Claude or Jira calls were made.");
    return EXIT_OK;
  }

  io.stderr(
    `The orchestrator graph is not implemented yet (VINYL-47). Use --dry-run to check the configuration for ${args.issueKey}.`,
  );
  return EXIT_NOT_IMPLEMENTED;
}
