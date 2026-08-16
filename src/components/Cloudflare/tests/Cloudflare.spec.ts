import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { apiker } from "../../Apiker";
import { getInstanceList } from "../Cloudflare";

/**
 * Unit tests for resolving a Durable Object namespace.
 *
 * The name a project passes to `apiker.init` is a display name and frequently
 * differs from the worker script, which is what Cloudflare indexes namespaces by.
 */

let namespaces: any[];
let requestedNamespaceId: string | undefined;

const jsonResponse = (payload: any) => ({ json: async () => payload });

beforeEach(() => {
  apiker.env = {
    CLOUDFLARE_ACCOUNT_ID: "acct",
    CLOUDFLARE_EMAIL: "ops@example.com",
    CLOUDFLARE_API_KEY: "key",
  };
  namespaces = [];
  requestedNamespaceId = undefined;

  (globalThis as any).fetch = jest.fn(async (url: string) => {
    if (url.endsWith("/durable_objects/namespaces")) {
      return jsonResponse({ result: namespaces });
    }

    requestedNamespaceId = url.split("/namespaces/")[1]?.split("/")[0];
    return jsonResponse({ result: [{ id: "instance-1" }] });
  }) as any;
});

describe("getInstanceList", () => {
  it("uses the namespace belonging to the named script", async () => {
    namespaces = [
      { id: "ns-other", script: "other-worker", class: "Users" },
      { id: "ns-mine", script: "my-worker", class: "Users" },
    ];

    await getInstanceList("my-worker", "Users");

    expect(requestedNamespaceId).toBe("ns-mine");
  });

  it("falls back to the only namespace with that class", async () => {
    namespaces = [
      { id: "ns-mine", script: "the-actual-script", class: "Users" },
      { id: "ns-logs", script: "the-actual-script", class: "Logs" },
    ];

    await getInstanceList("A Display Name", "Users");

    expect(requestedNamespaceId).toBe("ns-mine");
  });

  it("names the candidates when the class exists on several scripts", async () => {
    namespaces = [
      { id: "ns-a", script: "worker-a", class: "Users" },
      { id: "ns-b", script: "worker-b", class: "Users" },
    ];

    await expect(getInstanceList("Apiker", "Users")).rejects.toThrow(
      /worker-a, worker-b.*CLOUDFLARE_SCRIPT_NAME/s
    );
  });

  it("reports a class that has no namespace at all", async () => {
    namespaces = [{ id: "ns-logs", script: "worker-a", class: "Logs" }];

    await expect(getInstanceList("worker-a", "Users")).rejects.toThrow(
      "Namespace for object Users not found"
    );
  });
});

/**
 * A deployment holds one object instance per user, so the listing is paged: a
 * sweep that stops at the first page silently leaves most of them untouched.
 */
describe("instance paging", () => {
  const pages: any[] = [];
  let requestedUrls: string[];

  beforeEach(() => {
    pages.length = 0;
    requestedUrls = [];
    namespaces = [{ id: "ns-mine", script: "my-worker", class: "Users" }];

    (globalThis as any).fetch = jest.fn(async (url: string) => {
      if (url.includes("/durable_objects/namespaces?") || url.endsWith("/durable_objects/namespaces")) {
        return jsonResponse({ result: namespaces });
      }

      requestedUrls.push(url);
      return jsonResponse(pages[requestedUrls.length - 1]);
    }) as any;
  });

  it("follows the cursor until the namespace is exhausted", async () => {
    pages.push(
      { result: [{ id: "a" }], result_info: { cursor: "next" } },
      { result: [{ id: "b" }], result_info: {} }
    );

    const response: any = await getInstanceList("my-worker", "Users");

    expect(response.result.map((i: any) => i.id)).toEqual(["a", "b"]);
    expect(requestedUrls[1]).toContain("cursor=next");
  });

  it("asks for a full page at a time", async () => {
    pages.push({ result: [], result_info: {} });

    await getInstanceList("my-worker", "Users");

    expect(requestedUrls[0]).toContain("limit=1000");
  });

  it("stops after one request when there is no cursor", async () => {
    pages.push({ result: [{ id: "a" }] });

    await getInstanceList("my-worker", "Users");

    expect(requestedUrls).toHaveLength(1);
  });

  it("passes a failed first page through untouched", async () => {
    pages.push({ success: false, errors: [{ message: "nope" }] });

    const response: any = await getInstanceList("my-worker", "Users");

    expect(response.success).toBe(false);
    expect(response.errors[0].message).toBe("nope");
  });

  it("keeps what it already read when a later page fails", async () => {
    pages.push(
      { result: [{ id: "a" }], result_info: { cursor: "next" } },
      { success: false, errors: [{ message: "nope" }] }
    );

    const response: any = await getInstanceList("my-worker", "Users");

    expect(response.result.map((i: any) => i.id)).toEqual(["a"]);
  });
});
