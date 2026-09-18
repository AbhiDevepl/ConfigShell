# =============================================================================
# configshell — web image (optional reverse-proxy front)
#
# Used only with `docker compose -f compose.yml -f compose.web.yml up -d`.
# The default deployment skips nginx entirely: the server container already
# serves the same built bundle (see docker/server.Dockerfile). Both surfaces
# share apps/web/dist, so both are built here the same way.
#
# This image has two jobs, both of which are deployment concerns and nothing
# more — no business logic lives here:
#   1. serve the static SPA build,
#   2. reverse-proxy /api/* and /mcp to the `server` container so the browser
#      stays on one origin (docker/nginx.conf).
# =============================================================================

# ---------------------------------------------------------------- build stage
FROM node:22.23-alpine AS build

ENV COREPACK_HOME=/opt/corepack
RUN corepack enable \
  && corepack prepare pnpm@12.3.4 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/catalog/package.json ./packages/catalog/
COPY packages/installer/package.json ./packages/installer/
COPY packages/mcp/package.json ./packages/mcp/
COPY packages/test-utils/package.json ./packages/test-utils/
COPY packages/contract-tests/package.json ./packages/contract-tests/

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# -------------------------------------------------------------- nginx stage
# The unprivileged variant: nginx runs as UID 101 rather than a root master
# with dropped workers, so nothing in this tier ever holds root. It listens on
# 8080 (see docker/nginx.conf) because an unprivileged process cannot bind 80.
FROM nginxinc/nginx-unprivileged:alpine

# The bundle, nothing else.
USER root
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
RUN chmod -R a+rX /usr/share/nginx/html

# Replace nginx's default server with the ConfigShell one. The proxy upstream
# `server` resolves through the compose network (docker compose DNS).
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
USER nginx

EXPOSE 8080

# The HTML contains this marker regardless of view, so this checks that nginx
# is up AND serving the actual app, not a default page.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:8080/ | grep -q '<div id="root">' || exit 1