# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# TechQuest production image — multi-stage.
#
# The build compiles the shared package, the Prisma client, the Express API, and
# the React (Vite) frontend. The runtime image is a slim Node image that runs the
# Express server, which ALSO serves the built React app from the same origin
# (relative /api — no CORS, cookies just work). Only production dependencies and
# build artifacts are shipped; no secrets and no dev tooling are baked in — all
# configuration (DATABASE_URL, BETTER_AUTH_SECRET, ANTHROPIC_API_KEY, …) is
# supplied at runtime via the environment.
#
#   docker build -t techquest .
#   docker run --rm -p 3001:3001 --env-file .env.production techquest
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build everything ────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

# Prisma needs OpenSSL to generate/run its query engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Dummy DB URLs so `prisma generate` and the type build never need real secrets.
# These are build-time only and are NOT carried into the runtime image.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public" \
    DIRECT_URL="postgresql://user:pass@localhost:5432/db?schema=public"

# Install dependencies first (cached until a manifest or the lockfile changes).
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
RUN npm ci

# Build: shared → db (prisma generate + tsc) → api (tsc) → web (vite).
# The frontend calls the API same-origin, so VITE_API_URL stays empty. PostHog
# is optional and client-side, so its (public) project key is a build arg baked
# into the web bundle here — it never reaches the runtime stage.
ARG VITE_POSTHOG_KEY=""
ARG VITE_POSTHOG_HOST="https://us.i.posthog.com"
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY \
    VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST
COPY . .
RUN npm run build

# Drop dev dependencies; the generated Prisma client stays in node_modules.
RUN npm prune --omit=dev

# ── Stage 2: minimal runtime ─────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=3001

# Pruned dependencies (incl. the generated Prisma client + engine).
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Workspace packages (their symlinks in node_modules point here).
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

# The compiled API and the built React app it serves.
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Run as the non-root user that ships with the Node image.
USER node

EXPOSE 3001

# Liveness: the server is healthy when GET /api/health returns 2xx.
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/index.js"]
