# TechQuest — Deployment (Docker)

TechQuest ships as a **single production image**. The multi-stage `Dockerfile`
builds the shared package, the Prisma client, the Express API, and the React
(Vite) frontend, then produces a slim runtime image that runs the Express server
— which also **serves the built React app from the same origin**. Because the
browser calls `/api` on the same host, there is no CORS and the session cookie
just works; the frontend needs no build-time API URL.

## Build & run

```bash
docker build -t techquest .
docker run --rm -p 3001:3001 --env-file .env.production techquest
```

Then check the health endpoint:

```bash
curl http://localhost:3001/api/health      # → {"ok":true,"data":{"status":"ok","service":"TechQuest-api"}}
```

The image also declares a `HEALTHCHECK` that polls `/api/health`, so an
orchestrator can see container health directly.

## Runtime environment (nothing is baked into the image)

All configuration is supplied at **runtime** (e.g. `--env-file`, or the
platform's secret manager). **No secrets are built into the image.**

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres (pooled) connection string. |
| `DIRECT_URL` | for migrations | Direct (non-pooled) connection, used by `prisma migrate`. |
| `BETTER_AUTH_SECRET` | ✅ | Session signing secret. **Startup fails in production if left at the dev default.** |
| `BETTER_AUTH_URL` | ✅ | Public base URL the app is served from. |
| `CORS_ORIGINS` | optional | Only needed if the frontend is ever served from a different origin; same-origin needs nothing. |
| `ANTHROPIC_API_KEY` | optional | Enables real AI hints; without it, the safe fallback is used. |
| `PORT` | optional | Defaults to `3001`. |
| `AI_MODEL`, `AI_HINT_TIMEOUT_MS`, `RATE_LIMIT_*`, `BODY_LIMIT`, `LOG_LEVEL` | optional | Tunables with sane defaults (see `apps/api/src/lib/env.ts`). |

`WEB_DIST` is set implicitly by the image layout; you do not need to provide it.

> The frontend is built with `VITE_*` unset, so it calls the API same-origin and
> product analytics is off. To enable PostHog you would rebuild the image with
> `VITE_POSTHOG_KEY` as a build arg (the PostHog project key is public, not a
> secret).

## Database migrations

The container runs the server only; it does not auto-migrate. Apply migrations
as a separate step against the target database:

```bash
DATABASE_URL=… DIRECT_URL=… npm run migrate:deploy -w @techquest/db
```

## Image design notes

- **Multi-stage:** a `builder` stage installs all dependencies and compiles
  everything; the `runner` stage copies only the build artifacts plus a
  dev-dependency-pruned `node_modules` (the generated Prisma client is retained).
- **Prisma:** the client/engine is generated **inside** the build on the same
  `node:20-slim` (Debian, OpenSSL 3) base as the runtime, so the query engine
  binary matches the container.
- **Least privilege:** runs as the non-root `node` user.
- **No dev tooling at runtime:** `tsx`, `typescript`, `vitest`, `supertest`, and
  type packages are pruned; only production dependencies remain.
