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

function readPort(raw) {
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

function readNodeEnv(raw) {
  if (raw === undefined || raw === "") return "development";

  if (!VALID_NODE_ENVS.includes(raw)) {
    throw new Error(
      `Invalid NODE_ENV: "${raw}". Expected one of ${VALID_NODE_ENVS.join(", ")}. ` +
        `See apps/server/.env.example.`,
    );
  }
  return raw;
}

export const env = {
  port: readPort(process.env.PORT),
  nodeEnv: readNodeEnv(process.env.NODE_ENV),
};
