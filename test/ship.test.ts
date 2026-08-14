import { describe, expect, test } from "bun:test";
import { appIdForDomain, canFollowDeployment, composeFileFromTracked, domainFromProject, isAgentExecution, matchingWebhook, missingComposeMessage, parseShipArgs, repositoryFromRemote, terminalHistory, validateConfig } from "../scripts/ship";

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
  healthPath: "/healthz",
  cutoverRequired: false,
} as const;

describe("ship configuration", () => {
  test("detects agent and non-interactive execution", () => {
    expect(isAgentExecution({ PI_CODING_AGENT: "true" }, true, true)).toBeTrue();
    expect(isAgentExecution({}, false, true)).toBeTrue();
    expect(isAgentExecution({}, true, true)).toBeFalse();
  });

  test("parses explicit automation options", () => {
    expect(parseShipArgs(["--", "--yes", "--server", "deploy@example-vps", "--domain", "app.example.com"])).toEqual({
      setup: false,
      update: false,
      yes: true,
      server: "deploy@example-vps",
      domain: "app.example.com",
    });
    expect(() => parseShipArgs(["--yes", "--server"])).toThrow("--server requires a value");
    expect(() => parseShipArgs(["--yes", "--wat"])).toThrow("unknown ship option");
  });

  test("derives collision-free app IDs and GitHub repositories", () => {
    expect(appIdForDomain("something-some.org")).toBe("something--some-org");
    expect(repositoryFromRemote("git@github.com:owner/repo.git")).toBe("owner/repo");
    expect(repositoryFromRemote("https://github.com/owner/repo.git")).toBe("owner/repo");
  });

  test("infers a domain from project name or Compose SITE_URL", () => {
    expect(domainFromProject("example.com", "")).toBe("example.com");
    expect(domainFromProject("vibetoolbox", "    SITE_URL: https://vibetoolbox.dev\n")).toBe("vibetoolbox.dev");
    expect(domainFromProject("app", "    - SITE_URL=https://preview.example.com/path\n")).toBe("preview.example.com");
    expect(domainFromProject("app", "    SITE_URL: http://localhost:3000\n")).toBeUndefined();
  });

  test("distinguishes healthy and failed matching webhooks", () => {
    const hook = { id: 42, active: true, config: { url: config.webhookUrl }, last_response: { code: 401 } };
    expect(matchingWebhook([hook], config.webhookUrl)).toEqual({ id: 42, needsRepair: true });
    expect(matchingWebhook([{ ...hook, last_response: { code: 200 } }], config.webhookUrl)).toEqual({ id: 42, needsRepair: false });
    expect(matchingWebhook([{ ...hook, last_response: { code: 0 } }], config.webhookUrl)).toEqual({ id: 42, needsRepair: false });
    expect(matchingWebhook([hook], "https://example.com/other")).toBeUndefined();
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

  test("accepts server client config and rejects mismatched webhook URLs", () => {
    expect(validateConfig(config)).toEqual(config);
    expect(() => validateConfig({ ...config, webhookUrl: "https://attacker.example/hook" })).toThrow("invalid");
  });
});
