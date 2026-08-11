#!/usr/bin/env bun

/**
 * Project-owned client for shibumi-server.
 *
 * `bun run ship:setup` connects this repository to one server and creates its
 * GitHub webhook. Later, `bun run ship` checks local work, pushes one commit,
 * and follows deployment status until the app is healthy.
 *
 * Commit this file and shibumi-server.json. SSH targets stay in local Git
 * config. Webhook secrets stay on the server and pass directly to GitHub CLI.
 */

import { cancel, confirm, intro, isCancel, log, note, outro, spinner, text } from "@clack/prompts";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const configPath = join(root, "shibumi-server.json");
const DOMAIN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const SSH_TARGET = /^(?!-)[A-Za-z0-9_.@:-]+$/;
const COMMIT = /^[a-f0-9]{40}$/;

interface ClientConfig {
  version: 1;
  provider: "shibumi-server";
  server: { hostname: string };
  domain: string;
  appId: string;
  repository: `github:${string}`;
  branch: string;
  webhookUrl: string;
  service: string;
  healthPath: string;
  cutoverRequired: boolean;
}

interface Result {
  exitCode: number;
  stdout: string;
  stderr: string;
}

// Run argument arrays directly. Avoiding a shell keeps repository and SSH input
// from becoming executable command text.
async function run(args: string[], options: { input?: string; inherit?: boolean; allowFailure?: boolean } = {}): Promise<Result> {
  const inherit = options.inherit ?? false;
  const child = Bun.spawn(args, {
    cwd: root,
    stdin: options.input === undefined ? (inherit ? "inherit" : "ignore") : "pipe",
    stdout: inherit ? "inherit" : "pipe",
    stderr: inherit ? "inherit" : "pipe",
  });
  if (options.input !== undefined) {
    if (!child.stdin) throw new Error("cannot open command input");
    child.stdin.write(options.input);
    child.stdin.end();
  }
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    inherit ? Promise.resolve("") : new Response(child.stdout).text(),
    inherit ? Promise.resolve("") : new Response(child.stderr).text(),
  ]);
  if (exitCode !== 0 && !options.allowFailure) throw new Error(stderr.trim() || `${args[0]} exited with ${exitCode}`);
  return { exitCode, stdout, stderr };
}

async function git(...args: string[]): Promise<string> {
  return (await run(["git", ...args])).stdout.trim();
}

// Double literal hyphens before replacing dots so different domains cannot
// collapse to the same server app ID.
export function appIdForDomain(domain: string): string {
  return domain.replaceAll("-", "--").replaceAll(".", "-");
}

export function repositoryFromRemote(remote: string): string {
  const match = /github\.com[/:]([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?$/.exec(remote);
  if (!match) throw new Error("origin must be a GitHub repository");
  return match[1];
}

// Infer safe defaults from owned project files. Interactive server setup still
// previews these values before changing Caddy, systemd, or server config.
async function inferredProject() {
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as { name?: unknown; scripts?: Record<string, unknown> };
  const repository = repositoryFromRemote(await git("remote", "get-url", "origin"));
  const branch = await git("branch", "--show-current");
  if (!branch) throw new Error("ship requires a named Git branch");
  const domain = typeof packageJson.name === "string" && DOMAIN.test(packageJson.name) ? packageJson.name : undefined;
  const composeFile = await Bun.file(join(root, "compose.yaml")).exists() ? "compose.yaml" : "docker-compose.yml";
  let compose = "";
  try { compose = await readFile(join(root, composeFile), "utf8"); } catch {}
  const service = /^services:\s*\n\s{2}([A-Za-z0-9_.-]+):/m.exec(compose)?.[1] ?? "web";
  const healthPath = /https?:\/\/(?:127\.0\.0\.1|localhost):\d+(\/[^\s"'\\]*)/.exec(compose)?.[1] ?? "/healthz";
  return { packageJson, repository, branch, domain, composeFile, service, healthPath };
}

// Treat downloaded and committed JSON as untrusted input. Derived fields must
// agree with the domain before any value reaches GitHub, Git, or SSH.
export function validateConfig(value: unknown): ClientConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("shibumi-server.json must be an object");
  const config = value as Partial<ClientConfig>;
  if (config.version !== 1 || config.provider !== "shibumi-server" || typeof config.domain !== "string" || !DOMAIN.test(config.domain)
    || typeof config.appId !== "string" || config.appId !== appIdForDomain(config.domain)
    || typeof config.repository !== "string" || !/^github:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.repository)
    || typeof config.branch !== "string" || !/^[A-Za-z0-9._/-]+$/.test(config.branch)
    || typeof config.webhookUrl !== "string" || config.webhookUrl !== `https://${config.domain}/hooks/github/${config.appId}`
    || typeof config.service !== "string" || typeof config.healthPath !== "string" || typeof config.cutoverRequired !== "boolean"
    || !config.server || typeof config.server.hostname !== "string") {
    throw new Error("shibumi-server.json is invalid");
  }
  return config as ClientConfig;
}

async function readConfig(): Promise<ClientConfig | undefined> {
  try {
    return validateConfig(JSON.parse(await readFile(configPath, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

// SSH target is machine-specific, so keep it in local .git/config instead of
// committed shibumi-server.json.
async function localSshTarget(): Promise<string | undefined> {
  const result = await run(["git", "config", "--local", "--get", "shibumi.server"], { allowFailure: true });
  return result.exitCode === 0 && result.stdout.trim() ? result.stdout.trim() : undefined;
}

async function suggestedSshTarget(): Promise<string | undefined> {
  try {
    const env = await readFile(join(root, ".env"), "utf8");
    const host = /^DEPLOY_HOST=(.+)$/m.exec(env)?.[1]?.trim();
    const user = /^DEPLOY_USER=(.+)$/m.exec(env)?.[1]?.trim();
    if (host && user && SSH_TARGET.test(`${user}@${host}`)) return `${user}@${host}`;
  } catch {}
  return undefined;
}

async function requestSshTarget(configHostname?: string): Promise<string | undefined> {
  const suggestion = await suggestedSshTarget() ?? configHostname;
  note(
    "SSH target will be saved in .git/config.\nIt stays on this computer and will not be committed or shared.\nThe resolved server hostname, app domain, and deploy settings go in committed shibumi-server.json.",
    "Local configuration",
  );
  const answer = await text({
    message: "SSH server",
    placeholder: suggestion ?? "deploy@example-vps.com",
    validate: (value) => SSH_TARGET.test(value || suggestion || "") ? undefined : "Use an SSH host or user@host without spaces",
  });
  if (isCancel(answer)) return undefined;
  const target = answer || suggestion;
  if (!target) return undefined;
  const accepted = await confirm({
    message: `Save ${target} locally and connect?`,
    initialValue: true,
  });
  if (isCancel(accepted) || !accepted) return undefined;
  await run(["git", "config", "--local", "shibumi.server", target]);
  log.success("SSH target saved to local Git config. It will not be committed.");
  return target;
}

async function resolvedSshHostname(target: string): Promise<string> {
  if (!SSH_TARGET.test(target)) throw new Error("local SSH target is unsafe");
  const result = await run(["ssh", "-G", "--", target]);
  const hostname = /^hostname\s+(.+)$/m.exec(result.stdout)?.[1]?.trim();
  if (!hostname || !/^[A-Za-z0-9](?:[A-Za-z0-9.-]{0,251}[A-Za-z0-9])?$/.test(hostname)) {
    throw new Error("cannot resolve SSH server hostname");
  }
  return hostname.toLowerCase();
}

// Pass remote arguments separately and reject control characters. Interactive
// setup gets a TTY so SSH and sudo prompts remain attached to this terminal.
function ssh(target: string, remoteArgs: string[], options: { tty?: boolean; allowFailure?: boolean } = {}): Promise<Result> {
  if (!SSH_TARGET.test(target)) throw new Error("local SSH target is unsafe");
  for (const arg of remoteArgs) if (/[\0\r\n]/.test(arg)) throw new Error("remote argument is unsafe");
  return run([
    "ssh", "-o", "StrictHostKeyChecking=yes", ...(options.tty ? ["-t"] : []), "--", target, ...remoteArgs,
  ], { inherit: options.tty, allowFailure: options.allowFailure });
}

function versionAtLeast(current: string, minimum: string): boolean {
  const left = /^\d+\.\d+\.\d+$/.test(current) ? current.split(".").map(Number) : [];
  const right = minimum.split(".").map(Number);
  for (let index = 0; index < right.length; index += 1) {
    if ((left[index] ?? -1) !== right[index]) return (left[index] ?? -1) > right[index];
  }
  return left.length === right.length;
}

// Install only through the reviewed, version-pinned website endpoint.
async function ensureServer(target: string): Promise<void> {
  const version = await ssh(target, ["shibumi-server", "--version"], { allowFailure: true });
  if (version.exitCode === 0 && versionAtLeast(version.stdout.trim(), "0.1.22")) return;
  note(
    "This runs the reviewed installer on the SSH server. SSH and sudo prompts stay attached directly to your terminal.",
    version.exitCode === 0 ? `shibumi-server ${version.stdout.trim()} needs an upgrade` : "shibumi-server is not installed",
  );
  const accepted = await confirm({ message: "Install or upgrade shibumi-server now?", initialValue: true });
  if (isCancel(accepted) || !accepted) throw new Error("server setup cancelled");
  const result = await ssh(target, ["curl -fsSL https://shibumistack.dev/install/server | bash"], { tty: true, allowFailure: true });
  if (result.exitCode !== 0) throw new Error("remote shibumi-server installation failed");
}

// Register the app on the server, then download only commit-safe client config.
// Checkout paths and secrets never enter shibumi-server.json.
async function remoteSetup(target: string, force: boolean): Promise<ClientConfig> {
  const project = await inferredProject();
  let domain = project.domain;
  if (!domain) {
    const answer = await text({
      message: "App domain",
      placeholder: "example.com",
      validate: (value) => DOMAIN.test(value) ? undefined : "Use a lowercase public hostname",
    });
    if (isCancel(answer)) throw new Error("setup cancelled");
    domain = answer;
  }
  note(
    `SSH target  ${target}\nDomain      ${domain}\nRepository  github:${project.repository}\n\nThis opens an interactive SSH session and may request sudo only when Caddy configuration is applied.`,
    force ? "Reconfigure deployment" : "Server setup required",
  );
  const accepted = await confirm({ message: "Continue through SSH?", initialValue: true });
  if (isCancel(accepted) || !accepted) throw new Error("server setup cancelled");
  await ensureServer(target);

  const args = [
    "shibumi-server", "add", domain,
    "--repository", `github:${project.repository}`,
    "--compose-file", project.composeFile,
    "--service", project.service,
    "--health-path", project.healthPath,
  ];
  const setup = await ssh(target, args, { tty: true, allowFailure: true });
  if (setup.exitCode !== 0) throw new Error("remote app setup failed");
  const appId = appIdForDomain(domain);
  const serverHostname = await resolvedSshHostname(target);
  const downloaded = await ssh(target, [
    "shibumi-server", "client-config", appId, "--server-hostname", serverHostname,
  ], { allowFailure: true });
  if (downloaded.exitCode !== 0) {
    throw new Error("server setup paused before app registration. Complete the printed DNS instructions, then run bun run ship again");
  }
  const config = validateConfig(JSON.parse(downloaded.stdout));
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  log.success("Wrote shibumi-server.json. This file is safe to commit.");
  return config;
}

async function webhookExists(config: ClientConfig): Promise<boolean | undefined> {
  const repository = config.repository.slice("github:".length);
  const auth = await run(["gh", "auth", "status"], { allowFailure: true });
  if (auth.exitCode !== 0) return undefined;
  const hooks = await run(["gh", "api", `repos/${repository}/hooks?per_page=100`], { allowFailure: true });
  if (hooks.exitCode !== 0) return undefined;
  const value: unknown = JSON.parse(hooks.stdout);
  return Array.isArray(value) && value.some((hook) => {
    if (!hook || typeof hook !== "object") return false;
    const item = hook as { active?: unknown; config?: { url?: unknown } };
    return item.active === true && item.config?.url === config.webhookUrl;
  });
}

// Fetch the secret only when GitHub needs it. It moves through process memory
// from server output to `gh` input and is never printed or written locally.
async function ensureWebhook(config: ClientConfig, target: string): Promise<void> {
  const existing = await webhookExists(config);
  if (existing) {
    log.success("GitHub webhook is active");
    return;
  }
  note(
    `Repository  ${config.repository.slice("github:".length)}\nPayload URL ${config.webhookUrl}\nEvents      push\n\nThe secret will travel from server to GitHub CLI through this process. It stays in memory and is never printed, written to disk, or committed.`,
    existing === false ? "GitHub webhook is missing" : "GitHub webhook could not be verified",
  );
  const create = await confirm({ message: "Create webhook with GitHub CLI?", initialValue: true });
  if (isCancel(create) || !create) {
    throw new Error(`configure the GitHub webhook manually, then rerun ship: https://github.com/${config.repository.slice("github:".length)}/settings/hooks/new`);
  }
  const secretResult = await ssh(target, ["env", "SHIBUMI_SKIP_UPDATE_CHECK=1", "shibumi-server", "webhook-secret", config.appId]);
  const secretValue: unknown = JSON.parse(secretResult.stdout);
  const secret = secretValue && typeof secretValue === "object" ? (secretValue as { secret?: unknown }).secret : undefined;
  if (typeof secret !== "string" || !/^[a-f0-9]{64}$/.test(secret)) throw new Error("server returned an invalid webhook secret");
  const body = JSON.stringify({
    name: "web",
    active: true,
    events: ["push"],
    config: { url: config.webhookUrl, content_type: "json", insecure_ssl: "0", secret },
  });
  const repository = config.repository.slice("github:".length);
  const result = await run(["gh", "api", "-X", "POST", `repos/${repository}/hooks`, "--input", "-"], { input: body, allowFailure: true });
  if (result.exitCode !== 0) throw new Error("GitHub CLI could not create webhook. Confirm repository Webhooks read/write permission");
  log.success("GitHub webhook created");
}

async function setup(force: boolean): Promise<{ config: ClientConfig; target: string; changed: boolean }> {
  let config = await readConfig();
  let target = await localSshTarget();
  if (!target) target = await requestSshTarget(config?.server.hostname);
  if (!target) throw new Error("SSH server is required");
  const previous = config;
  if (force || !config) config = await remoteSetup(target, force);
  if (!config) throw new Error("deployment setup did not return client configuration");
  await ensureWebhook(config, target);
  return { config, target, changed: !previous || JSON.stringify(previous) !== JSON.stringify(config) };
}

// Refuse ambiguous deploys: wrong origin, wrong branch, dirty work, remote work
// not present locally, or no new commit. Run project-owned checks before push.
async function preflight(config: ClientConfig): Promise<void> {
  const project = await inferredProject();
  if (`github:${project.repository}` !== config.repository) throw new Error(`origin does not match ${config.repository}`);
  if (project.branch !== config.branch) throw new Error(`current branch must be ${config.branch}`);
  const status = await git("status", "--porcelain");
  if (status) throw new Error("working tree has uncommitted changes");

  const progress = spinner();
  progress.start(`Fetching origin/${config.branch}`);
  await run(["git", "fetch", "origin", config.branch]);
  const counts = (await git("rev-list", "--left-right", "--count", `HEAD...origin/${config.branch}`)).split(/\s+/).map(Number);
  if (counts[1] > 0) {
    progress.stop("Branch is behind or diverged", 1);
    throw new Error(`pull origin/${config.branch} before shipping`);
  }
  if (counts[0] < 1) {
    progress.stop("Nothing to ship", 1);
    throw new Error("branch has no unpushed commits");
  }
  progress.stop(`${counts[0]} commit${counts[0] === 1 ? "" : "s"} ready`);

  const scripts = project.packageJson.scripts ?? {};
  for (const name of ["test", "check"]) {
    if (typeof scripts[name] !== "string") continue;
    const check = spinner();
    check.start(`Running bun run ${name}`);
    const result = await run(["bun", "run", name], { allowFailure: true });
    if (result.exitCode !== 0) {
      check.stop(`${name} failed`, 1);
      process.stderr.write(result.stderr || result.stdout);
      throw new Error(`bun run ${name} failed`);
    }
    check.stop(`${name} passed`);
  }
}

// Follow status for the exact pushed commit. This prevents an older or parallel
// deployment from being reported as success for current ship.
async function followStatus(config: ClientConfig, target: string, commit: string): Promise<void> {
  const progress = spinner();
  progress.start("Waiting for webhook");
  const deadline = Date.now() + 12 * 60_000;
  let lastStage = "";
  while (Date.now() < deadline) {
    const result = await ssh(target, [
      "env", "SHIBUMI_SKIP_UPDATE_CHECK=1", "shibumi-server", "status", config.appId, "--commit", commit, "--json",
    ], { allowFailure: true });
    if (result.exitCode === 0 && result.stdout.trim() && result.stdout.trim() !== "null") {
      const status = JSON.parse(result.stdout) as { state?: string; stage?: string; message?: string; url?: string };
      if (status.stage && status.stage !== lastStage) {
        lastStage = status.stage;
        progress.message(status.stage === "shipped" ? "Deployment complete" : `${status.stage}…`);
      }
      if (status.state === "succeeded") {
        progress.stop(config.cutoverRequired
          ? `New upstream healthy at 127.0.0.1 (Caddy cutover pending)`
          : `Shipped ${status.url ?? `https://${config.domain}`}`);
        return;
      }
      if (status.state === "failed") {
        progress.stop(`Deployment failed during ${status.stage ?? "unknown"}`, 1);
        throw new Error(status.message ?? "deployment failed");
      }
    }
    await Bun.sleep(2_000);
  }
  progress.stop("Deployment status timed out", 1);
  throw new Error(`deployment may still be running. Check: ssh ${target} shibumi-server status ${config.appId}`);
}

// Existing domains keep serving their previous upstream until new app is
// healthy and user explicitly approves Caddy cutover.
async function completeCutover(config: ClientConfig, target: string): Promise<boolean> {
  if (!config.cutoverRequired) return false;
  note(
    `The new app is healthy, but ${config.domain} still serves its previous upstream.\nCaddy cutover validates and reloads configuration without stopping active connections.`,
    "Existing-domain cutover",
  );
  const accepted = await confirm({ message: "Switch public traffic to the new upstream through SSH?", initialValue: true });
  if (isCancel(accepted) || !accepted) {
    log.warn("Cutover skipped. Previous upstream remains public.");
    return false;
  }
  const result = await ssh(target, ["shibumi-server", "caddy-cutover", config.appId], { tty: true, allowFailure: true });
  if (result.exitCode !== 0) throw new Error("Caddy cutover failed; previous upstream remains active");
  const hostname = await resolvedSshHostname(target);
  const downloaded = await ssh(target, [
    "env", "SHIBUMI_SKIP_UPDATE_CHECK=1", "shibumi-server", "client-config", config.appId, "--server-hostname", hostname,
  ]);
  const next = validateConfig(JSON.parse(downloaded.stdout));
  await writeFile(configPath, `${JSON.stringify(next, null, 2)}\n`);
  Object.assign(config, next);
  log.success(`Caddy now serves ${config.domain} from the Shibumi upstream`);
  return true;
}

// Setup exits after configuration changes so user can review and commit them.
// Normal ship reaches push only when configuration is already stable.
export async function runShip(): Promise<void> {
  intro("渋み  ship");
  const forceSetup = process.argv.slice(2).includes("--setup");
  const result = await setup(forceSetup);
  if (forceSetup || result.changed) {
    note(
      "shibumi-server.json is committed project configuration.\nSSH target stays local in .git/config and will not be committed.\nSecrets stay on the server.",
      "Configuration boundaries",
    );
    outro(result.changed
      ? "Review and commit shibumi-server.json, then run bun run ship again."
      : "Deployment setup is current. No committed configuration changed.");
    return;
  }
  await preflight(result.config);
  const accepted = await confirm({ message: `Push ${result.config.branch} and deploy ${result.config.domain}?`, initialValue: true });
  if (isCancel(accepted) || !accepted) {
    cancel("Ship cancelled");
    return;
  }
  await run(["git", "push", "origin", result.config.branch], { inherit: true });
  const commit = await git("rev-parse", "HEAD");
  if (!COMMIT.test(commit)) throw new Error("cannot determine shipped commit");
  await followStatus(result.config, result.target, commit);
  const changed = await completeCutover(result.config, result.target);
  outro(changed
    ? `Shipped https://${result.config.domain}. Commit updated shibumi-server.json.`
    : `https://${result.config.domain}`);
}

export function runShipCli(): void {
  runShip().catch((error) => {
    cancel(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

if (import.meta.main) runShipCli();
