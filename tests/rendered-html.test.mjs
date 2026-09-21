import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Nuudo authentication boot shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Nuudo<\/title>/i);
  assert.match(html, /class="auth-shell auth-booting"/);
  assert.match(html, /aria-label="Cargando Nuudo"/);
  assert.match(html, /src="\/nuudo-icon\.png"/);
  assert.match(html, /class="auth-boot-line"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps the authentication boot shell scoped to AuthGate", async () => {
  const [authGate, css, page, layout] = await Promise.all([
    readFile(new URL("../features/auth/components/AuthGate.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(authGate, /authApi\s*\.me\(local\.token\)/);
  assert.match(authGate, /className="auth-shell auth-booting"/);
  assert.match(authGate, /src="\/nuudo-icon\.png"/);
  assert.match(authGate, /<AuthContext\.Provider/);
  assert.match(css, /\.auth-shell\.auth-booting\s*\{/);
  assert.match(css, /@keyframes auth-boot-pulse/);
  assert.match(css, /@keyframes auth-boot-line/);
  assert.match(page, /<InferApp\s*\/>/);
  assert.match(layout, /const title = "Nuudo"/);
  assert.match(layout, /<AuthGate>\{children\}<\/AuthGate>/);
  assert.doesNotMatch(authGate, /_sites-preview|codex-preview/i);
});

test("keeps optional tools between Business and Infer and exposes them only in query results", async () => {
  const [stepper, toolsPage, toolsDesk, resultTable, toolsApi] = await Promise.all([
    readFile(new URL("../features/setup/components/SetupStepper.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/setup/tools/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../features/tools/components/ToolsDesk.tsx", import.meta.url), "utf8"),
    readFile(new URL("../features/infer/components/QueryResultTable.tsx", import.meta.url), "utf8"),
    readFile(new URL("../features/tools/services/toolsApi.ts", import.meta.url), "utf8"),
  ]);

  assert.ok(stepper.indexOf('href: "/setup/knowledge"') < stepper.indexOf('href: "/setup/tools"'));
  assert.ok(stepper.indexOf('href: "/setup/tools"') < stepper.indexOf('href: "/setup/chat"'));
  assert.match(toolsPage, /<ToolsDesk\s*\/>/);
  assert.match(toolsDesk, /TOOL_CATALOG/);
  assert.match(toolsDesk, /tools\.optional/);
  assert.match(resultTable, /tools\.map/);
  assert.match(resultTable, /isToolCompatible/);
  assert.match(toolsApi, /\/api\/tools\/selection/);
});

test("recommends enabled tools while composing and carries the choice into inference", async () => {
  const [composer, recommendationHook, toolsApi, queryApi, resultTable, models] = await Promise.all([
    readFile(new URL("../features/infer/components/InferChat.tsx", import.meta.url), "utf8"),
    readFile(new URL("../features/tools/hooks/useToolRecommendations.ts", import.meta.url), "utf8"),
    readFile(new URL("../features/tools/services/toolsApi.ts", import.meta.url), "utf8"),
    readFile(new URL("../features/ontology-discovery/services/queryApi.ts", import.meta.url), "utf8"),
    readFile(new URL("../features/infer/components/QueryResultTable.tsx", import.meta.url), "utf8"),
    readFile(new URL("../features/tools/models.ts", import.meta.url), "utf8"),
  ]);

  assert.match(models, /"histogram"/);
  assert.match(models, /"route-map"/);
  assert.match(recommendationHook, /DEBOUNCE_MS/);
  assert.match(toolsApi, /\/api\/tools\/recommend/);
  assert.match(composer, /infer-tool-recommendations/);
  assert.match(composer, /attachedTools/);
  assert.match(queryApi, /preferredTools/);
  assert.match(resultTable, /automaticView/);
});
