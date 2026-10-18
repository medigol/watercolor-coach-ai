#!/usr/bin/env node
// Never auto-load .env files. Never log keys, image names or upstream exceptions.
const fs = require("node:fs");
const { external } = require("./safety.cjs");
const { prepare } = require("./prepare.cjs");
const { run, plan } = require("./runner.cjs");
const { report } = require("./report.cjs");
function args(argv) {
  const [command, ...rest] = argv,
    options = {};
  const flags = {
    "--live": "live",
    "--dry-run": "dryRun",
    "--confirm-cost": "confirmCost",
    "--retain-responses": "retainResponses",
  };
  const values = {
    "--manifest": "manifest",
    "--prepared": "prepared",
    "--output": "output",
    "--rates": "ratesFile",
    "--cases": "cases",
    "--chromium": "chromiumPath",
    "--ratings": "ratings",
  };
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    if (flags[flag]) {
      if (options[flags[flag]]) throw Error("Duplicate flag");
      options[flags[flag]] = true;
    } else if (values[flag] && rest[i + 1] && !rest[i + 1].startsWith("--")) {
      if (options[values[flag]]) throw Error("Duplicate option");
      options[values[flag]] = rest[++i];
    } else throw Error("Unknown or incomplete benchmark option");
  }
  if (!["prepare", "run", "report"].includes(command))
    throw Error("Use prepare, run or report; see docs/benchmark/README.md");
  if (options.live && options.dryRun) throw Error("Choose live or dry-run");
  if ((options.confirmCost || options.retainResponses) && !options.live)
    throw Error("Cost/retention consent is live-only");
  if (
    command !== "run" &&
    (options.live || options.confirmCost || options.retainResponses)
  )
    throw Error("Live authorization only belongs to run");
  if (
    (command === "prepare" && (!options.manifest || !options.output)) ||
    (command === "run" &&
      (!options.prepared || (options.live && !options.output))) ||
    (command === "report" && (!options.prepared || !options.output))
  )
    throw Error("Required private paths missing; see benchmark README");
  return { command, options };
}
async function main(argv) {
  const { command, options } = args(argv);
  if (options.ratesFile)
    options.rates = JSON.parse(
      fs.readFileSync(external(options.ratesFile, true), "utf8"),
    );
  if (command === "prepare") return prepare(options);
  if (command === "report") return report(options);
  if (options.live) {
    const preflight = plan(options);
    console.log(
      JSON.stringify({
        preflight: true,
        plannedRequests: preflight.calls.length,
        worstCaseUSD: preflight.worstCaseUSD,
        budgetUSD: 3,
        warning:
          "Application-side projection, not an account billing cap. Run dry-run before deciding to authorize live. Budget can stop before all arms finish.",
      }),
    );
  }
  return run(options);
}
if (require.main === module)
  main(process.argv.slice(2))
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch(() => {
      console.error(
        "Benchmark stopped safely. Check local paths, approvals, current rate-card attestation, production lock, cost journal and documented command syntax. No automatic retry.",
      );
      process.exitCode = 1;
    });
module.exports = { args, main };
