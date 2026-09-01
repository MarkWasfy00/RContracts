# syntax=docker/dockerfile:1

# ─── Stage 1: build the frontend ──────────────────────────────────
FROM node:24-alpine AS build

WORKDIR /app

# Install with the lockfile first so this layer is cached until the
# dependencies actually change.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Stage 2: runtime ─────────────────────────────────────────────
FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000 \
    DATA_DIR=/app/data \
    CLIENT_DIST=/app/dist

# The server's own dependencies (express + cors) — no dev deps needed.
COPY server/package.json server/package-lock.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev
WORKDIR /app

COPY server/src ./server/src
COPY --from=build /app/dist ./dist

# The database directory is a mount point for a volume. Creating it with
# the right owner here means the volume inherits that ownership, so the
# unprivileged user can write to it.
RUN mkdir -p /app/data && chown -R node:node /app/data

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/src/index.js"]
