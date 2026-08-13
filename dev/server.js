/**
 * Admin panel sandbox.
 *
 * Serves the panel components from local source while proxying every `/admp`
 * request to a real apiker deployment, so actions run against real data with a
 * real session and CSRF token. Dev-only: nothing here is part of a build output.
 *
 *   npm run dev:panel
 *   $env:ADMP_TARGET="https://your-deployment.example.com"; npm run dev:panel
 *
 * Default target is `wrangler dev` on 127.0.0.1:8787.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = Number(process.env.PORT) || 5010;
const TARGET = (process.env.ADMP_TARGET || "http://127.0.0.1:8787").replace(/\/$/, "");
const ROOT = path.resolve(__dirname, "..");
const BUNDLE = path.join(__dirname, ".build", "pages.js");
const PANEL_CSS = path.join(ROOT, "src", "components", "Admin", "assets", "css", "panel.css");

const HYDRATE_PROPS = /window\.appRoot\("hydrate",\s*"AdminPanelPage",\s*(\{[\s\S]*?\})\);/;

const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });

/** Cookies issued for an https target would be dropped on a plain http sandbox. */
const relaxCookie = (value) => value.replace(/;\s*Secure/gi, "");

const forward = (req, url, body) => {
  const headers = {};

  ["cookie", "content-type", "x-apiker-csrf", "accept"].forEach((name) => {
    if (req.headers[name]) headers[name] = req.headers[name];
  });

  return fetch(TARGET + url, {
    method: req.method,
    headers,
    body: body && body.length ? body : undefined,
    redirect: "manual"
  });
};

const passCookies = (upstream, headers) => {
  const setCookie = upstream.headers.getSetCookie?.() || [];

  if (setCookie.length) {
    headers["Set-Cookie"] = setCookie.map(relaxCookie);
  }

  return headers;
};

const shell = (props) => `<!DOCTYPE html>
<html lang="en">
    <head>
        <title>${props.appName || "Apiker"} — Admin sandbox</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        <style>
            body { margin: 0px; }
            .material-symbols-outlined {
                font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            }
            ${fs.readFileSync(PANEL_CSS, "utf8")}
            .admp-dev-bar {
                position: fixed; z-index: 60; left: 1rem; bottom: 1rem;
                display: flex; align-items: center; gap: .375rem;
                padding: .375rem .75rem;
                border: 1px solid var(--admp-border); border-radius: 999px;
                background: var(--admp-background); box-shadow: var(--admp-shadow-md);
                color: var(--admp-muted-foreground); font-size: .75rem;
                font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            }
            .admp-dev-bar b { color: var(--admp-foreground); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        </style>
    </head>
    <body>
        <div id="app"></div>
        <div class="admp-dev-bar">sandbox &rarr; <b>${TARGET}</b></div>
        <script src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.development.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.development.js"></script>
        <script src="/dev/bundle.js"></script>
        <script>
            (function(){
                var lib = (typeof pages !== "undefined" && (pages.default || pages)) || {};
                var root = ReactDOM.createRoot(document.getElementById("app"));
                window.initializeAppHelper = function(){
                    return { setProps: function(newProps){ root.render(lib.AdminPanelPage(newProps)); } };
                };
                root.render(lib.AdminPanelPage(${JSON.stringify(props)}));

                var rev;
                setInterval(function(){
                    fetch("/dev/rev").then(function(r){ return r.text(); }).then(function(next){
                        if(rev && rev !== next){ location.reload(); }
                        rev = next;
                    }).catch(function(){});
                }, 1000);
            })();
        </script>
    </body>
</html>`;

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);

  if (pathname === "/dev/bundle.js") {
    if (!fs.existsSync(BUNDLE)) {
      res.writeHead(503, { "Content-Type": "text/javascript" });
      return res.end("console.error('Bundle still building, reloading shortly.');");
    }
    res.writeHead(200, { "Content-Type": "text/javascript" });
    return res.end(fs.readFileSync(BUNDLE));
  }

  if (pathname === "/dev/rev") {
    const stamp = fs.existsSync(BUNDLE) ? String(fs.statSync(BUNDLE).mtimeMs) : "0";
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end(stamp);
  }

  const body = await readBody(req);

  /**
   * The shell is local; the props behind it (session, CSRF token, setup state)
   * are whatever the target's own `/admp` page rendered.
   */
  if (pathname === "/" || pathname === "/admp") {
    let upstream;

    try {
      upstream = await forward(req, "/admp", null);
    } catch (error) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      return res.end(`Could not reach ${TARGET}: ${error.message}`);
    }

    const html = await upstream.text();
    const match = html.match(HYDRATE_PROPS);

    if (!match) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      return res.end(
        `${TARGET}/admp did not return a panel page (status ${upstream.status}). ` +
          "Check that adminPanel is enabled and that any admin whitelist allows this machine."
      );
    }

    res.writeHead(200, passCookies(upstream, { "Content-Type": "text/html" }));
    return res.end(shell(JSON.parse(match[1])));
  }

  if (pathname.startsWith("/admp")) {
    let upstream;

    try {
      upstream = await forward(req, req.url, body);
    } catch (error) {
      res.writeHead(502, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: error.message }));
    }

    const payload = Buffer.from(await upstream.arrayBuffer());
    const headers = passCookies(upstream, {
      "Content-Type": upstream.headers.get("content-type") || "application/json"
    });

    res.writeHead(upstream.status, headers);
    return res.end(payload);
  }

  res.writeHead(404);
  res.end();
});

const watcher = spawn(
  process.execPath,
  [require.resolve("rollup/dist/bin/rollup"), "-c", "dev/rollup.config.js", "--watch"],
  { cwd: ROOT, stdio: "inherit" }
);

const stop = () => {
  watcher.kill();
  process.exit(0);
};

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

server.listen(PORT, () => {
  console.log(`\n> Admin panel sandbox: http://localhost:${PORT} (target: ${TARGET})\n`);
});
