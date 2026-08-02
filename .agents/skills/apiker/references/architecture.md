# Apiker architecture (deep dive)

File paths are relative to the repo root. This document explains the runtime so you can change
it safely.

## 1. Initialization — `apiker.init(options)`

Source: `src/components/Apiker/Apiker.ts`.

`apiker` is a **singleton** instance of the `Apiker` class. Never instantiate `Apiker`
directly; downstream code imports the shared `apiker`.

`init` does the following, in order:

1. Destructures `options` (`Options` in `Apiker/interfaces.ts`).
2. Builds `objectStateMapping` by merging user overrides onto defaults:
   ```ts
   { CounterUser: SIGNEDIP, RateLimit: SIGNEDIP, Logs: SIGNEDIP, Bans: "userId", ...override }
   ```
3. Requires `routes`, `objects`, and `exports` — throws otherwise.
4. `setProps(...)` copies options onto the singleton (`Object.assign(this, options)`).
5. If `authRoutes` is true, prepends `getApikerAuthRoutes()`.
6. If `adminPanel` is true, prepends `getAdminRoutes()`.
7. Builds `workerExports.handlers.fetch = handleEntryRequest` and, if `scheduled` is given,
   `handlers.scheduled`.
8. For each name in `objects`, creates a Durable Object class via
   `getObjectClassDefinition(name)` — a subclass of `ObjectBase` — and attaches it to
   `exports[name]`.
9. `Object.assign(exports, workerExports)` — this is how the consumer's Worker gets its
   `fetch`, `scheduled`, and DO class exports.

**When adding an init option:** add it to `Options`, destructure it in `init`, and either
pass it through `setProps` or handle it explicitly. Keep defaults backward-compatible.

## 2. Request entry & routing

Source: `src/components/Request/Request.ts` → `handleEntryRequest(request, env, ctx)`.

1. `measureTiming(REQUEST_START)` starts timing.
2. Stores `env`/`ctx` on the singleton and resets `responseHeaders` + `responseParams`
   **per request** (important: the singleton is reused across requests on the same isolate,
   so per-request state must be reset here).
3. Parses the body with `readRequestBody` (content-type aware: JSON, text, html, form, else
   raw text).
4. Iterates `apiker.routes` with `path-to-regexp`'s `match`. On the first match:
   - function handler → used directly;
   - `"Class.method"` string → `new apiker.controllers[Class]()[method]`.
   - Builds `state` via `getStateMethods(defaultObjectName, matches)` and adds `matches` to
     `params`.
5. Assembles the middleware array: `[firewallMiddleware?]`, `bansMiddleware`, `handlerFn`.
6. `forwardToMiddleware(params, middlewares)` runs them.

`readRequestBody` throws a generic error on parse failure; the outer `try/catch` returns a
plain `Response(e.message)`.

## 3. Middleware

Source: `src/components/Middleware/Middleware.ts`.

```ts
forwardToMiddleware(params, middlewares) // runs each in order
```

- Each middleware is `(params) => Response | falsy | Promise<...>`.
- The **first truthy return short-circuits** and becomes the response.
- If none return, `res_204()` is returned.
- A middleware and a handler have the **same signature** — a handler is just the last
  middleware.

To add a middleware: create `<Domain>/middleware.ts` exporting a `Middleware`, then `push`
it into the array in `Request.ts` at the right position (before the handler). Gate it behind
an option/flag when it's not always-on (see `firewallMiddleware`, gated by `apiker.firewall`).

## 4. Durable Object state

Sources: `src/components/State/State.ts`, `src/components/ObjectBase/`.

### The Durable Object

`ObjectBase/ObjectBase.ts` is the base class for every named object. Its `fetch` dispatches on
pathname to `state.storage` operations:

| Endpoint | Operation |
|----------|-----------|
| `/get` | `storage.get(propertyName)` |
| `/put` | `storage.put(...)` for each key in the body |
| `/delete` | `storage.delete(propertyName)` |
| `/deleteall` | `storage.deleteAll()` |
| `/list` | `storage.list(body)` → object |

`OB_ENDPOINT` is `https://durable-object` (a dummy origin; DO `fetch` ignores the host).

### The client proxy

`getStateMethods(defaultObjectName, matches?)` returns a **factory**:

```ts
state(objectName = "Common", objectId?, isCloudflareObjectId?) => { get, put, delete, deleteAll, list }
```

- If `objectId` is omitted, it is derived from `objectStateMapping[objectName]` via
  `parseObjectStateMapping` (falls back to `"default"`).
- `getEnvObject(name, id)` → `env[name].idFromName(id)` then `.get(id)`.
- `getEnvObjectByCloudflareId(name, id)` uses `idFromString` for a raw CF id.
- Each method POSTs JSON to the DO endpoint, awaits, and `JSON.parse`s the response.
- `apiker.debug` logs every operation.

**All state methods are async** — always `await`.

### Object-state mapping (`parseObjectStateMapping`)

Maps a mapping token to a concrete instance id:

| Token (`OBMT`) | Resolves to |
|----------------|-------------|
| `signedIp` | `getSignedIp()` — HMAC-signed client IP |
| `clientId` | `getClientId()` |
| `ip` | `getRawIp()` — raw client IP |
| a route-param name | `matches.params[name]` |
| any other string | the literal string |

This is how, e.g., `RateLimit` and `Logs` are automatically partitioned per client IP.

## 5. Scheduled (cron) handler

`handleScheduledRequest(event, env, ctx, callback)` sets `env`/`ctx`, builds a `state`
factory for the default object, and invokes the user `scheduled` callback with
`{ event, env, ctx, state }` (`ScheduledParams`). Errors are logged, not thrown.

## 6. Response pipeline

Source: `src/components/Response/Response.ts`.

- `res(input, options)` — core builder. `input` string/number → `{ message: input }`;
  object → spread. Serializes with `JSON.stringify`, pretty-printed (indent 4) when
  `apiker.debug`. Uses `apiker.responseHeaders`. `options` can be a status number or a
  `ResponseInit`.
- `res_200 … res_500` — status-specific wrappers with default messages from
  `Response/constants.ts` (`RESPONSE_MESSAGES`).
- `resRaw(html, contentType = "text/html")` — for HTML/admin pages; sets content-type.

Handlers should return one of these, never a bare `new Response` (that bypasses default
headers and JSON shaping).

## 7. Built-in feature domains (quick orientation)

- **Auth** — `getApikerAuthRoutes()` wires `/auth/register|login|refresh|delete|forgot|verify`,
  each wrapped in `rateLimitRequest`. JWT (`cfw-crypto`), bcrypt (`cfw-bcrypt`), plus GitHub
  OAuth under `Auth/Github`.
- **RateLimit** — `rateLimitRequest(prefix, params, handler?, limit?, timeLapse?, onLimitReached?)`
  counts requests in the `RateLimit` DO, sets `X-RateLimit-*` headers, returns `res_429` when
  exceeded.
- **Bans / Firewall** — middleware that blocks banned entities; Firewall integrates the
  Cloudflare REST API to ban IPs at the edge.
- **Logging** — append-only log entries in the `Logs` DO, partitioned by signed IP.
- **Admin / Page / Static** — server-rendered admin panel (React SSR to HTML) served via
  `resRaw`.
- **Geolocation / Timings / Validation / Email / EmailTemplates** — supporting utilities.

Read the relevant `index.ts` before changing any of these; they compose the primitives above.
