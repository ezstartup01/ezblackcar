import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { platform } from "node:os";

const root = process.cwd();
const projectRef = "kzifdtproibiwprmhtjh";
const functionNames = ["corporate-inquiry"];
const args = new Set(process.argv.slice(2));

const requiredEnv = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_MAPBOX_ACCESS_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_SECURE",
  "SMTP_FROM_EMAIL",
  "CORPORATE_INQUIRY_ALERT_EMAIL",
  "CONTACT_MESSAGE_ALERT_EMAIL",
];

function log(message) {
  console.log(`[move-production] ${message}`);
}

function fail(message) {
  console.error(`\n[move-production] ${message}`);
  process.exit(1);
}

function run(command, commandArgs, options = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    const { input, quiet, env, ...spawnOptions } = options;
    const isWindows = platform() === "win32";
    const childCommand = isWindows ? process.env.ComSpec || "cmd.exe" : command;
    const childArgs = isWindows ? ["/d", "/s", "/c", toWindowsCommand(command, commandArgs)] : commandArgs;
    const child = spawn(childCommand, childArgs, {
      cwd: root,
      shell: false,
      env: {
        ...process.env,
        ...env,
      },
      stdio: input || quiet ? ["pipe", "pipe", "pipe"] : "inherit",
      ...spawnOptions,
    });

    let stdout = "";
    let stderr = "";

    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
        if (!quiet) process.stdout.write(chunk);
      });
    }

    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
        if (!quiet) process.stderr.write(chunk);
      });
    }

    child.on("error", rejectPromise);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }
      rejectPromise(new Error(`${command} ${commandArgs.join(" ")} exited with code ${code}\n${stderr || stdout}`));
    });
  });
}

function toWindowsCommand(command, commandArgs) {
  return [command, ...commandArgs].map(quoteWindowsArg).join(" ");
}

function quoteWindowsArg(value) {
  const text = String(value);
  if (!/[ \t&()^|<>"]/.test(text)) return text;
  return `"${text.replace(/"/g, '\\"')}"`;
}

function readEnvFile(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
        return [key, value];
      }),
  );
}

function isRealValue(value) {
  if (!value) return false;
  return !/your_|_here|^pk_test_your|^sk_test_your|^whsec_your/i.test(value);
}

function loadLocalEnv() {
  return {
    ...readEnvFile(resolve(root, ".env.local")),
    ...readEnvFile(resolve(root, ".vercel", ".env.production.local")),
  };
}

function parseVercelEnvNames(output) {
  const names = new Set();
  for (const line of output.split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Z0-9_]+)\s+Encrypted\s+/);
    if (match) names.add(match[1]);
  }
  return names;
}

async function ensureFiles() {
  if (!existsSync(resolve(root, ".vercel", "project.json"))) {
    fail("Vercel project is not linked. Run `npx.cmd vercel link` once, then rerun this script.");
  }

  if (!existsSync(resolve(root, "supabase", "config.toml"))) {
    fail("Supabase config was not found.");
  }
}

async function ensureSupabaseAccess() {
  log("Checking Supabase access...");
  await run("npx.cmd", ["supabase", "projects", "list"], { quiet: true });
  await run("npx.cmd", ["supabase", "link", "--project-ref", projectRef], { quiet: true });
}

async function ensureVercelEnv() {
  log("Checking Vercel environment variables...");
  const localEnv = loadLocalEnv();
  await hydrateSupabaseServiceRole(localEnv);
  const { stdout } = await run("npx.cmd", ["vercel", "env", "ls"], { quiet: true });
  const existing = parseVercelEnvNames(stdout);
  const missing = requiredEnv.filter((key) => !existing.has(key));

  for (const key of missing) {
    const value = localEnv[key];
    if (!isRealValue(value)) continue;

    log(`Adding ${key} to Vercel Production and Preview.`);
    await addVercelEnv(key, "production", value);
    await addVercelEnv(key, "preview", value);
    existing.add(key);
  }

  const stillMissing = requiredEnv.filter((key) => !existing.has(key));
  if (stillMissing.length) {
    fail(
      `Missing required Vercel env vars:\n- ${stillMissing.join("\n- ")}\n\n` +
        "Add them in Vercel or put real values in .env.local, then rerun `npm.cmd run move:production`.",
    );
  }

}

async function hydrateSupabaseServiceRole(localEnv) {
  if (isRealValue(localEnv.SUPABASE_SERVICE_ROLE_KEY)) return;

  try {
    const { stdout } = await run(
      "npx.cmd",
      ["supabase", "projects", "api-keys", "--project-ref", projectRef, "--reveal", "--output", "json"],
      { quiet: true },
    );
    const keys = JSON.parse(stdout);
    const serviceRole = keys.find((key) => key.name === "service_role")?.api_key;
    if (isRealValue(serviceRole)) {
      localEnv.SUPABASE_SERVICE_ROLE_KEY = serviceRole;
    }
  } catch {
    // Leave the normal missing-env message to explain the blocker.
  }
}

async function addVercelEnv(key, environment, value) {
  try {
    await run("npx.cmd", ["vercel", "env", "add", key, environment], {
      input: `${value}\n`,
      quiet: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists|exists/i.test(message)) throw error;
  }
}

async function pushSupabase() {
  log("Pushing Supabase migrations...");
  await run("npx.cmd", ["supabase", "db", "push", "--yes"]);

  for (const functionName of functionNames) {
    const functionPath = resolve(root, "supabase", "functions", functionName, "index.ts");
    if (!existsSync(functionPath)) continue;

    log(`Deploying Supabase Edge Function: ${functionName}`);
    await run("npx.cmd", ["supabase", "functions", "deploy", functionName, "--project-ref", projectRef]);
  }
}

async function deployVercel() {
  log("Building app...");
  await run("npm.cmd", ["run", "build"]);

  log("Deploying Vercel production site...");
  await run("npx.cmd", ["vercel", "--prod", "--yes"]);
}

async function main() {
  const checkOnly = args.has("--check");
  const skipEnv = args.has("--skip-env");
  const skipSupabase = args.has("--skip-supabase");
  const skipVercel = args.has("--skip-vercel");

  await ensureFiles();
  await ensureSupabaseAccess();
  if (!skipEnv) await ensureVercelEnv();

  if (checkOnly) {
    log("Check complete. No production changes were deployed.");
    return;
  }

  if (!skipSupabase) await pushSupabase();
  if (!skipVercel) await deployVercel();

  log("Production move complete.");
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : "Production move failed.");
});
