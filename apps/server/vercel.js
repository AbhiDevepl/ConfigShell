/**
 * Vercel serverless adapter.
 *
 * Exports the existing Express app for Vercel's Node.js runtime.
 * Static serving is disabled — Vercel serves apps/web/dist directly.
 */

import "tsx/esm";
import { createApp } from "./app.js";

const app = createApp({ webDist: null });

export default app;
