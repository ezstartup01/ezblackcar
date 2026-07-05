import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const functionName = "corporate-inquiry";
const projectRef = "kzifdtproibiwprmhtjh";
const args = new Set(process.argv.slice(2));

const deployFunction = !args.has("--web-only");
const deployWeb = !args.has("--function-only");

function fail(message) {
  console.error(`\n[deploy] ${message}`);
  process.exit(1);
}

function ensureExists(path, label) {
  if (!existsSync(path)) {
    fail(`${label} not found: ${path}`);
  }
}

function run(command, commandArgs, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, commandArgs, {
      cwd: root,
      stdio: "inherit",
      shell: true,
      ...options,
    });

    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function main() {
  console.log("[deploy] Starting production deployment...");

  ensureExists(resolve(root, ".vercel", "project.json"), "Vercel project link");
  ensureExists(resolve(root, "supabase", "functions", functionName, "index.ts"), "Supabase Edge Function");

  if (deployFunction && !process.env.SUPABASE_ACCESS_TOKEN) {
    fail(
      "SUPABASE_ACCESS_TOKEN is missing. In PowerShell, run:\n" +
        'setx SUPABASE_ACCESS_TOKEN "your-real-supabase-token"\n' +
        "Then open a new terminal and run this deploy command again.",
    );
  }

  console.log("[deploy] Building app...");
  await run("npm.cmd", ["run", "build"]);

  if (deployFunction) {
    console.log(`[deploy] Deploying Supabase Edge Function: ${functionName}`);
    await run("npm.cmd", [
      "exec",
      "supabase",
      "--",
      "functions",
      "deploy",
      functionName,
      "--project-ref",
      projectRef,
    ]);
  }

  if (deployWeb) {
    console.log("[deploy] Deploying Vercel production site...");
    await run("npm.cmd", ["exec", "vercel", "--", "--prod", "--yes"]);
  }

  console.log("\n[deploy] Production deployment complete.");
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : "Deployment failed.");
});
