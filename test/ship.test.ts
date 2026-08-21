import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { appIdForDomain, canFollowDeployment, clientSettingsPath, composeFileFromTracked, composeFrontend, deploymentFileTemplates, deploymentModeForTrigger, deploymentStatusSummary, dockerCredentialHelpers, domainFromProject, formatDuration, immutableShipSource, isAgentExecution, latestDeployDuration, matchingWebhook, missingComposeMessage, parseDeployStatus, parseShipArgs, prebuiltImage, prebuiltLabels, protectedPushBlocked, removeDockerCredentialHelper, repositoryFromRemote, setupDomain, shouldAnimateProgress, shouldCheckForShipUpdate, shouldTriggerRedeploy, stripDockerDesktopLinks, terminalHistory, validateConfig } from "../scripts/ship";

const config = {
  version: 1,
  provider: "shibumi-server",
  server: { hostname: "alpha.example.com" },
  domain: "example.com",
  appId: "example-com",
  repository: "github:owner/repo",
  branch: "main",
  webhookUrl: "https://example.com/hooks/github/example-com",
  service: "app",
  port: 9100,
  healthPath: "/healthz",
  deploymentMode: "prebuilt",
  trigger: "ship",
  platform: "linux/arm64",
  cutoverRequired: false,
} as const;

describe("ship configuration", () => {
  test("detects agent and non-interactive execution", () => {
    expect(isAgentExecution({ PI_CODING_AGENT: "true" }, true, true)).toBeTrue();
    expect(isAgentExecution({}, false, true)).toBeTrue();
    expect(isAgentExecution({}, true, true)).toBeFalse();
    expect(shouldAnimateProgress(true, true)).toBeFalse();
    expect(shouldAnimateProgress(false, false)).toBeFalse();
    expect(shouldAnimateProgress(false, true)).toBeTrue();
  });

  test("parses explicit automation options", () => {
    expect(parseShipArgs(["--", "--yes", "--server", "deploy@example-vps", "--domain", "app.example.com"])).toEqual({
      setup: false,
      update: false,
      rollback: false,
      logs: false,
      status: false,
      dev: false,
      rebuild: false,
      yes: true,
      server: "deploy@example-vps",
      domain: "app.example.com",
    });
    expect(parseShipArgs(["--rollback", "-y"])).toMatchObject({ rollback: true, yes: true });
    expect(parseShipArgs(["--rebuild", "-y"])).toMatchObject({ rebuild: true, yes: true });
    expect(parseShipArgs(["--setup", "--trigger", "ship"])).toMatchObject({ setup: true, trigger: "ship" });
    expect(parseShipArgs(["--setup", "--trigger", "github-push"])).toMatchObject({ setup: true, trigger: "github-push" });
    expect(parseShipArgs(["--logs"])).toMatchObject({ logs: true });
    expect(parseShipArgs(["--status"])).toMatchObject({ status: true });
    expect(parseShipArgs(["--dev"])).toMatchObject({ dev: true });
    expect(() => parseShipArgs(["--yes", "--server"])).toThrow("--server requires a value");
    expect(() => parseShipArgs(["--yes", "--wat"])).toThrow("unknown ship option");
    expect(() => parseShipArgs(["--setup", "--rollback"])).toThrow("choose only one");
    expect(() => parseShipArgs(["--status", "--logs"])).toThrow("choose only one");
    expect(() => parseShipArgs(["--setup", "--rebuild"])).toThrow("applies only to shipping");
    expect(() => parseShipArgs(["--trigger", "ship"])).toThrow("requires --setup");
    expect(() => parseShipArgs(["--setup", "--trigger", "other"])).toThrow("ship or github-push");
    expect(shouldCheckForShipUpdate(parseShipArgs(["-y"]))).toBeTrue();
    expect(shouldCheckForShipUpdate(parseShipArgs(["--logs"]))).toBeFalse();
    expect(shouldCheckForShipUpdate(parseShipArgs(["--status"]))).toBeFalse();
  });

  test("validates and summarizes deployment status", () => {
    const commit = "a".repeat(40);
    const status = parseDeployStatus({
      commit,
      state: "succeeded",
      stage: "complete",
      updatedAt: "2026-08-21T10:00:00.000Z",
      url: "https://example.com",
    });
    expect(deploymentStatusSummary(status, commit, config)).toContain(`Commit  ${commit} (matches HEAD)`);
    expect(deploymentStatusSummary(status, "b".repeat(40), config)).toContain(`HEAD    ${"b".repeat(40)}`);
    expect(deploymentStatusSummary(undefined, commit, config)).toBe("No deployment status for https://example.com");
    expect(() => parseDeployStatus({ commit: "bad", state: "succeeded", stage: "complete", updatedAt: "now" })).toThrow("deployment status is invalid");
  });

  test("accepts only immutable reviewed ship source URLs", () => {
    expect(immutableShipSource('const CURRENT_SOURCE = "https://shibumistack.dev/ship/v26.ts";')).toBe("https://shibumistack.dev/ship/v26.ts");
    expect(immutableShipSource('const CURRENT_SOURCE = "https://attacker.example/ship/v26.ts";')).toBeUndefined();
    expect(immutableShipSource('const CURRENT_SOURCE = "https://shibumistack.dev/ship/latest.ts";')).toBeUndefined();
  });

  test("cleans Docker output and finds configured credential helpers", () => {
    expect(stripDockerDesktopLinks("build failed\nView build details: docker-desktop://dashboard/build/id\nretry")).toBe("build failed\nretry");
    const config: Record<string, unknown> = { credsStore: "desktop", credHelpers: { registry: "osxkeychain", duplicate: "desktop" } };
    expect(dockerCredentialHelpers(config)).toEqual(["desktop", "osxkeychain"]);
    removeDockerCredentialHelper(config, "desktop");
    expect(config).toEqual({ credHelpers: { registry: "osxkeychain" } });
    expect(dockerCredentialHelpers(undefined)).toEqual([]);
  });

  test("formats ship duration and resolves local client config", () => {
    expect(formatDuration(1_200)).toBe("1 second");
    expect(formatDuration(61_000)).toBe("1 minute 1 second");
    expect(clientSettingsPath({}, "/home/user")).toBe("/home/user/.config/shibumi/config.json");
    expect(clientSettingsPath({ XDG_CONFIG_HOME: "/tmp/config" }, "/home/user")).toBe("/tmp/config/shibumi/config.json");
    expect(latestDeployDuration([
      { kind: "webhook", state: "succeeded", durationMs: 42_000 },
      { kind: "rollback", state: "succeeded", durationMs: 3_000 },
      { kind: "webhook", state: "failed", durationMs: 8_000 },
    ])).toBe(42_000);
  });

  test("derives collision-free app IDs and GitHub repositories", () => {
    expect(appIdForDomain("something-some.org")).toBe("something--some-org");
    expect(repositoryFromRemote("git@github.com:owner/repo.git")).toBe("owner/repo");
    expect(repositoryFromRemote("https://github.com/owner/repo.git")).toBe("owner/repo");
  });

  test("reuses configured domain before inferring it", () => {
    expect(setupDomain(undefined, "configured.example.com", "inferred.example.com")).toBe("configured.example.com");
    expect(setupDomain("explicit.example.com", "configured.example.com", undefined)).toBe("explicit.example.com");
    expect(setupDomain(undefined, undefined, "inferred.example.com")).toBe("inferred.example.com");
  });

  test("infers a domain from project name or Compose SITE_URL", () => {
    expect(domainFromProject("example.com", "")).toBe("example.com");
    expect(domainFromProject("vibetoolbox", "    SITE_URL: https://vibetoolbox.dev\n")).toBe("vibetoolbox.dev");
    expect(domainFromProject("app", "    - SITE_URL=https://preview.example.com/path\n")).toBe("preview.example.com");
    expect(domainFromProject("app", "    SITE_URL: http://localhost:3000\n")).toBeUndefined();
  });

  test("selects Docker Compose plugin before standalone Compose", () => {
    expect(composeFrontend(true, true)).toEqual(["docker", "compose"]);
    expect(composeFrontend(false, true)).toEqual(["docker-compose"]);
    expect(composeFrontend(false, false)).toBeUndefined();
  });

  test("chooses deployment mode and trigger behavior", () => {
    expect(shouldTriggerRedeploy("ship", 1)).toBeTrue();
    expect(shouldTriggerRedeploy("github-push", 1)).toBeFalse();
    expect(shouldTriggerRedeploy("github-push", 0)).toBeTrue();
    expect(deploymentModeForTrigger("ship")).toBe("prebuilt");
    expect(deploymentModeForTrigger("github-push")).toBe("build");
  });

  test("blocks only pull-request rules the current GitHub user cannot bypass", () => {
    const reviews = { bypass_pull_request_allowances: { users: [{ login: "bitbonsai" }] } };
    expect(protectedPushBlocked({ enforce_admins: { enabled: true } })).toBeFalse();
    expect(protectedPushBlocked({ enforce_admins: { enabled: true }, required_pull_request_reviews: reviews }, "bitbonsai")).toBeFalse();
    expect(protectedPushBlocked({ enforce_admins: { enabled: false }, required_pull_request_reviews: {} }, "admin", true)).toBeFalse();
    expect(protectedPushBlocked({ enforce_admins: { enabled: true }, required_pull_request_reviews: {} }, "writer", false)).toBeTrue();
    expect(protectedPushBlocked("protected")).toBeUndefined();
  });

  test("distinguishes healthy and failed matching webhooks", () => {
    const hook = { id: 42, active: true, config: { url: config.webhookUrl }, last_response: { code: 401 } };
    expect(matchingWebhook([hook], config.webhookUrl)).toEqual({ id: 42, active: true, needsRepair: true });
    expect(matchingWebhook([{ ...hook, last_response: { code: 200 } }], config.webhookUrl)).toEqual({ id: 42, active: true, needsRepair: false });
    expect(matchingWebhook([{ ...hook, last_response: { code: 0 } }], config.webhookUrl)).toEqual({ id: 42, active: true, needsRepair: false });
    expect(matchingWebhook([{ ...hook, active: false }], config.webhookUrl)).toEqual({ id: 42, active: false, needsRepair: true });
    expect(matchingWebhook([hook], "https://example.com/other")).toBeUndefined();
  });

  test("generates bounded Bun deployment files", () => {
    const built = deploymentFileTemplates(true);
    expect(built.Dockerfile).toContain("RUN bun run build");
    expect(built.Dockerfile).toContain('CMD ["bun", "run", "start"]');
    expect(built["compose.yaml"]).toContain('127.0.0.1:${SHIBUMI_PORT:-9001}:3000');
    expect(built["compose.yaml"]).toContain('memory: 512M');
    expect(built[".dockerignore"]).toContain(".env.*");
    expect(deploymentFileTemplates(false).Dockerfile).not.toContain("RUN bun run build");
  });

  test("generates missing deployment files before remote setup", async () => {
    const directory = await mkdtemp(join(tmpdir(), "shibumi-compose-"));
    try {
      await Bun.write(join(directory, "package.json"), JSON.stringify({ scripts: { build: "bun build ./src.ts --outdir dist", start: "bun dist/src.js" } }));
      await Bun.write(join(directory, "src.ts"), "Bun.serve({ port: Number(Bun.env.PORT ?? 3000), fetch: () => new Response('ok') });\n");
      for (const args of [["git", "init", "-q"], ["git", "add", "."], ["git", "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "initial"]]) {
        expect(Bun.spawnSync(args, { cwd: directory }).exitCode).toBe(0);
      }
      const result = Bun.spawnSync([process.execPath, resolve(import.meta.dir, "../scripts/ship.ts"), "--setup", "-y"], {
        cwd: directory,
        env: { ...process.env, PI_CODING_AGENT: "" },
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(result.exitCode).toBe(0);
      expect(await readFile(join(directory, "Dockerfile"), "utf8")).toContain("RUN bun run build");
      expect(await readFile(join(directory, "compose.yaml"), "utf8")).toContain("127.0.0.1:${SHIBUMI_PORT:-9001}:3000");
      expect(await readFile(join(directory, ".dockerignore"), "utf8")).toContain(".env.*");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  test("selects one tracked root or nested Compose file", () => {
    expect(composeFileFromTracked(["package.json", "compose.yaml"])).toBe("compose.yaml");
    expect(composeFileFromTracked(["website/compose.yaml", "package.json"])).toBe("website/compose.yaml");
    expect(() => composeFileFromTracked(["a/compose.yaml", "b/compose.yaml"])).toThrow("multiple");
  });

  test("names current branch and another worktree when Compose is elsewhere", () => {
    expect(missingComposeMessage("main", [{
      branch: "staging",
      path: "/repo.staging",
      composeFile: "website/compose.yaml",
    }])).toContain("no tracked Compose file found on current branch main");
    expect(missingComposeMessage("main", [{ branch: "staging", path: "/repo.staging", composeFile: "website/compose.yaml" }]))
      .toContain("staging → /repo.staging/website/compose.yaml");
    expect(missingComposeMessage("main", [])).toContain("add compose.yaml");
  });

  test("follows only an active deployment for the same commit", () => {
    const commit = "a".repeat(40);
    expect(canFollowDeployment({ commit, state: "running" }, commit)).toBe(true);
    expect(canFollowDeployment({ commit, state: "succeeded" }, commit)).toBe(true);
    expect(canFollowDeployment({ commit, state: "failed" }, commit)).toBe(false);
    expect(canFollowDeployment({ commit: "b".repeat(40), state: "running" }, commit)).toBe(false);
  });

  test("finds terminal history after a queued deployment replaces status", () => {
    const commit = "a".repeat(40);
    expect(terminalHistory([
      { commit, state: "accepted" },
      { commit, state: "succeeded" },
      { commit: "b".repeat(40), state: "running" },
    ], commit)).toEqual({ commit, state: "succeeded" });
  });

  test("uses exact commit tags and identity labels for uploaded images", () => {
    const commit = "a".repeat(40);
    const tree = "b".repeat(40);
    expect(prebuiltImage("example-com", commit)).toBe(`localhost/shibumi-server/upload/example-com:${commit}`);
    expect(prebuiltLabels("example-com", commit, "owner/repo", tree, "1.2.3")).toEqual({
      "dev.shibumistack.app-id": "example-com",
      "dev.shibumistack.source-tree": tree,
      "org.opencontainers.image.revision": commit,
      "org.opencontainers.image.source": "https://github.com/owner/repo",
      "org.opencontainers.image.version": "1.2.3",
    });
    expect(() => prebuiltImage("../bad", commit)).toThrow("invalid");
  });

  test("accepts deployment triggers and rejects mismatched webhook URLs", () => {
    const { trigger: _trigger, ...legacy } = config;
    expect(validateConfig(config)).toEqual(config);
    expect(validateConfig(legacy)).toEqual(config);
    expect(validateConfig({ ...config, trigger: "github-push" })).toMatchObject({ trigger: "github-push" });
    expect(() => validateConfig({ ...config, trigger: "other" })).toThrow("invalid");
    expect(() => validateConfig({ ...config, webhookUrl: "https://attacker.example/hook" })).toThrow("invalid");
  });
});
