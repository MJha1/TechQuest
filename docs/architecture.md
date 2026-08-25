# TechQuest — Architecture (summary)

TechQuest is a desktop-first web app that teaches technology and AI to children
aged 8–12 through short, Duolingo-style missions. The parent owns the account;
the child is a managed profile under it.

## Key decisions

- **Children are profiles, not auth accounts.** Better Auth authenticates parents
  only; a child "enters" via profile selection + optional PIN. Minimizes child
  PII and simplifies COPPA/GDPR-K.
- **AI is server-only and bounded.** The browser never sees an LLM key or an open
  chatbot. All model calls go React → Express → AI Service → LLM, templated with
  schema-validated output.
- **Mission content is data.** A generic mission engine renders authored content
  (Discover → Learn → Try → Build → Earn → Return). No CMS.
- **Client-agnostic REST backend.** Layered Router → Middleware → Controller →
  Service → Prisma, so a React Native client can be added later with no rewrite.

## Monorepo layout

```
apps/
  web/     React 19 + Vite + Router 7 + Tailwind v4 + shadcn/ui
  api/     Express 5 + TypeScript
packages/
  shared/  Zod schemas + inferred types (source of truth for contracts)
  db/      Prisma schema + client
docs/      architecture notes
e2e/       Playwright specs
```

See the full architecture proposal (18 sections) shared during design for detail
on entities, auth/authz flows, AI guardrails, testing, and deployment.
