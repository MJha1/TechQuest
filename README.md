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

Dev servers: web on http://localhost:5173, api on http://localhost:3001
(`GET /health` returns `{ "status": "ok", "service": "TechQuest-api" }`).

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

## Status

Scaffolding only — no business functionality yet. See `docs/architecture.md`.
