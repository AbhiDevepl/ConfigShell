/**
 * Configuration validation.
 *
 * `config/env.ts` reads `process.env` at import time, so each case re-imports
 * the module with a cache-busting query rather than trying to mutate an already
 * evaluated export.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, test } from "node:test";

const original = { PORT: process.env.PORT, NODE_ENV: process.env.NODE_ENV };

let counter = 0;
async function loadEnv(overrides) {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const module = await import(`./env.ts?case=${counter++}`);
  return module.env;
}

after(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("defaults are applied when nothing is set", async () => {
  const env = await loadEnv({ PORT: undefined, NODE_ENV: undefined });
  assert.equal(env.port, 3000);
  assert.equal(env.nodeEnv, "development");
});

test("an empty value falls back to the default rather than failing", async () => {
  const env = await loadEnv({ PORT: "", NODE_ENV: "" });
  assert.equal(env.port, 3000);
  assert.equal(env.nodeEnv, "development");
});

test("a valid port is parsed as a number", async () => {
  const env = await loadEnv({ PORT: "4000", NODE_ENV: "production" });
  assert.equal(env.port, 4000);
  assert.equal(env.nodeEnv, "production");
});

test("an invalid port fails startup loudly, with a pointer to the template", async () => {
  for (const port of ["0", "65536", "-1", "abc", "3.5", "8080abc"]) {
    await assert.rejects(
      () => loadEnv({ PORT: port }),
      (error) => {
        assert.match(error.message, /Invalid PORT/);
        assert.match(error.message, /\.env\.example/);
        return true;
      },
      `expected PORT="${port}" to be rejected`,
    );
  }
});

test("an unknown NODE_ENV fails startup rather than being ignored", async () => {
  await assert.rejects(() => loadEnv({ PORT: undefined, NODE_ENV: "staging" }), /Invalid NODE_ENV/);
});

test("no secret-shaped variable is read", () => {
  // The server declares no API keys, database URL or auth secret, because
  // nothing here implements a feature that needs one. If that changes, this
  // test should be updated in the same change that adds the feature.
  const source = readFileSync(new URL("./env.ts", import.meta.url), "utf8");
  for (const name of [
    "API_KEY",
    "SECRET",
    "TOKEN",
    "PASSWORD",
    "DATABASE_URL",
    "OPENAI",
    "ANTHROPIC",
    "GEMINI",
  ]) {
    assert.ok(!source.includes(name), `config/env.ts references ${name}`);
  }
});
