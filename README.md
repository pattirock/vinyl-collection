# Vinyl Collection

Multi-user web app to manage a vinyl record collection, with Discogs integration.

Monorepo managed with **npm workspaces** and **Turborepo**. See [`CLAUDE.md`](CLAUDE.md) for architecture, conventions and the mandatory Definition of Done.

## Requirements

- Node.js 22 LTS (`nvm use` reads `.nvmrc`)
- npm 10.9+

## Getting started

```bash
nvm use
npm install
npm run build
```

## Layout

```
apps/       deployable applications (web, api)
packages/   shared libraries (shared, tsconfig, eslint-config)
tools/      developer tooling (agents)
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Run every app in watch mode |
| `npm run build` | Build every workspace (cached by Turborepo) |
| `npm run lint` | Lint every workspace |
| `npm run typecheck` | Type-check every workspace |
| `npm run test` | Run unit/integration tests |
| `npm run test:coverage` | Tests with coverage thresholds |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run audit` | `npm audit` failing on high/critical issues |
| `npm run validate` | Pre-PR gate: lint + typecheck + coverage + audit |

Backlog: Jira project `VINYL`.
