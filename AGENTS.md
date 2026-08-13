# AGENTS.md

**Apiker** — a library for building serverless REST APIs on Cloudflare Workers + Durable
Objects. This repo is the library source, not a consumer app; changes affect every downstream
Apiker API, so preserve backward compatibility (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Start here

1. Read [.agents/AGENTS.md](.agents/AGENTS.md) — repo map, component anatomy, commands, and
   the non-negotiable rules.
2. Load the **`apiker`** skill ([.agents/skills/apiker/SKILL.md](.agents/skills/apiker/SKILL.md))
   for any work under `src/components/**` (routing, handlers, Durable Object state, auth,
   middleware, rate limiting, bans, firewall, logging, email, admin panel, CLI). Its
   `references/` cover architecture, patterns, testing, and TSDoc documentation.
3. Load the **`apiker-self-improve`** skill
   ([.agents/skills/apiker-self-improve/SKILL.md](.agents/skills/apiker-self-improve/SKILL.md))
   at the start of non-trivial work (to recall lessons) and at the end (to record new ones in
   repository memory).

For generic Cloudflare platform questions (Workers, Durable Objects, Wrangler, Email), use the
Cloudflare skills under [.agents/skills/](.agents/skills/).

## Commands

| Task | Command |
|------|---------|
| Run tests | `npm test` |
| Test with coverage | `npm run coverage` |
| Build library | `npm run build` |
| Generate API docs | `npm run docs` |
| Admin panel sandbox | `npm run dev:panel` |

### Admin panel sandbox

`npm run dev:panel` serves the panel from local source on `http://localhost:5010` and proxies
every `/admp` request to a real deployment, so actions run against real data with a real session
and CSRF token. The library itself is not a Worker, so the backend comes from a consumer project:

1. In a consumer (for example the demo project created by `apiker create`), enable
   `adminPanel: true` and run `npx wrangler dev --local --port 8787`.
2. Run `npm run dev:panel` here. Point it elsewhere with
   `$env:ADMP_TARGET="https://your-deployment.example.com"`.

Editing `src/components/Admin/**` rebuilds the bundle and reloads the page. `dev/` is dev-only:
it is outside `src`, ignored by npm, and never part of a build output.

## Hard rules (summary — full list in [.agents/AGENTS.md](.agents/AGENTS.md))

- **No new runtime dependencies** and **no breaking changes** to the public API.
- **Workers runtime only** in `src/components/**` (no Node built-ins); Node is fine in
  `scripts/` and `bin/`.
- **Document new public APIs with TSDoc** and add/update a Jest test in the domain's `tests/`.
- Run `npm test` before finishing.
