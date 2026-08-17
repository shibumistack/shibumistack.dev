import { describe, expect, test } from "bun:test";
import app, { icon, iconNames } from "../src/app";
import packageJson from "../package.json";

describe("routes", () => {
  test("serves homepage as HTML by default", async () => {
    const res = await app.request("/");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Simple.");
    expect(body).toContain("Yours");
    expect(body).toContain('<meta name="theme-color" content="#f7f3e8">');
    expect(body).toContain('<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f7f3e8">');
    expect(body).toContain('<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1e1510">');
    expect(body).toContain('<meta name="color-scheme" content="light dark">');
    expect(body).toContain('aria-label="Replay terminal animation"');
    expect(body).toContain("home-clack-done");
    expect(body).toContain("home-clack-rail");
    expect(body).toContain(`pinned v${packageJson.shibumiServerVersion} installer`);
  });

  test("negotiates Markdown only when preferred", async () => {
    const res = await app.request("/", {
      headers: { accept: "text/markdown" },
    });
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    expect(body).toContain("# Shibumi Stack");
    const htmlRes = await app.request("/", {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/markdown;q=0.1,*/*;q=0.8",
      },
    });

    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers.get("content-type")).toContain("text/html");
  });

  test("serves task-oriented documentation routes", async () => {
    const index = await app.request("/docs");
    const indexBody = await index.text();
    expect(index.status).toBe(200);
    expect(indexBody).toContain("Shibumi docs");
    expect(indexBody).toContain('class="docs-sidebar"');
    expect(indexBody).toContain('href="/docs/server/history-rollback"');
    expect(indexBody).toContain('href="/docs/decisions"');

    const server = await app.request("/docs/server");
    const serverBody = await server.text();
    expect(serverBody).toContain('class="docs-clack"');
    expect(serverBody).toContain("Built and uploaded a1b2c3d");
    expect(serverBody).toContain("https://shibumistack.dev/install/ship.sh");
    expect(serverBody).toContain("bun ship:setup");

    const deployments = await app.request("/docs/server/deployments");
    const deploymentsBody = await deployments.text();
    expect(deploymentsBody).toContain("Client pipeline");
    expect(deploymentsBody).toContain("Upload happens before Git push");
    expect(deploymentsBody).toContain("Prebuilt available memory: 512 MiB");

    const ship = await app.request("/docs/server/ship");
    const shipBody = await ship.text();
    expect(shipBody).toContain("checks mutable latest pointer against immutable reviewed source");
    expect(shipBody).toContain("bun ship --rebuild");

    const rollback = await app.request("/docs/server/history-rollback");
    const rollbackBody = await rollback.text();
    expect(rollback.status).toBe(200);
    expect(rollbackBody).toContain("History and rollback");
    expect(rollbackBody).toContain('<span class="syntax-command">shis</span> rollback example-com');
    expect(rollbackBody).toContain('class="docs-code docs-terminal"');
    expect(rollbackBody).toContain('href="/docs/server/history-rollback" aria-current="page"');

    const markdown = await app.request("/docs/server/history-rollback", { headers: { accept: "text/markdown" } });
    expect(markdown.status).toBe(200);
    expect(markdown.headers.get("content-type")).toContain("text/markdown");
    expect(await markdown.text()).toContain("# History and rollback");

    expect((await app.request("/docs/not-here")).status).toBe(404);
  });

  test("serves discovered HTML pages with Markdown alternates", async () => {
    const htmlRes = await app.request("/brand");
    const htmlBody = await htmlRes.text();

    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers.get("content-type")).toContain("text/html");
    expect(htmlBody).toContain("Quiet craft.");

    const markdownRes = await app.request("/brand", {
      headers: { accept: "text/markdown" },
    });
    const markdownBody = await markdownRes.text();

    expect(markdownRes.status).toBe(200);
    expect(markdownRes.headers.get("content-type")).toContain("text/markdown");
    expect(markdownBody).toContain("# Brand");
  });

  test("serves Markdown-only discovered pages", async () => {
    const res = await app.request("/dx");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    expect(body).toContain("# Shibumi Stack DX Plan");
  });

  test("opens direct Markdown links inline", async () => {
    const res = await app.request("/index.md");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(res.headers.get("content-disposition")).toBe("inline");
    expect(body).toContain("# Shibumi Stack");

    const readmeRes = await app.request("/README.md");
    const readmeBody = await readmeRes.text();

    expect(readmeRes.status).toBe(200);
    expect(readmeRes.headers.get("content-type")).toContain("text/plain");
    expect(readmeRes.headers.get("content-disposition")).toBe("inline");
    expect(readmeBody).toContain("shibumistack.dev");
  });

  test("serves 404 page for unknown routes", async () => {
    const res = await app.request("/not-here");
    const body = await res.text();

    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Nothing here.");
  });

  test("serves blog listing page", async () => {
    const res = await app.request("/blog");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Blog");
    expect(body).toContain("Dogfooding Shibumi");
  });

  test("serves individual blog posts", async () => {
    const res = await app.request("/blog/dogfooding");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Dogfooding Shibumi");
    expect(body).toContain("owned source");
    expect(body).toContain('<link rel="canonical" href="https://shibumistack.dev/blog/dogfooding/">');
    expect((await app.request("/blog/dogfooding/")).status).toBe(200);
  });

  test("returns 404 for unknown blog posts", async () => {
    const res = await app.request("/blog/not-a-post");

    expect(res.status).toBe(404);
  });

  test("serves the shibumi-server page and Markdown alternate", async () => {
    const htmlRes = await app.request("/server");
    const htmlBody = await htmlRes.text();

    expect(htmlRes.status).toBe(200);
    expect(htmlBody).toContain("No cloud deploy service");
    expect(htmlBody).toContain(`Open source · v${packageJson.shibumiServerVersion}`);
    expect(htmlBody).toContain(`Installed shibumi-server ${packageJson.shibumiServerVersion}`);
    expect(htmlBody).toContain("Bad images don't go live");
    expect(htmlBody).toContain("rootless Podman");
    expect(htmlBody).toContain("What do these checks mean?");
    expect(htmlBody.match(/class="deploy-step clack-row/g)?.length).toBe(7);
    expect(htmlBody).toContain("Build on your computer");
    expect(htmlBody).toContain("Built and uploaded a1b2c3d");
    expect(htmlBody).toContain("shis update");
    expect(htmlBody).toContain("checks for reviewed client source");
    expect(htmlBody).toContain("Dogfooding with MCPVault");
    expect(htmlBody).toContain("From project root: <strong>curl -fsSL https://shibumistack.dev/install/ship.sh | sh</strong>");
    expect(htmlBody).toContain("Connect from");
    expect(htmlBody).toContain("Missing container files can be generated");
    expect(htmlBody).toContain("bun ship:logs");
    expect(htmlBody).toContain("bun ship");
    expect(htmlBody).toContain("shibumi-server.json");
    expect(htmlBody).toContain('"curl -fsSL https://shibumistack.dev/install/server | bash"');
    expect(htmlBody).toContain('"curl -fsSL https://shibumistack.dev/install/ship.sh | sh"');
    expect(htmlBody.match(/aria-label="Replay terminal animation"/g)?.length).toBe(3);
    expect(htmlBody.match(/class="setup-step clack-row/g)?.length).toBe(12);
    expect(htmlBody.match(/shis <span>\(shibumi-server\)<\/span>/g)?.length).toBe(1);
    expect(htmlBody).toContain("渋み&nbsp; ship");
    expect(htmlBody).toContain('href="/server" aria-current="page"');
    expect(htmlBody).toContain('data-dialog="server-install-dialog"');
    expect(htmlBody).toContain("data-page-script");

    const markdownRes = await app.request("/server", {
      headers: { accept: "text/markdown" },
    });
    expect(markdownRes.status).toBe(200);
    const markdownBody = await markdownRes.text();
    expect(markdownBody).toContain("# shibumi-server");
    expect(markdownBody).toContain("build for the server's Linux platform on your computer");
    expect(markdownBody).toContain("reviewed client source");
  });

  test("serves existing-project ship guidance and versioned source", async () => {
    const page = await app.request("/ship");
    const body = await page.text();
    expect(page.status).toBe(200);
    expect(body).toContain("Ship an existing project");
    expect(body).toContain("https://shibumistack.dev/install/ship");
    expect(body).toContain("bun ship:setup");
    expect(body).toContain("If no tracked Compose file exists");
    expect(body).toContain("bun ship:logs");
    expect(body).toContain("bun ship --rollback");
    expect(body).toContain("bun ship --rebuild");
    expect(body).toContain("bun ship -y");
    expect(body).toContain("no <code>--</code> separator is needed");
    expect(body).toContain("shibumi-server.json");
    expect(body).toContain("data-ship-source");
    expect(body).toContain("syntax-keyword");
    expect(body).toContain('fetch("/ship/v30.ts")');
    expect(body).toContain("data-copy-code");
    expect(body).not.toContain('href="/ship/v12.ts"');
    expect(body).not.toContain('href="/ship" aria-current="page"');

    const markdown = await app.request("/ship", { headers: { accept: "text/markdown" } });
    expect(markdown.status).toBe(200);
    expect(await markdown.text()).toContain("# Ship an existing project");

    const source = await app.request("/ship/v30.ts");
    expect(source.status).toBe(200);
    expect(source.headers.get("content-type")).toContain("text/plain");
    expect(source.headers.get("cache-control")).toContain("immutable");
    const sourceBody = await source.text();
    expect(sourceBody).toContain("Project-owned client for shibumi-server");
    expect(sourceBody).toContain('const SERVER_CLI = "~/.local/bin/shibumi-server"');
    expect(sourceBody).toContain("export function domainFromProject");
    expect(sourceBody).toContain("export function runShipCli");
    expect(sourceBody).toContain("--rollback if needed");
    expect(sourceBody).toContain("dev.shibumistack.source-tree");
    expect(sourceBody).toContain('"--no-cache"');
    expect(sourceBody).toContain('["docker", "image", "rm", image]');
    expect(sourceBody).toContain("runLatestShipClient");
    expect(sourceBody).toContain("save it after a successful deployment");
    expect(sourceBody).toContain("How do you want to deploy?");
    expect(sourceBody).toContain("GitHub webhook disabled");
    expect(sourceBody).toContain("shouldTriggerRedeploy");
    expect(sourceBody).toContain("Ship cannot push");
    expect(sourceBody).not.toContain("note(");
    expect((await app.request("/ship/v1.ts")).status).toBe(200);
    expect((await app.request("/ship/v2.ts")).status).toBe(200);
    expect((await app.request("/ship/v3.ts")).status).toBe(200);
    expect((await app.request("/ship/v4.ts")).status).toBe(200);
    expect((await app.request("/ship/v5.ts")).status).toBe(200);
    expect((await app.request("/ship/v6.ts")).status).toBe(200);
    expect((await app.request("/ship/v7.ts")).status).toBe(200);
    expect((await app.request("/ship/v8.ts")).status).toBe(200);
    expect((await app.request("/ship/v9.ts")).status).toBe(200);
    expect((await app.request("/ship/v10.ts")).status).toBe(200);
    expect((await app.request("/ship/v11.ts")).status).toBe(200);
    expect((await app.request("/ship/v12.ts")).status).toBe(200);
    expect((await app.request("/ship/v13.ts")).status).toBe(200);
    expect((await app.request("/ship/v14.ts")).status).toBe(200);
    expect((await app.request("/ship/v15.ts")).status).toBe(200);
    expect((await app.request("/ship/v16.ts")).status).toBe(200);
    expect((await app.request("/ship/v17.ts")).status).toBe(200);
    expect((await app.request("/ship/v18.ts")).status).toBe(200);
    expect((await app.request("/ship/v19.ts")).status).toBe(200);
    expect((await app.request("/ship/v20.ts")).status).toBe(200);
    expect((await app.request("/ship/v21.ts")).status).toBe(200);
    expect((await app.request("/ship/v22.ts")).status).toBe(200);
    expect((await app.request("/ship/v23.ts")).status).toBe(200);
    expect((await app.request("/ship/v24.ts")).status).toBe(200);
    expect((await app.request("/ship/v25.ts")).status).toBe(200);
    expect((await app.request("/ship/v26.ts")).status).toBe(200);
    expect((await app.request("/ship/v27.ts")).status).toBe(200);
    expect((await app.request("/ship/v28.ts")).status).toBe(200);
    expect((await app.request("/ship/v29.ts")).status).toBe(200);
    expect((await app.request("/ship/v30.ts")).status).toBe(200);
    expect((await app.request("/ship/v999.ts")).status).toBe(404);
    const latest = await app.request("/ship/latest.ts");
    expect(latest.status).toBe(200);
    expect(latest.headers.get("cache-control")).toBe("no-cache");

    const installerRedirect = await app.request("/install/ship");
    expect(installerRedirect.status).toBe(302);
    expect(installerRedirect.headers.get("location")).toBe("/ship/install-v28.ts");
    const installer = await app.request("/ship/install-v28.ts");
    expect(installer.status).toBe(200);
    expect(installer.headers.get("cache-control")).toContain("immutable");
    const installerBody = await installer.text();
    expect(installerBody).toContain("First installation runs setup with Clack");
    expect(installerBody).toContain("ship/v30.ts");
    expect(installerBody).toContain("Setup files were kept so setup can resume");
    expect(installerBody).not.toContain("Installer changes were rolled back");
    expect(installerBody).toContain('"ship:update"');
    expect(installerBody).toContain('"ship:logs"');
    expect(installerBody).toContain('const devScript = "bun scripts/ship.ts --dev"');
    expect(installerBody).toContain('"--setup", ...process.argv.slice(2)');
    expect((await app.request("/ship/install-v1.ts")).status).toBe(200);
    expect((await app.request("/ship/install-v2.ts")).status).toBe(200);
    expect((await app.request("/ship/install-v27.ts")).status).toBe(200);
    expect((await app.request("/ship/install-v28.ts")).status).toBe(200);

    const bootstrapRedirect = await app.request("/install/ship.sh");
    expect(bootstrapRedirect.status).toBe(302);
    expect(bootstrapRedirect.headers.get("location")).toBe("/ship/bootstrap-v21.sh");
    const bootstrap = await app.request("/ship/bootstrap-v21.sh");
    expect(bootstrap.status).toBe(200);
    expect(bootstrap.headers.get("cache-control")).toContain("immutable");
    const bootstrapBody = await bootstrap.text();
    expect(bootstrapBody).toContain("ship/install-v28.ts");
    expect(bootstrapBody).toContain('bun "$temporary" "$@"');
    expect((await app.request("/ship/bootstrap-v1.sh")).status).toBe(200);
    expect((await app.request("/ship/bootstrap-v2.sh")).status).toBe(200);
    expect((await app.request("/ship/bootstrap-v20.sh")).status).toBe(200);
    expect((await app.request("/ship/bootstrap-v21.sh")).status).toBe(200);
  });

  test("redirects the server installer to its source", async () => {
    const res = await app.request("/install/server");

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(`https://raw.githubusercontent.com/bitbonsai/shibumi-server/v${packageJson.shibumiServerVersion}/install.sh`);
  });

  test("serves extensions page", async () => {
    const res = await app.request("/extensions");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Extensions");
    expect(body).toContain("shibumi add");
    expect(body).toContain("auth");
    expect(body).toContain("images");
    expect(body).toContain("email");
  });
});

describe("icons", () => {
  test("all discovered icons can be inlined", async () => {
    for (const name of await iconNames()) {
      const svg = await icon(name);

      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
    }
  });

  test("rejects unknown icon names", async () => {
    await expect(icon("../package" as never)).rejects.toThrow("Unknown icon");
  });

  test("all icon tokens used by templates are discovered", async () => {
    const files = [
      "src/layout.html",
      ...Array.from(new Bun.Glob("src/parts/*.html").scanSync(".")),
      ...Array.from(new Bun.Glob("src/pages/*.html").scanSync(".")),
    ];
    const availableIcons = await iconNames();
    const referenced = new Set<string>();

    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = await Bun.file(file).text();
      for (const match of content.matchAll(/{{icon\(([a-z0-9-]+)\)}}/g)) {
        const name = match[1];
        referenced.add(name);

        expect(availableIcons).toContain(name);
        await expect(icon(name)).resolves.toContain("<svg");
      }
    }

    expect(referenced.size).toBeGreaterThan(0);
  });
});
