import { describe, expect, test } from "bun:test";
import app from "../src/app";

describe("routes", () => {
  test("serves homepage as HTML by default", async () => {
    const res = await app.request("/");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Simple.");
    expect(body).toContain("Yours");
  });

  test("serves homepage as Markdown when requested", async () => {
    const res = await app.request("/", {
      headers: { accept: "text/markdown" },
    });
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    expect(body).toContain("# Shibumi Stack");
  });

  test("prefers HTML when browser Accept prefers HTML", async () => {
    const res = await app.request("/", {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/markdown;q=0.1,*/*;q=0.8",
      },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
  });

  test("serves brand Markdown when requested", async () => {
    const res = await app.request("/brand", {
      headers: { accept: "text/markdown" },
    });
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    expect(body).toContain("# Brand");
  });

  test("serves building page", async () => {
    const res = await app.request("/building");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Building in public");
  });

  test("serves docs decisions page", async () => {
    const res = await app.request("/docs");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(body).toContain("Technical decisions");
  });

  test("serves docs Markdown when requested", async () => {
    const res = await app.request("/docs", {
      headers: { accept: "text/markdown" },
    });
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/markdown");
    expect(body).toContain("# Shibumi Stack Docs");
  });

  test("opens direct Markdown links inline", async () => {
    const res = await app.request("/index.md");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(res.headers.get("content-disposition")).toBe("inline");
    expect(body).toContain("# Shibumi Stack");
  });

  test("serves full DX plan inline", async () => {
    const res = await app.request("/dx.md");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(res.headers.get("content-disposition")).toBe("inline");
    expect(body).toContain("# Shibumi Stack DX Plan");
  });

  test("serves direct docs Markdown inline", async () => {
    const res = await app.request("/docs.md");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(res.headers.get("content-disposition")).toBe("inline");
    expect(body).toContain("# Shibumi Stack Docs");
  });
});
