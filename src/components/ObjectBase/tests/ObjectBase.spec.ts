import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import ObjectBase from "../ObjectBase";

/**
 * A mock of the Durable Object `state.storage` API backed by a plain object.
 */
const makeStorage = () => {
  const store: Record<string, any> = {};
  return {
    store,
    get: jest.fn(async (k: string | string[]) =>
      Array.isArray(k)
        ? new Map(k.filter((key) => key in store).map((key) => [key, store[key]]))
        : store[k]
    ),
    put: jest.fn(async (k: string, v: any) => {
      store[k] = v;
    }),
    delete: jest.fn(async (k: string) => {
      delete store[k];
    }),
    deleteAll: jest.fn(async () => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    list: jest.fn(async () => new Map(Object.entries(store))),
  };
};

const req = (path: string, body?: any) =>
  new Request(`https://durable-object${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

/**
 * Unit tests for the ObjectBase Durable Object request dispatcher.
 */
describe("ObjectBase.fetch", () => {
  let storage: ReturnType<typeof makeStorage>;
  let ob: any;

  beforeEach(() => {
    apiker.responseHeaders = new Headers({ "content-type": "application/json" });
    apiker.debug = false;
    storage = makeStorage();
    ob = new ObjectBase({ storage });
  });

  it("/put stores every property in the body", async () => {
    const r = await ob.fetch(req("/put", { a: 1, b: 2 }));
    expect(r.status).toBe(200);
    expect(storage.put).toHaveBeenCalledTimes(2);
    expect(storage.store).toEqual({ a: 1, b: 2 });
  });

  it("/get returns a stored value", async () => {
    storage.store.name = "Ada";
    const r = await ob.fetch(req("/get", { propertyName: "name" }));
    expect(await r.json()).toBe("Ada");
  });

  it("/increment starts counters from zero and returns their totals", async () => {
    const r = await ob.fetch(req("/increment", { increments: { hits: 1, views: 3 } }));
    expect(await r.json()).toEqual({ hits: 1, views: 3 });
    expect(storage.store).toEqual({ hits: 1, views: 3 });
  });

  it("/increment adds to the value already stored", async () => {
    storage.store.hits = 41;
    const r = await ob.fetch(req("/increment", { increments: { hits: 1 } }));
    expect(await r.json()).toEqual({ hits: 42 });
    expect(storage.store.hits).toBe(42);
  });

  it("/increment writes the ring sample to the slot the counter points at", async () => {
    storage.store.hits = 22;
    await ob.fetch(
      req("/increment", {
        increments: { hits: 1 },
        ring: { prefix: "e:", size: 20, from: "hits", value: { name: "page_view" } }
      })
    );
    expect(storage.store["e:3"]).toEqual({ name: "page_view" });
  });

  it("/increment ignores a ring with no slots", async () => {
    await ob.fetch(
      req("/increment", {
        increments: { hits: 1 },
        ring: { prefix: "e:", size: 0, from: "hits", value: { name: "page_view" } }
      })
    );
    expect(Object.keys(storage.store)).toEqual(["hits"]);
  });

  it("/delete removes a single property", async () => {
    storage.store.name = "Ada";
    await ob.fetch(req("/delete", { propertyName: "name" }));
    expect(storage.delete).toHaveBeenCalledWith("name");
    expect(storage.store.name).toBeUndefined();
  });

  it("/deleteall clears all properties", async () => {
    storage.store.a = 1;
    storage.store.b = 2;
    await ob.fetch(req("/deleteall"));
    expect(storage.deleteAll).toHaveBeenCalled();
    expect(storage.store).toEqual({});
  });

  it("/list returns all entries as an object", async () => {
    storage.store.a = 1;
    storage.store.b = 2;
    const r = await ob.fetch(req("/list", {}));
    expect(await r.json()).toEqual({ a: 1, b: 2 });
  });

  it("returns 404 for an unknown path", async () => {
    const r = await ob.fetch(req("/unknown", {}));
    expect(r.status).toBe(404);
  });
});
