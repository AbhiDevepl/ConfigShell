# =============================================================================
# configshell — mcp image (stdio transport)
#
# The stdio MCP server that an MCP host (Claude, ChatGPT, …) launches as a
# local subprocess: it speaks the protocol over stdin/stdout — it never opens a
# port. Containerized versions of such hosts launch it with `docker run -i`.
#
#   docker build -f docker/mcp.Dockerfile -t configshell-mcp .
#   docker run -i --rm configshell-mcp
#
# This is deliberately NOT a compose service: a stdio process belongs to the
# client that spawned it, not to a compose network, and starting one detached in
# `up -d` would hold a container open doing nothing. The HTTP MCP surface is
# served inside the server image instead (/mcp), happily container-native.
#
# tsx stays in the runtime here (it is a devDependency of @configshell/mcp and
# the entry point is `tsx src/bin.ts`), so this image installs the full
# dependency branch including dev dependencies — this is dev-facing tooling,
# not the web tier.
# =============================================================================

FROM node:22.23-alpine

ENV COREPACK_HOME=/opt/corepack
RUN corepack enable \
  && corepack prepare pnpm@12.3.4 --activate \
  && mkdir -p /opt/corepack \
  && chown -R node:node /opt/corepack

WORKDIR /app
ENV NODE_ENV=production

# Manifests + lockfile first for layer caching, then the four source trees the
# tool branch needs (the catalog and installer are its business logic; test-utils
# is a dev dependency). `./...` roots the filter at the mcp package.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/catalog/package.json ./packages/catalog/
COPY packages/installer/package.json ./packages/installer/
COPY packages/mcp/package.json ./packages/mcp/
COPY packages/test-utils/package.json ./packages/test-utils/
COPY packages/contract-tests/package.json ./packages/contract-tests/
COPY packages/catalog ./packages/catalog
COPY packages/installer ./packages/installer
COPY packages/mcp ./packages/mcp
COPY packages/test-utils ./packages/test-utils

RUN pnpm install --frozen-lockfile --filter @configshell/mcp... \
  && pnpm store prune \
  && chmod -R a+rX /app

USER node

# No HEALTHCHECK: the process is interactive and blocked on stdin more of the
# time than not; there is no port to probe. Its own readiness line goes to
# stderr (stdout carries protocol messages and must stay clean).
ENTRYPOINT ["pnpm", "--filter", "@configshell/mcp", "start"]