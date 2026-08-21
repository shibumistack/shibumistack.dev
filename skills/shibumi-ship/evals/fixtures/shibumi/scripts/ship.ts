#!/usr/bin/env bun

import { appendFile } from "node:fs/promises";

const gitDir = (await Bun.$`git rev-parse --git-dir`.quiet()).text().trim();
const mode = await Bun.file(`${gitDir}/ship-eval-mode`).text();
const args = process.argv.slice(2);
await appendFile(`${gitDir}/ship-eval-calls`, `${args.join(" ") || "ship"}\n`);

if (args.includes("--status")) {
  const commit = (await Bun.$`git rev-parse HEAD`.quiet()).text().trim();
  console.log(`Status  succeeded\nCommit  ${commit} (matches HEAD)\nStage   complete\nUpdated 2026-08-21T10:00:00.000Z\nURL     https://fixture.invalid`);
} else if (args.includes("--logs")) {
  console.log(mode.trim() === "health-failure"
    ? "deployment failed during health\nhealth check did not pass\nprevious release restored"
    : "deployment succeeded");
} else if (args.includes("--rollback")) {
  console.log("Rolled back fixture-invalid\nhttps://fixture.invalid");
} else if (mode.trim() === "health-failure") {
  console.error("Deployment failed during health\n\nNext: run bun ship --logs.");
  process.exitCode = 1;
} else {
  const commit = (await Bun.$`git rev-parse HEAD`.quiet()).text().trim();
  console.log(`Checks passed\nDeployment complete ${commit}\nhttps://fixture.invalid`);
}
