# =============================================================================
# configshell — server image
#
# One container serves the whole product, exactly as `pnpm build && pnpm start`
# does on a development machine. The Express application (apps/server) already
# decides the topology; the image only packages it:
#
#   /            the built web app (static, from apps/web/dist)
#   /api/*       the read-only planning API
#   /mcp         the MCP server over Streamable HTTP   (path = MCP_PATH)
#
# A separate web/nginx tier is also provided (docker/web.Dockerfile +
# compose.web.yml) for setups that want a reverse proxy in front, but this
# single container is the default because it is what the architecture is.
#
# Splitting the MCP endpoint into its own container was considered and rejected
# here: the MCP server shares the
# catalog, the resolver and the process with the API, has no independent
# scaling story, and a second container would double the deploy surface to gain
# nothing. The stdio transport (the "local agent" surface) is packaged
# separately in docker/mcp.Dockerfile — see docs/deployment.md.
# =============================================================================

# ---------------------------------------------------------------- build stage
FROM node:22.23-alpine AS build

# corepack pins pnpm to the version declared in package.json's packageManager
# field, so the image resolves dependencies with exactly the pnpm the lockfile
# was written by. COREPACK_HOME keeps the prepared copy on a world-readable
# path that the runtime stage can reuse after it drops privileges.
ENV COREPACK_HOME=/opt/corepack
RUN corepack enable \
  && corepack prepare pnpm@12.3.4 --activate

WORKDIR /app

# Manifests and the lockfile first: this layer is cached until a dependency
# actually changes, so ordinary source edits do not reinstall the world. Every
# workspace package.json is copied because `pnpm install --frozen-lockfile`
# verifies all lockfile importers against their manifests.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/catalog/package.json ./packages/catalog/
COPY packages/installer/package.json ./packages/installer/
COPY packages/mcp/package.json ./packages/mcp/
COPY packages/test-utils/package.json ./packages/test-utils/
COPY packages/contract-tests/package.json ./packages/contract-tests/

RUN pnpm install --frozen-lockfile

# Full source, then the only artifact this stage must produce: the built web
# app. Vite bundles `@configshell/catalog` in, so apps/web/dist is standalone.
COPY . .
RUN pnpm build

# -------------------------------------------------------------- runtime stage
FROM node:22.23-alpine AS runtime

ENV COREPACK_HOME=/opt/corepack
RUN corepack enable \
  && corepack prepare pnpm@12.3.4 --activate \
  && mkdir -p /opt/corepack \
  && chown -R node:node /opt/corepack

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Runtime dependencies only. The server is TypeScript executed by `tsx` with no
# build step — the repository's deliberate choice, since the workspace packages
# publish TypeScript source directly — so tsx is a production dependency here
# rather than a dev convenience. The filtered prod install rebuilds the
# workspace links from the lockfile for exactly the packages this process needs.
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=build /app/apps/server ./apps/server
COPY --from=build /app/packages/catalog ./packages/catalog
COPY --from=build /app/packages/installer ./packages/installer
COPY --from=build /app/packages/mcp ./packages/mcp
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
# Only the built output of the web app — no sources, no node_modules.
COPY --from=build /app/apps/web/dist ./apps/web/dist

RUN pnpm install --frozen-lockfile --prod --filter server... \
  && pnpm store prune

# Two cleanups in one layer.
#
# 1. Drop the test files and package READMEs that came along with the workspace
#    source trees. A production image has no business carrying test code: it is
#    never imported (every `.test(` in the runtime source is a regex call, not
#    an import) and it is attack surface and confusion for no benefit.
# 2. COPY preserves the host's source file modes; normalize so the unprivileged
#    runtime user can read everything it needs regardless of the working copy's
#    permissions (e.g. a checkout that landed with mode 0600 on a manifest).
RUN find ./apps ./packages -name '*.test.ts' -not -path '*/node_modules/*' -delete \
  && find ./apps ./packages -name '*.md' -not -path '*/node_modules/*' -delete \
  && chmod -R a+rX /app

# `node` is created by the base image. Running unprivileged is not optional:
# this process generates installation commands as text and must never be in a
# position to run one.
USER node

EXPOSE 3000

# The server handles SIGTERM/SIGINT itself (index.ts closes the listener before
# exiting), so it must be the process that receives the signal. Exec form =
# no wrapping shell.
CMD ["pnpm", "--filter", "server", "start"]