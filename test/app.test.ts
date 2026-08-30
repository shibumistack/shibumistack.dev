import { describe, expect, test } from "bun:test";
import app, { icon, iconNames } from "../src/app";
import packageJson from "../package.json";

describe("routes", () => {
  test("serves homepage as HTML by default", async () => {
    const res = await app.request("/");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Simple apps,");
    expect(body).toContain("whole stack");
    expect(body).toContain('<meta name="theme-color" content="#f5f0e4">');
    expect(body).not.toContain('theme-color" media=');
    expect(body).toContain('<meta name="color-scheme" content="light dark">');
    expect(body).toContain('aria-label="Replay terminal animation"');
    expect(body).toContain("home-clack-done");
    expect(body).toContain("home-clack-rail");
    expect(body).toContain("Shibumi Forms");
    expect(body).toContain("shibumi-server");
    expect(body).toContain("coding agents");
    expect(body).toContain("get release updates");
  });

  test("shows create command and CLI page", async () => {
    const home = await app.request("/");
    const homeBody = await home.text();

    expect(homeBody).toContain('<button class="nav-cta" type="button" data-dialog="install-dialog">Create project</button>');
    expect(homeBody).toContain('data-copy="bun create shibumi@latest my-app"');

    const cli = await app.request("/getnotified");
    const cliBody = await cli.text();
    expect(cli.status).toBe(200);
    expect(cliBody).toContain("The CLI is available");
    expect(cliBody).toContain("create-shibumi");
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
    expect(indexBody).toContain('href="/docs/index.md">Markdown for agents</a>');

    const forms = await app.request("/docs/forms");
    const formsBody = await forms.text();
    expect(forms.status).toBe(200);
    expect(formsBody).toContain("Connect a page");
    expect(formsBody).toContain('href="/docs/forms.md">Markdown for agents</a>');

    const server = await app.request("/docs/server");
    const serverBody = await server.text();
    expect(serverBody).toContain('class="docs-clack"');
    expect(serverBody).toContain("Built and uploaded a1b2c3d");
    expect(serverBody).toContain("https://shibumistack.dev/install/ship.sh");
    expect(serverBody).toContain("bun ship:setup");

    const deployments = await app.request("/docs/server/deployments");
    const deploymentsBody = await deployments.text();
    expect(deploymentsBody).toContain("Client pipeline");
    expect(deploymentsBody).toContain("The upload happens before the Git push");
    expect(deploymentsBody).toContain("Prebuilt available memory: 512 MiB");

    const ship = await app.request("/docs/server/ship");
    const shipBody = await ship.text();
    expect(shipBody).toContain("checks mutable latest pointer against immutable reviewed source");
    expect(shipBody).toContain("bun ship --rebuild");

    const troubleshooting = await app.request("/docs/ship/troubleshooting");
    const troubleshootingBody = await troubleshooting.text();
    expect(troubleshooting.status).toBe(200);
    expect(troubleshootingBody).toContain('id="docker-engine"');
    expect(troubleshootingBody).toContain("https://shibumistack.dev/ship/latest.ts");
    const troubleshootingMarkdown = await app.request("/docs/ship/troubleshooting.md");
    expect(troubleshootingMarkdown.status).toBe(200);
    const troubleshootingSource = await troubleshootingMarkdown.text();
    expect(troubleshootingSource).toContain("colima restart");
    expect(troubleshootingSource).toContain("podman machine restart");

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

    const directMarkdown = await app.request("/docs/server/history-rollback.md");
    expect(directMarkdown.status).toBe(200);
    expect(directMarkdown.headers.get("content-type")).toContain("text/plain");
    expect(directMarkdown.headers.get("content-disposition")).toBe("inline");
    expect(await directMarkdown.text()).toContain("# History and rollback");

    expect((await app.request("/docs/not-here")).status).toBe(404);
    expect((await app.request("/docs/not-here.md")).status).toBe(404);
  });

  test("serves discovered HTML pages with Markdown alternates", async () => {
    const htmlRes = await app.request("/brand");
    const htmlBody = await htmlRes.text();

    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers.get("content-type")).toContain("text/html");
    expect(htmlBody).toContain("Use the supplied files");

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
    expect(body).toContain("# create-shibumi design and acceptance");
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

    const llms = await app.request("/llms.txt");
    const llmsBody = await llms.text();
    expect(llms.status).toBe(200);
    expect(llmsBody).toContain("[Forms overview](/docs/forms.md)");
    expect(llmsBody).toContain("[CLI](/docs/cli.md)");
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
    expect(body).toContain("Most of the time, a few lines won");
    expect(body).toContain('<link rel="canonical" href="https://shibumistack.dev/blog/dogfooding/">');
    expect((await app.request("/blog/dogfooding/")).status).toBe(200);
  });

  test("returns 404 for unknown blog posts", async () => {
    const res = await app.request("/blog/not-a-post");

    expect(res.status).toBe(404);
  });

  test("serves Shibumi Forms page and Markdown alternate", async () => {
    const htmlRes = await app.request("/forms");
    const htmlBody = await htmlRes.text();

    expect(htmlRes.status).toBe(200);
    expect(htmlBody).toContain("Post HTML forms to one endpoint");
    expect(htmlBody).toContain("Hosted pre-alpha is live");
    expect(htmlBody).toContain("forms.shibumistack.dev/f/your-id");
    expect(htmlBody).toContain('<details class="stack-menu">');
    expect(htmlBody).toContain('href="https://shibumistack.dev" aria-current="page"');
    expect(htmlBody).toContain('href="https://forms.shibumistack.dev"');
    expect(htmlBody).toContain('href="https://server.shibumistack.dev"');

    const markdownRes = await app.request("/forms", { headers: { accept: "text/markdown" } });
    expect(markdownRes.status).toBe(200);
    expect(markdownRes.headers.get("content-type")).toContain("text/markdown");
    expect(await markdownRes.text()).toContain("# Shibumi Forms");
  });

  test("serves the shibumi-server page and Markdown alternate", async () => {
    const htmlRes = await app.request("/server");
    const htmlBody = await htmlRes.text();

    expect(htmlRes.status).toBe(200);
    expect(htmlBody).toContain("One service behind");
    expect(htmlBody).toContain(`Open source · v${packageJson.shibumiServerVersion}`);
    expect(htmlBody).toContain(`Installed shibumi-server ${packageJson.shibumiServerVersion}`);
    expect(htmlBody).toContain("Check identity and health");
    expect(htmlBody).toContain("rootless Podman");
    expect(htmlBody).toContain("Checks run before replacement");
    expect(htmlBody.match(/class="deploy-step clack-row/g)?.length).toBe(7);
    expect(htmlBody).toContain("Build committed code on your computer");
    expect(htmlBody).toContain("Built and uploaded a1b2c3d");
    expect(htmlBody).toContain("shis update");
    expect(htmlBody).toContain("newer reviewed client source");
    expect(htmlBody).toContain("A failed build changed the design");
    expect(htmlBody).toContain("From project root: <strong>curl -fsSL https://shibumistack.dev/install/ship.sh | sh</strong>");
    expect(htmlBody).toContain("Connect from");
    expect(htmlBody).toContain("When container files are missing");
    expect(htmlBody).toContain("bun ship:logs");
    expect(htmlBody).toContain("shis caddy-refresh &lt;app-id&gt;");
    expect(htmlBody).toContain("retries the loopback upstream for up to 20 seconds");
    expect(htmlBody).toContain("bun ship");
    expect(htmlBody).toContain("shibumi-server.json");
    expect(htmlBody).toContain('"curl -fsSL https://shibumistack.dev/install/server | bash"');
    expect(htmlBody).toContain('"curl -fsSL https://shibumistack.dev/install/ship.sh | sh"');
    expect(htmlBody.match(/aria-label="Replay terminal animation"/g)?.length).toBe(3);
    expect(htmlBody.match(/class="setup-step clack-row/g)?.length).toBe(12);
    expect(htmlBody.match(/shis <span>\(shibumi-server\)<\/span>/g)?.length).toBe(1);
    expect(htmlBody).toContain("渋み&nbsp; ship");
    expect(htmlBody).toContain('href="https://shibumistack.dev" aria-current="page"');
    expect(htmlBody).toContain('data-dialog="server-install-dialog"');
    expect(htmlBody).toContain("data-page-script");

    const markdownRes = await app.request("/server", {
      headers: { accept: "text/markdown" },
    });
    expect(markdownRes.status).toBe(200);
    const markdownBody = await markdownRes.text();
    expect(markdownBody).toContain("# shibumi-server");
    expect(markdownBody).toContain("builds committed `HEAD` for the server's Linux platform");
    expect(markdownBody).toContain("immutable reviewed source");
    expect(markdownBody).toContain("shis caddy-refresh <app-id>");
  });

  test("serves existing-project ship guidance and versioned source", async () => {
    const page = await app.request("/ship");
    const body = await page.text();
    expect(page.status).toBe(200);
    expect(body).toContain("Ship an existing project");
    expect(body).toContain("https://shibumistack.dev/install/ship");
    expect(body).toContain("bun ship:setup");
    expect(body).toContain("When no tracked Compose file exists");
    expect(body).toContain("bun ship:logs");
    expect(body).toContain("bun ship:status");
    expect(body).toContain("bun ship --rollback");
    expect(body).toContain("bun ship --rebuild");
    expect(body).toContain("bun ship -y");
    expect(body).toContain("no <code>--</code> separator is needed");
    expect(body).toContain("shibumi-server.json");
    expect(body).toContain("github.com/shibumistack/create-shibumi/blob/main/src/templates/ship.ts");
    expect(body).toContain("data-copy-code");
    expect(body).not.toContain('href="/ship/v12.ts"');
    expect(body).not.toContain('href="/ship" aria-current="page"');

    const markdown = await app.request("/ship", { headers: { accept: "text/markdown" } });
    expect(markdown.status).toBe(200);
    expect(await markdown.text()).toContain("# Ship an existing project");

    const source = await app.request("/ship/v51.ts");
    expect(source.status).toBe(200);
    expect(source.headers.get("content-type")).toContain("text/plain");
    expect(source.headers.get("cache-control")).toContain("immutable");
    const sourceBody = await source.text();
    expect(sourceBody).toContain("Project-owned client for shibumi-server");
    expect(sourceBody).toContain('const SERVER_CLI = "~/.local/bin/shibumi-server"');
    expect(sourceBody).toContain("export function domainFromProject");
    expect(sourceBody).toContain("export function runShipCli");
    expect(sourceBody).toContain("export function formatDevStartup");
    expect(sourceBody).toContain('const CURRENT_SOURCE = "https://shibumistack.dev/ship/v51.ts"');
    expect(sourceBody).toContain("Docker cannot reach your container engine.");
    expect(sourceBody).toContain("https://shibumistack.dev/docs/ship/troubleshooting#docker-engine");
    expect(sourceBody).toContain("the Docker socket refused your user");
    expect(sourceBody).toContain("sg docker -c");
    expect(sourceBody).toContain("Ship now?");
    expect(sourceBody).toContain("dev.shibumistack.static.output");
    expect(sourceBody).toContain("What are you shipping?");
    expect(sourceBody).toContain("--rollback if needed");
    expect(sourceBody).toContain("dev.shibumistack.source-tree");
    expect(sourceBody).toContain('"--no-cache"');
    expect(sourceBody).toContain('["docker", "image", "rm", image]');
    expect(sourceBody).toContain('["docker-compose"]');
    expect(sourceBody).toContain('["docker", "buildx", "version"]');
    expect(sourceBody).toContain("brew install docker-buildx");
    expect(sourceBody).toContain("Docker Desktop: open or restart Docker Desktop");
    expect(sourceBody).not.toContain("docker-desktop://");
    expect(sourceBody).toContain("runLatestShipClient");
    expect(sourceBody).toContain("save it after a successful deployment");
    // v48: the setup-time trigger question is gone, replaced by a plan block,
    // one "Run setup?" confirm, and ship:webhook as the opt-in for push deploys.
    expect(sourceBody).not.toContain("How do you want to deploy?");
    expect(sourceBody).toContain("export function setupPlanLines");
    expect(sourceBody).toContain("Run setup?");
    expect(sourceBody).toContain("Deploys run on: ");
    expect(sourceBody).toContain('"ship:webhook": "bun scripts/ship.ts --webhook"');
    expect(sourceBody).toContain("Undo: bun ship:webhook --off");
    expect(sourceBody).toContain("GitHub webhook disabled");
    expect(sourceBody).toContain("shouldTriggerRedeploy");
    expect(sourceBody).toContain("Ship cannot push");
    expect(sourceBody).not.toContain("note(");
    // Retention window: current + previous two (v49/v50/v51) stay; older
    // releases are pruned (installers and bootstraps keep current only).
    expect((await app.request("/ship/v49.ts")).status).toBe(200);
    expect((await app.request("/ship/v50.ts")).status).toBe(200);
    expect((await app.request("/ship/v1.ts")).status).toBe(404);
    expect((await app.request("/ship/v39.ts")).status).toBe(404);
    expect((await app.request("/ship/v48.ts")).status).toBe(404);
    expect((await app.request("/ship/v999.ts")).status).toBe(404);
    const latest = await app.request("/ship/latest.ts");
    expect(latest.status).toBe(200);
    expect(latest.headers.get("cache-control")).toBe("no-cache");
    expect(await latest.text()).toBe(sourceBody);

    const installerRedirect = await app.request("/install/ship");
    expect(installerRedirect.status).toBe(302);
    expect(installerRedirect.headers.get("location")).toBe("/ship/install-v48.ts");
    const installer = await app.request("/ship/install-v48.ts");
    expect(installer.status).toBe(200);
    expect(installer.headers.get("cache-control")).toContain("immutable");
    const installerBody = await installer.text();
    expect(installerBody).toContain("First installation runs setup with Clack");
    expect(installerBody).toContain("ship/v51.ts");
    expect(installerBody).not.toContain("ship/v48.ts");
    expect(installerBody).not.toContain("ship/v50.ts");
    expect(installerBody).toContain("Setup files were kept so setup can resume");
    expect(installerBody).not.toContain("Installer changes were rolled back");
    expect(installerBody).toContain('"ship:update"');
    expect(installerBody).toContain('"ship:logs"');
    expect(installerBody).toContain('"ship:status"');
    expect(installerBody).toContain('"ship:webhook": "bun scripts/ship.ts --webhook"');
    expect(installerBody).toContain('const devScript = "bun scripts/ship.ts --dev"');
    expect(installerBody).toContain('"--setup", ...process.argv.slice(2)');
    expect((await app.request("/ship/install-v1.ts")).status).toBe(404);
    expect((await app.request("/ship/install-v38.ts")).status).toBe(404);
    expect((await app.request("/ship/install-v47.ts")).status).toBe(404);

    const bootstrapRedirect = await app.request("/install/ship.sh");
    expect(bootstrapRedirect.status).toBe(302);
    expect(bootstrapRedirect.headers.get("location")).toBe("/ship/bootstrap-v30.sh");
    const bootstrap = await app.request("/ship/bootstrap-v30.sh");
    expect(bootstrap.status).toBe(200);
    expect(bootstrap.headers.get("cache-control")).toContain("immutable");
    const bootstrapBody = await bootstrap.text();
    expect(bootstrapBody).toContain("ship/install-v48.ts");
    expect(bootstrapBody).toContain('bun "$temporary" "$@"');
    expect((await app.request("/ship/bootstrap-v1.sh")).status).toBe(404);
    expect((await app.request("/ship/bootstrap-v27.sh")).status).toBe(404);
    expect((await app.request("/ship/bootstrap-v28.sh")).status).toBe(404);
    expect((await app.request("/ship/bootstrap-v29.sh")).status).toBe(404);
    expect((await app.request("/ship/bootstrap-v30.sh")).status).toBe(200);
  });

  test("redirects the server installer to its source", async () => {
    const res = await app.request("/install/server");

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(`https://raw.githubusercontent.com/shibumistack/shibumi-server/v${packageJson.shibumiServerVersion}/install.sh`);
  });

  test("extensions moved into the docs", async () => {
    const stub = await app.request("/extensions");
    expect(stub.status).toBe(200);
    expect(await stub.text()).toContain("/docs/cli/extensions");

    const res = await app.request("/docs/cli/extensions");
    const body = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Extensions");
    expect(body).toContain("bun shi add");
    expect(body).toContain("auth");
    expect(body).toContain("uploads");
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
