# Apiker testing

Apiker uses **Jest** with **ts-jest**. Config: `jest.config.js`.

## How tests are discovered

```js
testMatch: ["<rootDir>/**/tests/*.(js|jsx|ts|tsx)"]
```

Tests live in a `tests/` folder **inside the domain they cover**, e.g.
`src/components/Apiker/tests/Apiker.js`. Any file directly under a `tests/` folder is a test.

- `ts-jest` transforms `.ts/.tsx`; `babel-jest` transforms `.js/.jsx`.
- `transformIgnorePatterns` allows `cfw-*` packages through Babel.
- Asset/CSS imports are mocked via `scripts/testMock.js`.
- A custom test environment (`scripts/jestEnv.js`, wired via `testEnvironment`) injects the
  Web/Workers globals (`Response`, `Request`, `Headers`, `fetch`, `crypto`, `self`, ...) that
  Jest's node environment does not expose. Apiker code and `cfw-*` libs need them.

## Write tests as `.ts`

Tests are TypeScript. Two rules keep them clean:

- **Import the Jest globals explicitly from `@jest/globals`** — do not rely on ambient
  `@types/jest` globals:

  ```ts
  import { describe, it, expect, beforeEach, jest } from "@jest/globals";
  ```

  Import only the symbols the file uses. `@jest/globals` ships with `jest` and bundles its own
  types, so **no `@types/jest` dependency is needed** (respecting the no-deps rule), and the
  bindings resolve deterministically. Relying on ambient globals was flaky: VS Code's TS server
  caches type-roots and won't see a freshly-installed `@types/*` package until it is restarted,
  producing phantom "Cannot find name 'describe'" errors.
- **`isolatedModules: true`** is set for ts-jest in `jest.config.js`. Without it, ts-jest
  whole-program type-checks every file per worker and the workers run **out of memory**
  ("Zone Allocation failed / heap out of memory"). `isolatedModules` transpiles each file in
  isolation; the editor and a full `tsc` still type-check.

Gotcha: under `@jest/globals`, `jest.fn()` is typed `Mock<unknown, unknown[]>`, which is not
assignable to a specific function type (e.g. a `Middleware[]` element). Cast the mock `as any`
at that call site.

Do **not** put TypeScript syntax (`as any`, type annotations) in a `.js` file — the editor's
JavaScript parser rejects it ("type annotations can only be used in TypeScript files").

Test files are kept out of the published package and docs: `exclude: ["**/tests/**"]` is set on
the `typescript()` plugin in both `rollup.config.*.js`, and `--exclude "**/tests/**"` on the
`docs` (typedoc) script. `tsconfig.json` itself stays inclusive so the editor and ts-jest see
the tests.

> Diagnosing editor-only errors: run the real compiler with
> `npx tsc -p tsconfig.json --noEmit --emitDeclarationOnly false`. If `tsc` is clean but the
> editor is not, it is a TS-server cache issue (restart the TS server), not a real error.

## Commands

| Task | Command |
|------|---------|
| Run all tests | `npm test` (Jest, silent) |
| Coverage | `npm run coverage` |
| Focus a file | `npx jest src/components/Apiker/tests/Apiker.js` |
| Focus by name | `npx jest -t "Runs without crashing"` |

Always run `npm test` before finishing a change.

## The `exports` global

`apiker.init` writes handlers and Durable Object classes onto an `exports` object. In tests
`exports` is used directly as the target (see the existing test). A minimal smoke test:

```js
import { apiker } from "..";

it("Runs without crashing", () => {
  const handler = () => new Response();
  const routes = { "/users/:id/counter": handler };
  const objects = ["Common", "Users", "EmailToUUID", "RateLimit", "Logs", "Bans"];

  apiker.init({ routes, objects, exports });

  expect(apiker.routes).toBe(routes);
  expect(apiker.objects).toBe(objects);
  objects.forEach(name => expect(typeof exports[name]).toBe("function"));
  expect(typeof exports.handlers.fetch).toBe("function");
});
```

## Testing handlers

A handler is a pure function of `params`. You can call it directly with a fabricated `params`
object — you only need to provide the fields your handler reads:

```ts
const params = {
  matches: { params: { id: "42" } },
  body: {},
  headers: new Headers(),
  request: new Request("https://x/users/42"),
  state: () => ({
    get: async () => ({ name: "Ada" }),
    put: async () => {},
    delete: async () => {},
    deleteAll: async () => {},
    list: async () => ({}),
  }),
};

const response = await getUser(params);
expect(response.status).toBe(200);
expect(await response.json()).toEqual({ name: "Ada" });
```

## Testing state / Durable Objects

The real `state()` proxy calls `env[objectName].idFromName(...).get(...).fetch(...)`. In unit
tests, **stub the `state` factory** (as above) rather than standing up a real Durable Object —
the DO fetch path requires the Workers runtime / `apiker.env`. Reserve full DO behavior for
integration testing against `wrangler dev` in a consumer app.

## Notes & gotchas

- `Response`, `Request`, `Headers`, `fetch`, and `crypto` are provided by the custom
  `scripts/jestEnv.js` environment — don't import them, but know they come from there (Jest's
  default node environment omits them).
- `res_204()` **throws under Node/undici** (a 204 cannot carry a body) even though Cloudflare
  Workers allow it. Don't assert a real 204 body in Node; `forwardToMiddleware`'s default
  204 path is only fully exercisable on Workers.
- Stub the singleton to unit-test features: set `apiker.requestParams`, `apiker.env`,
  `apiker.objects` directly and provide a fake `state` factory (or a mock DO namespace with
  `idFromName`/`get`/`fetch` returning a `Response`). See the `State`, `Request`, `Logging`,
  and `Bans` test files for patterns.
- Because `apiker` is a singleton, tests that call `init` mutate shared state. Set the props
  your assertions need inside each test; test files are isolated from each other (separate
  module registries), but tests within a file are not.
- Keep new tests colocated in the domain's `tests/` folder so `testMatch` picks them up.
