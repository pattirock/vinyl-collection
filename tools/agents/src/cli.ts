import { fileURLToPath } from "node:url";

import { run } from "./run.js";

// tools/agents/src/cli.ts → monorepo root
const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

process.exitCode = run(
  process.argv.slice(2),
  process.env,
  {
    stdout: (line) => process.stdout.write(`${line}\n`),
    stderr: (line) => process.stderr.write(`${line}\n`),
  },
  repoRoot,
);
