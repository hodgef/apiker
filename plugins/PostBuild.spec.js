const fs = require("fs");
const os = require("os");
const path = require("path");
const PostBuild = require("./PostBuild");

/**
 * Unit tests for the environment variables the build generates.
 *
 * A project only gets a .env once, so the interesting case is an existing one
 * that predates a newly required variable.
 */
describe("PostBuild env generation", () => {
  let dir;
  let plugin;

  const envPath = () => path.join(dir, ".env");
  const readEnv = () => fs.readFileSync(envPath(), "utf8");
  const valueOf = (contents, key) => (contents.match(new RegExp(`${key} = "([^"]+)"`)) || [])[1];

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "apiker-postbuild-"));
    plugin = new PostBuild(dir, null, null);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe("createEnv", () => {
    it("writes every required variable", () => {
      const env = plugin.createEnv();
      const contents = readEnv();

      ["APIKER_SECRET_KEY", "ADMP_SETUP_SECRET", "ADMP_LOCAL_ADMIN_EMAIL", "ADMP_LOCAL_ADMIN_PASSWORD"].forEach((key) => {
        expect(env[key]).toEqual(expect.any(String));
        expect(valueOf(contents, key)).toBe(env[key]);
      });
    });

    it("gives each variable its own value", () => {
      const env = plugin.createEnv();
      expect(env.APIKER_SECRET_KEY).not.toBe(env.ADMP_SETUP_SECRET);
    });

    it("generates values long enough to be unguessable", () => {
      const env = plugin.createEnv();
      expect(env.ADMP_SETUP_SECRET).toMatch(/^[a-f0-9]{60}$/);
    });

    it("generates a local admin login usable by registerUserAction", () => {
      const env = plugin.createEnv();

      // isEmail's shape check.
      expect(env.ADMP_LOCAL_ADMIN_EMAIL).toMatch(/^[\w.-]+@[\w.-]+\.\w+$/);
      // isRequiredLength defaults to a 20-char cap, unlike the other secrets here.
      expect(env.ADMP_LOCAL_ADMIN_PASSWORD.length).toBeGreaterThanOrEqual(5);
      expect(env.ADMP_LOCAL_ADMIN_PASSWORD.length).toBeLessThanOrEqual(20);
    });
  });

  describe("ensureEnv", () => {
    it("adds a variable an existing project is missing", () => {
      fs.writeFileSync(envPath(), 'APIKER_SECRET_KEY = "existing"\n');

      const env = plugin.ensureEnv({ APIKER_SECRET_KEY: "existing" });
      const contents = readEnv();

      expect(env.APIKER_SECRET_KEY).toBe("existing");
      expect(env.ADMP_SETUP_SECRET).toMatch(/^[a-f0-9]{60}$/);
      expect(valueOf(contents, "ADMP_SETUP_SECRET")).toBe(env.ADMP_SETUP_SECRET);
    });

    it("leaves an existing value untouched", () => {
      fs.writeFileSync(
        envPath(),
        'APIKER_SECRET_KEY = "existing"\nADMP_SETUP_SECRET = "already-set"\n'
      );

      const env = plugin.ensureEnv({
        APIKER_SECRET_KEY: "existing",
        ADMP_SETUP_SECRET: "already-set",
      });

      expect(env.ADMP_SETUP_SECRET).toBe("already-set");
      expect(readEnv().match(/ADMP_SETUP_SECRET/g)).toHaveLength(1);
    });

    it("does not rewrite the file when nothing is missing", () => {
      const original =
        'APIKER_SECRET_KEY = "a"\nADMP_SETUP_SECRET = "b"\n' +
        'ADMP_LOCAL_ADMIN_EMAIL = "c"\nADMP_LOCAL_ADMIN_PASSWORD = "d"\n';
      fs.writeFileSync(envPath(), original);

      plugin.ensureEnv({
        APIKER_SECRET_KEY: "a",
        ADMP_SETUP_SECRET: "b",
        ADMP_LOCAL_ADMIN_EMAIL: "c",
        ADMP_LOCAL_ADMIN_PASSWORD: "d",
      });

      expect(readEnv()).toBe(original);
    });

    it("is idempotent across repeated builds", () => {
      fs.writeFileSync(envPath(), 'APIKER_SECRET_KEY = "existing"\n');

      const first = plugin.ensureEnv({ APIKER_SECRET_KEY: "existing" });
      const afterFirst = readEnv();
      const second = plugin.ensureEnv({ ...first });

      expect(second.ADMP_SETUP_SECRET).toBe(first.ADMP_SETUP_SECRET);
      expect(readEnv()).toBe(afterFirst);
    });
  });

  /**
   * Rewriting a generated file with identical contents restarts watchers such as
   * `wrangler dev`, which is what made local development crash.
   */
  describe("writeIfChanged", () => {
    const target = () => path.join(dir, "generated.toml");

    it("creates a file that does not exist yet", () => {
      expect(plugin.writeIfChanged(target(), "contents")).toBe(true);
      expect(fs.readFileSync(target(), "utf8")).toBe("contents");
    });

    it("does not touch the file when the contents match", () => {
      plugin.writeIfChanged(target(), "contents");
      const mtime = fs.statSync(target()).mtimeMs;

      expect(plugin.writeIfChanged(target(), "contents")).toBe(false);
      expect(fs.statSync(target()).mtimeMs).toBe(mtime);
    });

    it("writes when the contents changed", () => {
      plugin.writeIfChanged(target(), "contents");

      expect(plugin.writeIfChanged(target(), "updated")).toBe(true);
      expect(fs.readFileSync(target(), "utf8")).toBe("updated");
    });
  });

  /**
   * Namespaces are indexed by worker script name, which projects should not have to
   * repeat by hand.
   */
  describe("wranglerVars", () => {
    it("derives the script name from the app name", () => {
      expect(plugin.wranglerVars({ A: "1" }, "my-worker")).toEqual({
        CLOUDFLARE_SCRIPT_NAME: "my-worker",
        A: "1",
      });
    });

    it("lets an explicit value win", () => {
      const vars = plugin.wranglerVars({ CLOUDFLARE_SCRIPT_NAME: "chosen" }, "my-worker");

      expect(vars.CLOUDFLARE_SCRIPT_NAME).toBe("chosen");
    });

    it("leaves the variables alone when there is no app name", () => {
      expect(plugin.wranglerVars({ A: "1" }, undefined)).toEqual({ A: "1" });
    });
  });
});
