# Apiker patterns & recipes

Copy-ready patterns for the most common changes. Match the surrounding code style — Apiker is
very consistent, so mirror the nearest existing example.

## Consumer-facing usage (for reference / tests / docs)

```js
import { apiker, res } from "apiker";

const routes = {
  "/users/:id/hello": ({ matches }) => res(`Hello ${matches.params.id}`),
};

apiker.init({ routes, exports, objects: ["Common"] });
```

## A handler function

Handlers receive `{ request, body, headers, matches, state }` and return a `res*`.

```ts
import { res, res_400 } from "../Response";
import { Handler } from "../Request";

export const getUser: Handler = async ({ matches, state }) => {
  const id = matches.params.id;
  if (!id) return res_400();

  const user = await state("Users", id).get("profile");
  return res(user ?? {});
};
```

- Return early with `res_4xx` on invalid input.
- `await` every `state()` call.
- Never `new Response(...)` directly — use `res` / `res_*` / `resRaw`.

## A controller (string-routed handler)

Routes can point to `"ClassName.method"` resolved against `apiker.controllers`.

```ts
export class UserController {
  get = async ({ matches, state }: RequestParams) => res(await state("Users", matches.params.id).get("profile"));
}

// consumer side:
apiker.init({
  routes: { "/users/:id": "UserController.get" },
  controllers: { UserController },
  objects: ["Common", "Users"],
  exports,
});
```

## A state-backed feature

`state(objectName, objectId?)` → `{ get, put, delete, deleteAll, list }`, all async.

```ts
// write
await state("Users", userId).put({ profile: { name }, updatedAt: Date.now() });

// read
const profile = await state("Users", userId).get("profile");

// list with prefix
const all = await state("Logs").list({ prefix: "log_" });

// delete
await state("Users", userId).delete("profile");
```

Remember: `objectName` **must** be one of the `objects` array passed to `init`, and its
Durable Object class is auto-generated from `ObjectBase`.

## A middleware

Same signature as a handler; return a `Response` to short-circuit or a falsy value to pass
through.

```ts
// src/components/MyFeature/middleware.ts
import { RequestParams } from "../Request";
import { res_401 } from "../Response";
import { Middleware } from "../Middleware";

export const myFeatureMiddleware: Middleware = async ({ headers }) => {
  if (!headers.get("authorization")) return res_401();
  return undefined; // continue to next middleware
};
```

Register it in `src/components/Request/Request.ts`, before the handler and behind a flag when
it isn't always-on:

```ts
if (apiker.myFeature) middlewares.push(myFeatureMiddleware);
middlewares.push(bansMiddleware);
middlewares.push(handlerFn);
```

## A response helper / new status

Add the message to `Response/constants.ts` (`RESPONSE_MESSAGES`) and a wrapper in
`Response/Response.ts`:

```ts
export const res_403 = (input?: any, options = null) =>
  res(input ? parseInput(input) : RESPONSE_MESSAGES[403], options || 403);
```

Export follows automatically through `Response/index.ts`.

## A new init option

1. Add it to `Options` in `Apiker/interfaces.ts`.
2. Destructure it in `Apiker.init` with a backward-compatible default.
3. Pass through `setProps` (auto-assigned) or handle explicitly (like `authRoutes`).
4. Add a field on the `Apiker` class if it needs a typed home.

## Built-in routes wired with rate limiting

Mirror `Auth/Auth.ts`: wrap each handler in `rateLimitRequest(prefix, params, handler, limit?)`.

```ts
export const getMyRoutes = (): RouteObject => ({
  "/my/action": params => rateLimitRequest(MY_PREFIX, params, myAction),
});
```

## A new feature domain (component)

```
src/components/MyFeature/
  index.ts        # export * from "./MyFeature";  (+ interfaces/constants as needed)
  interfaces.ts   # types
  constants.ts    # (optional)
  MyFeature.ts    # implementation
  tests/
    MyFeature.ts  # Jest test (see references/testing.md)
```

Then add `export * from "./MyFeature";` to `src/components/index.ts` so it becomes part of the
public API. Keep cross-component imports pointing at folder barrels (`../State`, `../Response`).

## The scaffolder (Node context only)

`scripts/create.js` runs under **Node**, not Workers — Node built-ins are allowed there. It
clones `apiker-template`, strips git metadata, rewrites `package.json`, and runs `npm install`.
`bin/index.js` invokes the compiled version.
