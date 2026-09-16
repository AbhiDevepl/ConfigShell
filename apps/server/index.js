/**
 * API server entry point.
 *
 * Scaffold status: this starts an Express process and nothing else. There are
 * no routes, controllers, or services wired up yet — the directories for them
 * exist but their files are empty. The web app does not call this server.
 * See docs/architecture.md before adding endpoints here.
 */

import express from "express";

import { env } from "./config/index.js";

const app = express();

app.listen(env.port, () => {
  console.log(`[server] listening on port ${env.port} (${env.nodeEnv})`);
});
