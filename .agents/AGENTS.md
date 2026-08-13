# AGENTS.md — Apiker

Guidance for AI agents working in the **Apiker** repository. Read this first, then load
the `apiker` skill (`.agents/skills/apiker/SKILL.md`) for deep, task-specific instructions.

## What Apiker is

Apiker is a **library** (published to npm as `apiker`) for building serverless REST APIs on
**Cloudflare Workers + Durable Objects**. Consumers write three lines to stand up an API:

```js
import { apiker, res } from "apiker";
const routes = { "/users/:id/hello": () => res("Hello World!") };
apiker.init({ routes, exports, objects: ["Common"] });
```

This repo is the library source, **not** a consumer app. Changes here affect every downstream
Apiker API. Treat backward compatibility as a hard requirement (see `CONTRIBUTING.md`).

## Repository map

| Path | What lives there |
|------|------------------|
| `src/index.ts` | Single entrypoint — re-exports `./components` |
| `src/components/` | All library code, one folder per feature domain |
| `src/components/index.ts` | Barrel that re-exports every component's public API |
| `src/pages.ts`, `src/components/Page`, `Static` | Admin panel / static HTML rendering (React SSR) |
| `scripts/create.js` | `npx apiker <dir>` scaffolder (clones `apiker-template`) |
| `bin/index.js` | CLI shim that runs the compiled `create.js` |
| `docs/` | Generated TypeDoc output — **do not hand-edit** |
| `rollup.config.*.js`, `tsconfig*.json` | Build config (main lib + component build) |
| `.agents/` | Agent skills & guidance (this directory) |

### Component anatomy

Every domain under `src/components/<Name>/` follows the same shape:

```
<Name>/
  index.ts        # public barrel — the ONLY thing other components import from
  interfaces.ts   # TypeScript types/interfaces for the domain
  <Name>.ts       # implementation
  constants.ts    # (optional) domain constants
  tests/          # (optional) Jest tests — files are named <Name>.spec.(ts|js)
```

Domains: `Apiker` (core/init), `Admin`, `Auth` (JWT, bcrypt, GitHub OAuth), `Bans`,
`Cloudflare` (REST API client), `Email`, `EmailTemplates`, `Firewall`, `Geolocation`,
`Logging`, `Middleware`, `ObjectBase` (Durable Object base class), `Page`, `RateLimit`,
`Request` (entry handler + routing + body parsing), `Response` (`res` helpers), `State`
(Durable Object storage proxy), `Static`, `Timings`, `Validation`.

## Commands

| Task | Command |
|------|---------|
| Run tests | `npm test` (Jest, `--silent`) |
| Test with coverage | `npm run coverage` |
| Build library | `npm run build` (clean + two Rollup passes) |
| Generate API docs | `npm run docs` (TypeDoc → `docs/`) |
| Clean build output | `npm run clean` |

Tests are matched by `**/*.spec.(js|jsx|ts|tsx)` and use `ts-jest`. **Always run `npm test`
after changes.** Name every test file `<Name>.spec.ts`; the build and TypeDoc exclude
both `**/tests/**` and `**/*.spec.*`, so a spec may live next to the code it covers
(see `plugins/PostBuild.spec.js`).

## Generated environment variables

`plugins/PostBuild.js` owns project env vars, listed in `REQUIRED_ENV_KEYS`
(`APIKER_SECRET_KEY`, `ADMP_SETUP_SECRET`). `createEnv()` writes `.env` for a new
project and `ensureEnv()` back-fills variables added later — without the latter, an
existing project would never gain a newly required one. `.env` is merged into the
generated `wrangler.toml` as `vars`, which is how a deployment receives secrets.

To add a variable: append its name to `REQUIRED_ENV_KEYS`; every project picks it up
on its next build.

## Non-negotiable conventions

1. **No new runtime dependencies.** `CONTRIBUTING.md` forbids it. Prefer Workers-native APIs.
2. **No breaking changes** to `apiker.init()` options, `res*` helpers, handler `params` shape,
   or exported names without explicit maintainer sign-off.
3. **Cross-component imports go through the folder barrel** (`../State`), never deep paths
   (`../State/State`) — except where the existing code already does so intentionally.
4. **Runtime = Workers, not Node.** No `fs`, `path`, `process`, or Node built-ins in
   `src/components/**`. Those are fine only in `scripts/` and `bin/`.
5. **Every promise is awaited or returned.** Durable Object `state` methods are async.
6. **Document new public APIs with TSDoc** and run `npm run docs` — see the
   `apiker` skill's documentation reference.
7. **Add or update a test** under the domain's `tests/` folder for behavior changes.

## Self-improvement loop

When you learn something non-obvious about this codebase (a gotcha, a convention, a
build quirk), record it. See `.agents/skills/apiker-self-improve/SKILL.md`. Verified,
durable facts belong in **repository memory** (`/memories/repo/`) so future sessions
benefit.

## Cloudflare platform skills

Generic Cloudflare knowledge (Workers, Durable Objects, Wrangler, Email, etc.) lives in
`.agents/skills/` (installed via `npx skills add`). Use those for **platform** questions;
use the `apiker` skill for **library-specific** work.
