/**
 * Environment configuration for the API server.
 *
 * Every environment variable the server reads is declared here, with its
 * default, and is validated at startup. Invalid configuration fails loudly and
 * immediately rather than producing a server that listens on a surprising port
 * or runs in a surprising mode.
 *
 * Variables are documented in `apps/server/.env.example`. Copy that file to
 * `apps/server/.env` for local development; `.env` is git-ignored.
 */

import dotenv from "dotenv";

// `quiet` suppresses dotenv's startup banner; a missing .env is not an error
// here, since every variable below has a default.
dotenv.config({ quiet: true });

const DEFAULT_PORT = 3000;
const VALID_NODE_ENVS = ["development", "test", "production"];
const DEFAULT_MCP_PATH = "/mcp";

function readPort(raw: string | undefined) {
  if (raw === undefined || raw === "") return DEFAULT_PORT;

  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid PORT: "${raw}". Expected an integer between 1 and 65535. ` +
        `See apps/server/.env.example.`,
    );
  }
  return port;
}

function readNodeEnv(raw: string | undefined) {
  if (raw === undefined || raw === "") return "development";

  if (!VALID_NODE_ENVS.includes(raw)) {
    throw new Error(
      `Invalid NODE_ENV: "${raw}". Expected one of ${VALID_NODE_ENVS.join(", ")}. ` +
        `See apps/server/.env.example.`,
    );
  }
  return raw;
}

/**
 * Where the MCP endpoint is mounted.
 *
 * `/mcp` by default because that is the path both Claude and ChatGPT's
 * documentation use in their examples, so it is what a user pasting a URL will
 * expect. Configurable because the path is deployment topology, not business
 * logic — a reverse proxy or a future multi-tenant layout may need it
 * elsewhere, and that must not require a code change.
 */
function readMcpPath(raw: string | undefined) {
  if (raw === undefined || raw === "") return DEFAULT_MCP_PATH;

  if (!raw.startsWith("/") || raw === "/" || raw.endsWith("/")) {
    throw new Error(
      `Invalid MCP_PATH: "${raw}". Expected an absolute path with no trailing ` +
        `slash, such as "/mcp". See apps/server/.env.example.`,
    );
  }
  // The MCP endpoint is mounted before the API router and the SPA fallback, so
  // a path that collided with either would silently shadow it.
  if (raw === "/api" || raw.startsWith("/api/") || raw === "/health") {
    throw new Error(
      `Invalid MCP_PATH: "${raw}" collides with a reserved route. ` +
        `Choose a path outside /api and /health.`,
    );
  }
  return raw;
}

/**
 * The canonical public origin this deployment is reachable at.
 *
 * Used only to *derive and display* the public MCP URL — in the health
 * payload, in documentation and in whatever the web app eventually shows a
 * user who wants to connect an AI host. Nothing routes on it, so a wrong value
 * misreports a URL rather than breaking the server.
 *
 * Deliberately **not** defaulted from a platform-supplied deployment URL such
 * as `VERCEL_URL`: that value changes per deployment, so a user who copied it
 * into an AI host would find their connector broken by the next push. A
 * canonical public URL is a decision, and an operator has to make it.
 */
function readPublicBaseUrl(raw: string | undefined, port: number) {
  if (raw === undefined || raw === "") return `http://localhost:${port}`;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(
      `Invalid PUBLIC_BASE_URL: "${raw}". Expected an absolute URL such as ` +
        `https://configshell.example. See apps/server/.env.example.`,
    );
  }
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error(
      `Invalid PUBLIC_BASE_URL: "${raw}". Remote MCP hosts require https, so a ` +
        `non-localhost origin must use it.`,
    );
  }
  // Stored without a trailing slash so `${base}${path}` never doubles one.
  return parsed.origin;
}

const port = readPort(process.env.PORT);
const publicBaseUrl = readPublicBaseUrl(process.env.PUBLIC_BASE_URL, port);
const mcpPath = readMcpPath(process.env.MCP_PATH);

export const env = {
  port,
  nodeEnv: readNodeEnv(process.env.NODE_ENV),
  mcpPath,
  publicBaseUrl,
  /**
   * The URL an external AI host connects to, derived rather than configured
   * separately so the two halves can never disagree.
   */
  publicMcpUrl: `${publicBaseUrl}${mcpPath}`,
};
