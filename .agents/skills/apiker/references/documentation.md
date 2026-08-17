# Apiker documentation standard (doc comments)

**There is no doc generator.** User-facing documentation lives at **hodgef.com/apiker**
(maintained separately in PRSS), so nothing is generated from the source here — there is no
`docs/` output and no `npm run docs` script.

In-code doc comments still matter: they drive editor IntelliSense for consumers and keep the
public API self-explanatory. Write them for every exported symbol you add or change.

## Rules

1. **Document every exported symbol** — functions, classes, methods, interfaces, types, and
   notable constants that consumers touch.
2. Use **block comments** (`/** ... */`) directly above the symbol so editors surface them on
   hover. Line comments (`//`) are for internal notes.
3. **Let types carry the types.** Don't restate a parameter's TypeScript type in prose;
   describe its *meaning*, constraints, and defaults.
4. **Lead with a one-line summary** in the imperative mood, then optional detail paragraphs.
5. Use `@param`, `@returns`, `@example`, `@throws`, `@remarks`, `@deprecated` where they add
   information. Don't add empty tags.
6. **Don't over-comment internals.** Private helpers get a short line only when the intent
   isn't obvious from the code. Never narrate what the next line literally does.
7. Keep user-facing documentation (guides, examples) on **hodgef.com/apiker** — update it there
   when you change or add public APIs.

## Function template

```ts
/**
 * Resolves the Durable Object instance id for a given object name.
 *
 * When no explicit id is supplied, the id is derived from `objectStateMapping`
 * (e.g. the caller's signed IP), falling back to `"default"`.
 *
 * @param objectName Name of the Durable Object class; must be one of the names
 *   passed to `apiker.init({ objects })`.
 * @param objectId Explicit instance id. Omit to derive it from the state mapping.
 * @returns A set of async storage methods: `get`, `put`, `delete`, `deleteAll`, `list`.
 * @example
 * const profile = await state("Users", userId).get("profile");
 */
```

## Interface template

```ts
/** Options accepted by `apiker.init()`. */
export interface Options {
  /** Route pattern → handler function or `"Controller.method"` string. */
  routes?: Routes;
  /** Durable Object class names to generate and export. */
  objects?: string[];
  /** Enable the built-in `/auth/*` routes. Defaults to `false`. */
  authRoutes?: boolean;
}
```

Prefer per-member doc comments on interfaces so editors show them per property.

## Existing conventions in this repo

- The `Apiker` class and its methods already use `/** ... */` summaries (see
  `src/components/Apiker/Apiker.ts`). Match that voice and brevity.
- Warnings use a leading emoji sparingly, e.g. the `⚠️` note telling consumers not to
  instantiate `Apiker` directly. Keep such call-outs short.
- State helpers document `@param` for `objectName` / `objectId` / `isCloudflareObjectId`
  (see `src/components/State/State.ts`) — keep that trio consistent when you touch state code.

## Checklist before finishing a change

- [ ] Every new/changed export has a doc-comment summary.
- [ ] `@param`/`@returns` present where they add meaning (not restating types).
- [ ] Public example added for non-trivial APIs.
- [ ] Updated hodgef.com/apiker if the public API changed.
- [ ] `npm test` passes.
