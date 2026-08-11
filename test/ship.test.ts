import { describe, expect, test } from "bun:test";
import { appIdForDomain, domainFromProject, repositoryFromRemote, validateConfig } from "../scripts/ship";

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

  test("accepts server client config and rejects mismatched webhook URLs", () => {
    expect(validateConfig(config)).toEqual(config);
    expect(() => validateConfig({ ...config, webhookUrl: "https://attacker.example/hook" })).toThrow("invalid");
  });
});
