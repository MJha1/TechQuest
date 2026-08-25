# TechQuest

An interactive technology & AI learning platform for children aged 8–12.
Desktop-first web app, built as an npm-workspaces monorepo.

## Stack

- **Frontend:** React 19, Vite, TypeScript, React Router 7, Tailwind CSS v4, shadcn/ui
- **Backend:** Express 5, TypeScript
- **Shared:** TypeScript + Zod (validation contracts)
- **Database:** Prisma + Neon PostgreSQL
- **Testing:** Vitest, React Testing Library, Supertest, Playwright

## Layout

```
apps/
  web/        # React frontend
  api/        # Express backend
packages/
  shared/     # @techquest/shared — Zod schemas + types
  db/         # @techquest/db — Prisma client
docs/         # architecture notes
e2e/          # Playwright E2E specs
```

## Getting started

```bash
npm install        # install all workspaces
npm run dev        # run api + web (+ shared watcher) together
npm run build      # build every workspace in dependency order
npm run test       # unit/integration tests (Vitest, RTL, Supertest)
npm run typecheck  # type-check every workspace
```

Dev servers: web on http://localhost:5173, api on http://localhost:3001.
Health check: `GET /api/health` → `{ "ok": true, "data": { "status": "ok", "service": "TechQuest-api" } }`.

### Database

```bash
cp packages/db/.env.example packages/db/.env   # add your Neon DATABASE_URL
npm run generate -w @techquest/db              # generate Prisma client
```

### End-to-end tests (separate from `npm run test`)

```bash
npx playwright install     # one-time: download browsers
npm run dev                # in another terminal
npm run test:e2e
```

## Deploy to Railway

TechQuest deploys as a **single container**: the multi-stage `Dockerfile` builds
the frontend and backend, and Express serves the built React app **same-origin**
(the browser calls `/api` on the same host — no CORS, cookie auth just works).
Railway detects the `Dockerfile` and reads `railway.json` for the health check.

### Commands

| | Command | Where it comes from |
|---|---|---|
| **Build** | `docker build` (multi-stage) → internally `npm run build` | `Dockerfile` (Railway builder: `DOCKERFILE`) |
| **Start** | `node apps/api/dist/index.js` | `Dockerfile` `CMD` |
| **Migrate** | `npm run migrate:deploy -w @techquest/db` | run as a separate step (below) |

Railway injects `PORT`; the server listens on it automatically.

### Environment variables (set as Railway service variables — never commit real values)

See [`.env.example`](.env.example) for the full list with guidance. Required:

| Variable | Purpose |
|---|---|
| `NODE_ENV=production` | Enables prod behavior (incl. serving the SPA, secure cookies). |
| `DATABASE_URL` | Pooled Postgres URL. Reference the plugin: `${{Postgres.DATABASE_URL}}`. |
| `DIRECT_URL` | Direct (non-pooled) URL, used by `prisma migrate`. |
| `BETTER_AUTH_SECRET` | Session signing secret (`openssl rand -base64 32`). **Prod startup fails on the dev default.** |
| `BETTER_AUTH_URL` | Public service URL, e.g. `https://your-app.up.railway.app`. |
| `CORS_ORIGINS` | The public URL (same value); also Better Auth trusted origins. |
| `ANTHROPIC_API_KEY` | Optional — enables AI hints; without it a safe fallback is used. |

Optional tunables (`AI_MODEL`, `AI_HINT_TIMEOUT_MS`, `RATE_LIMIT_*`, `BODY_LIMIT`,
`LOG_LEVEL`) have sane defaults.

### Database connection

Provision **Railway Postgres** (or use Neon) and point `DATABASE_URL` /
`DIRECT_URL` at it. Prisma connects over TLS (`sslmode=require`). The app opens
connections lazily; `GET /api/health` does not touch the database, so the
container reports healthy even before the first query.

### Prisma migration strategy

The runtime image is dev-dependency-pruned (no Prisma CLI), so migrations run as
an **explicit step**, not on container start (avoids restart races). Apply
migrations against the target database before promoting a deploy:

```bash
# From your machine / CI, with the Railway env injected:
railway run npm run migrate:deploy -w @techquest/db
# — or set DATABASE_URL/DIRECT_URL and run it directly:
DATABASE_URL=… DIRECT_URL=… npm run migrate:deploy -w @techquest/db
```

`migrate:deploy` applies committed migrations only (never generates or resets).

### Health check

`railway.json` sets `healthcheckPath: /api/health`; the `Dockerfile` also
declares a `HEALTHCHECK` polling the same endpoint. Railway waits for a `2xx`
before routing traffic to a new deploy.

### Better Auth configuration

Parent-only email/password auth. Set `BETTER_AUTH_SECRET` (strong, server-side)
and `BETTER_AUTH_URL` to the public service URL; `CORS_ORIGINS` must include that
origin (it's the trusted-origins list). Over Railway's HTTPS, session cookies are
`Secure` + `SameSite` and, being same-origin, are sent without CORS. There are no
child logins — children are profiles under a parent.

### PostHog configuration

Analytics is **client-side**, so `VITE_POSTHOG_KEY` is inlined at **build time**,
not read at runtime. To enable it, set `VITE_POSTHOG_KEY` (and optionally
`VITE_POSTHOG_HOST`) as Railway **build-time** variables — the `Dockerfile`
consumes them as build args. The project key is public (not a secret). Left
unset, the app ships with analytics disabled (a no-op).

### AI configuration

`ANTHROPIC_API_KEY` is **server-side only** and read at runtime — it never
reaches the browser. Without it, hints and activities use a safe fallback.
`AI_MODEL` (default `claude-opus-5`) and `AI_HINT_TIMEOUT_MS` (default `8000`) are
optional overrides.

### First deploy, end to end

1. Create a Railway project; add a **Postgres** plugin.
2. Connect this repo (Railway builds from the `Dockerfile`).
3. Set the service variables from the table above (reference `${{Postgres.DATABASE_URL}}`).
4. To enable analytics, add `VITE_POSTHOG_KEY` as a **build-time** variable.
5. Deploy. Then apply migrations once: `railway run npm run migrate:deploy -w @techquest/db`.
6. Verify: open `https://<your-app>.up.railway.app/api/health` → `{"ok":true,…}`,
   and the site root serves the app.

See [`docs/deployment.md`](docs/deployment.md) for the container internals.

## Status

Feature-complete MVP: parent/child onboarding, the data-driven mission engine,
gamification, a deterministic recommendation engine, parent dashboard, bounded
AI hints/activities, analytics, and a production Docker image. See `docs/` for
architecture, security, performance, error-handling, and deployment notes.
