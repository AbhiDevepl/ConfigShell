/**
 * Static file server for the production build (`pnpm --filter web start`).
 *
 * Serves `apps/web/dist`, falling back to `index.html` so client-side routes
 * resolve. Run `pnpm --filter web build` first — this server does not build.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;
const distDir = path.join(__dirname, 'dist');
const app = express();

app.use(express.static(distDir));

// SPA fallback: any GET/HEAD that did not match a file gets index.html.
// Written as middleware rather than a wildcard route so it behaves the same
// across Express versions.
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[web] serving ${distDir} on ${port}`);
});
