# Vinyl Collection

Multi-user web app to manage a vinyl record collection, with Discogs integration (search, add, OAuth account linking and collection import).

- **Backlog:** Jira project `VINYL`.
- **Language:** code, comments, commits, PRs and Jira issues are written in **English**.

## Stack

| Layer    | Tech                                                                                          |
| -------- | --------------------------------------------------------------------------------------------- |
| Frontend | Next.js (App Router, Turbopack) · React · TypeScript · TanStack React Query · React Hook Form |
| Backend  | Node.js · Express · TypeScript · Mongoose                                                     |
| Database | MongoDB (Docker locally, Atlas in production)                                                 |
| Shared   | Zod schemas and types in `@vinyl/shared`                                                      |
| Monorepo | npm workspaces · Turborepo                                                                    |
| Testing  | Vitest · React Testing Library · MSW · Supertest · mongodb-memory-server · Playwright         |

## Commands

Run everything from the repo root. Turborepo caches `lint`, `typecheck`, `test` and `build`.

```bash
npm install                        # install all workspaces
docker compose up -d               # start local MongoDB
npm run dev                        # web + api in watch mode
npm run lint                       # ESLint (incl. security rules) on all workspaces
npm run typecheck                  # tsc --noEmit on all workspaces
npm run test                       # Vitest on all workspaces
npm run test:coverage              # Vitest with coverage thresholds
npm run test:e2e                   # Playwright (needs dev stack running)
npm run build                      # production build of every app
npm run format                     # Prettier --write on the whole repo
npm run format:check               # Prettier --check (used by validate and CI)
npm run audit                      # npm audit --audit-level=high
npm run validate                   # format:check + lint + typecheck + coverage + audit (pre-PR gate)
npm run agents -- VINYL-<n> --dry-run   # validate agent config for an issue (no Claude/Jira calls)
```

Agents env: copy `tools/agents/.env.example` (Claude credentials are optional if an `ant auth` profile is active; Jira is required except with `--dry-run`).

Single workspace: `npm run test -w @vinyl/api`, `npm run dev -w @vinyl/web`.
Single test file: `npm run test -w @vinyl/api -- path/to/file.test.ts`.

Shared config packages:

- `@vinyl/tsconfig` — `base.json` (strict + `noUncheckedIndexedAccess`), `node.json`, `library.json`, `nextjs.json`.
- `@vinyl/eslint-config` — `@vinyl/eslint-config/node` and `@vinyl/eslint-config/next` (flat configs with type-aware TypeScript, security, React/a11y/Next rules and Prettier compatibility).
- Toolchain pins: TypeScript 6.0 (typescript-eslint does not support 7.x yet) and ESLint 9 (React/jsx-a11y plugins do not support 10 yet).

## Architecture

```
apps/
  web/                      Next.js frontend
    src/app/                routes (App Router); thin, compose features
    src/features/<name>/    components, hooks, api calls and tests per feature
    src/components/         shared UI (design system)
    src/lib/                apiClient, queryClient, query key factories
  api/                      Express backend
    src/modules/<name>/     routes → controller → service → repository (+ tests)
    src/integrations/       external services (discogs/)
    src/middlewares/        auth, validation, error handling, rate limiting
    src/config/             env parsing (Zod), db connection, logger
packages/
  shared/                   Zod schemas, inferred types, DTOs (single source of truth)
  tsconfig/                 base tsconfigs
  eslint-config/            shared ESLint configs (next, node)
tools/
  agents/                   LangGraph.js orchestrator + Back/Front/QA/Security Claude agents (dev tooling, never shipped)
```

### Key decisions

- **Same origin:** the browser only talks to Next.js; `/api/*` is rewritten to Express. No CORS, cookies work as first-party.
- **Auth lives in the API:** argon2 password hashing, short-lived JWT access token + rotated, revocable refresh token, both in `httpOnly`/`Secure`/`SameSite=Lax` cookies.
- **Data model:** `Release` is a shared catalog entry (from Discogs or manual); `CollectionItem` is a user's copy (`ownerId`, `releaseId`, condition, price, `status: owned | wishlist`). Discogs data is never duplicated per user.
- **Tenant isolation:** every repository query on user data filters by `ownerId`. Accessing another user's resource returns **404**, never 403.
- **Discogs is server-side only:** throttled client respecting `X-Discogs-Ratelimit-*`, cached releases, OAuth tokens encrypted at rest. Imports run as background jobs.
- **API contract:** versioned under `/api/v1`, validated with Zod from `@vinyl/shared`, errors as RFC 7807 `application/problem+json`.
- **Design first:** no UI story starts until the Design & UX spec (VINYL-56) is approved; UI work follows its tokens, components and flows.
- **Agent orchestration:** `tools/agents` runs a LangGraph.js graph (Planner → Back/Front → QA → Security → human review) that calls Claude only through `@anthropic-ai/sdk` (`claude-opus-5-5`, adaptive thinking). Agents work in a git worktree, apply this file's Definition of Done, and never push or merge.

## Conventions

### TypeScript

- `strict` + `noUncheckedIndexedAccess`. No `any`, no non-null `!` without a comment explaining why.
- Types come from Zod (`z.infer`) — do not hand-write duplicate interfaces.
- Named exports only (except Next.js route files that require default exports).

### Backend

- Controllers handle HTTP only; business logic in services; Mongo access only in repositories.
- Validate `body`, `params` and `query` with Zod middleware before reaching the controller.
- Throw typed domain errors; the error middleware maps them to RFC 7807. Never leak stack traces or Mongo errors to clients.
- Use `.lean()` for read queries and project only the fields you need.
- Log with pino; never log passwords, tokens, cookies or full request bodies.

### Frontend

- Server state lives in React Query; UI state in `useState`/URL search params. No global state library.
- Query keys come from factories in `src/lib/queryKeys.ts`; never inline key arrays.
- Mutations invalidate affected queries; use optimistic updates with rollback for edit/delete.
- Server Components by default; add `"use client"` only where interactivity is needed.
- Accessibility first: semantic HTML, labelled controls, visible focus, keyboard navigation.

### Naming

- Files: `kebab-case.ts`; React components: `PascalCase.tsx`; hooks: `useThing.ts`.
- Tests next to the code: `thing.test.ts` / `Thing.test.tsx`; E2E in `apps/web/e2e/`.

### Git & Jira

- Branches: `feat/VINYL-12-short-description`, `fix/VINYL-30-…`, `chore/VINYL-…`.
- Conventional commits referencing the issue: `feat(api): add collection CRUD [VINYL-22]`.
- One PR per Jira issue where possible; the PR description links the issue and lists how each item of the Definition of Done was satisfied.
- **No AI attribution:** commits and PRs never include `Co-Authored-By: Claude`, "Generated with Claude Code" or similar trailers or footers. This applies to humans, Claude Code and the agents in `tools/agents` alike; `.claude/settings.json` disables Claude Code's attribution for this repo.
- This repo is public: commits use the GitHub noreply email, and no personal data (emails, private URLs) goes into tracked files.

### Scrum & estimation

- Work is planned in Scrum sprints on the Jira `VINYL` board.
- Stories and tasks are estimated in **story points using Fibonacci**: 1, 2, 3, 5, 8, 13. Epics are not estimated.
- Anything above 8 must be split before it enters a sprint; 13 means "too big or too uncertain — refine it".
- Points measure relative effort, complexity and uncertainty, not hours. Re-estimate only when scope changes.

## Definition of Done — mandatory for every code change

A change is **not done** unless all three sections below are satisfied. If any item cannot be met, stop and explain why instead of skipping it.

### 1. Tests

- New or changed behaviour is covered by tests **in the same change**: unit tests for services/hooks/utils, integration tests (Supertest + mongodb-memory-server) for endpoints, RTL + MSW tests for components.
- Bug fixes include a regression test that fails without the fix.
- Test behaviour, not implementation: query by role/label in RTL; assert on HTTP responses, not internals.
- Coverage must not drop; target ≥ 80% lines on services, hooks and modules touched.
- `npm run validate` passes locally before committing.

### 2. Security review

Check every item that applies to the change:

- [ ] All external input (body, params, query, headers, Discogs responses) validated with Zod.
- [ ] Endpoints touching user data require auth and filter by `ownerId`; a test proves another user gets 404.
- [ ] No NoSQL injection: never pass raw request objects into Mongo filters; no `$where`; build queries from validated fields only.
- [ ] Secrets only from validated env; nothing sensitive in logs, errors, client bundles or `NEXT_PUBLIC_*` vars.
- [ ] Cookies `httpOnly`, `Secure`, `SameSite`; state-changing requests protected against CSRF.
- [ ] Rate limiting on auth and expensive endpoints; Discogs calls throttled.
- [ ] Output rendered safely in React (no `dangerouslySetInnerHTML` without sanitising).
- [ ] New dependencies: justified, maintained, and `npm audit` reports no high/critical issues.

### 3. Performance review

Check every item that applies to the change:

- [ ] Every new query pattern is backed by an index; verify with `explain()` when in doubt.
- [ ] Lists are paginated (cursor-based); no unbounded queries or N+1 loops.
- [ ] Read queries use `.lean()` and field projection.
- [ ] External calls (Discogs) cached where possible and never made per-item in a loop on the request path.
- [ ] React Query `staleTime`/keys tuned to avoid redundant fetches; no request waterfalls.
- [ ] Client bundle: no heavy dependency added without need; use dynamic import for large, rarely used UI.
- [ ] Images through `next/image` with explicit sizes.

When finishing a task, summarise in the PR (or reply) which tests were added and the outcome of the security and performance checklists.
