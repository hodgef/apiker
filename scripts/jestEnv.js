/**
 * Custom Jest environment that exposes the Web/Workers runtime globals
 * (Response, Request, Headers, fetch, ...) inside the sandboxed test realm.
 *
 * Jest 27's node environment does not install these globals, but the Apiker
 * library and its tests rely on them (they exist on Cloudflare Workers and on
 * modern Node). This environment copies them from the host process without
 * adding any new dependency.
 */
const NodeEnvironmentModule = require("jest-environment-node");
const NodeEnvironment = NodeEnvironmentModule.default || NodeEnvironmentModule.TestEnvironment || NodeEnvironmentModule;

const WEB_GLOBALS = [
  "Response",
  "Request",
  "Headers",
  "fetch",
  "FormData",
  "Blob",
  "File",
  "ReadableStream",
  "WritableStream",
  "TransformStream",
  "TextEncoder",
  "TextDecoder",
  "structuredClone",
  "crypto",
];

class ApikerTestEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();
    for (const name of WEB_GLOBALS) {
      if (this.global[name] === undefined && globalThis[name] !== undefined) {
        this.global[name] = globalThis[name];
      }
    }
    // Cloudflare Workers expose the global scope as `self`; some libs (cfw-bcrypt) rely on it.
    if (this.global.self === undefined) {
      this.global.self = this.global;
    }
  }
}

module.exports = ApikerTestEnvironment;
