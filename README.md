 <div>
 <p align="center">
  <a href="https://github.com/hodgef/apiker" title="View Documentation"><img width="110" src="https://user-images.githubusercontent.com/25509135/142580530-07c335a7-5a11-47dd-8acc-b45842e8da32.png" /></a>
 </p>
 
 <div align="center">
  <p>Create Serverless APIs using Cloudflare Workers, Durable Objects & Wrangler</p>

 <a href="https://www.npmjs.com/package/apiker"><img src="https://badgen.net/npm/v/apiker" alt="npm version"></a> <a href="https://github.com/hodgef/apiker"><img src="https://img.shields.io/github/last-commit/hodgef/apiker" alt="latest commit"></a> <a href="https://discord.com/invite/SJexsCG"><img src="https://img.shields.io/discord/498978399801573396.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2" alt="join our chat"></a>
</div>
 
</div>

## 📦 Installation & Usage

With Apiker, you can create an API in only 3 lines of code
```js
import { apiker, res } from "apiker";
const routes = { "/users/:id/hello": () => res("Hello World!") };

apiker.init({ routes, exports, objects: ["Common"] });

```
> ➡️ GET /users/my-user/hello
```
{ "message": "Hello World!" }
```

Check out the **[Getting Started](https://hodgef.com/apiker/)** page to begin.


Note: To run Apiker, you need a Cloudflare account with [Durable Objects access](https://developers.cloudflare.com/workers/platform/pricing#durable-objects).


## ⭐ Features

- 📕 Routing and State management
- 🔑 Auth, JWT-based (Register, Login, Refresh token, Delete user)
- ⚡️Automatically updates [Durable Object](https://developers.cloudflare.com/workers/learning/using-durable-objects) migrations, classes and bindings so you don't have to.
- 🛑 Rate Limiting / Flooding mitigation
- 🛡️ Firewall support (IP bans with Cloudflare Firewall)
- 📧 Email support (with Sendinblue)
- ⚙️ Simple Admin panel
- 👤 Geolocation handlers
- 📝 Logging handlers

## 📕 Examples

### 1. Basic route handler example
```js
import { res, res_400 } from "apiker";

export const myRouteHandler = async ({
  request, // https://developers.cloudflare.com/workers/runtime-apis/request/
  body, // The body of your request, such as form params or plaintext, depending on request content-type
  headers, // Request headers. Response headers are located at `apiker.responseHeaders`
  matches, // Your query params and route parts
  state // The state method used to interact with permanent storage (check the examples below & docs for more info)
}) => {
  // If we want to allow POST only, we explicitly check for it :
  if(request.method !== "POST"){
     // returns 400 Bad Request error. You can also use `res("Invalid Method", 405)`
     // https://github.com/hodgef/apiker/blob/master/src/components/Response/Response.ts#L10
     return res_400();
  }

  // We'll return the request body passed, for example POST form parameters
  // `res` and `res_000` functions respond with JSON. To respond with raw text you can use `resRaw`
  // https://github.com/hodgef/apiker/blob/master/src/components/Response/Response.ts#L23
  return res({ body });
};
```
```js
const routes = {
  "/users/myroute": myRouteHandler
};
```
Discuss: https://github.com/hodgef/apiker/issues/133

### 2. State: Save value to `Common` object (shared by all visitors)
```js
import { res } from "apiker";

export const example1_saveValueCommon = async ({ state }) => {
  // Using `state` with no parameters will default to the Common object
  const count = ((await state().get("count")) || 0) + 1;
  await state().put({ count });
  return res({ count });
};
```
> ➡️ GET /example1
```
{ "count": 1 }
```
[View Source](https://github.com/hodgef/apiker-examples/blob/master/src/controllers/example1_saveValueCommon.ts) | [View Demo](https://apiker-examples.volted.co/example1)

### 3. State: Save value to a different object, and use one object instance per visitor
```js
import { res } from "apiker";

export const example2_saveValueDiffObject = async ({ state }) => {
  const count = (await state("Example2").get("count") || 0) + 1;
  await state("Example2").put({ count });
  return res({ count });
};

// In index.js ...
apiker.init({
 ...
 objectStateMapping: {
    // One object instance per user IP
    Example2: OBMT.SIGNEDIP
  }
});
```
> ➡️ GET /example2
```
{ "count": 1 }
```
[View Source](https://github.com/hodgef/apiker-examples/blob/master/src/controllers/example2_saveValueDiffObject.ts) | [View Demo](https://apiker-examples.volted.co/example2)

### 4. State: Use one object instance per route parameter value
```js
import { res } from "apiker";

export const example3_instancePerRouteParam = async ({ state, matches }) => {
  // Get username from route (/example3/:username)
  const username = matches.params.username;
  const acceptedUsernames = ["bob", "rob", "todd"];

  if (acceptedUsernames.includes(username)) {
    const { name = username, count = 0 } = (await state("Example3").get("username")) || {};
    const payload = {
      username: {
        name,
        count: count + 1
      }
    };

    await state("Example3").put(payload);
    return res(payload);
  } else {
    return res({ acceptedUsernames });
  }
};


// In index.js ...
apiker.init({
 ...
 objectStateMapping: {
    // Mapped to the parameter `username` in the route
    Example3: "username"
  }
});
```
> ➡️ GET /example3/bob
```
{
    "username": {
        "name": "bob",
        "count": 1
    }
}
```
[View Source](https://github.com/hodgef/apiker-examples/blob/master/src/controllers/example3_instancePerRouteParam.ts) | [View Demo](https://apiker-examples.volted.co/example3/bob)

> For more details and examples, check out the **[Documentation](https://hodgef.com/apiker/)**.

## ✅ Contributing 

PRs and issues are welcome. Feel free to submit any issues you have at:
[https://github.com/hodgef/Apiker/issues](https://github.com/hodgef/Apiker/issues)

### Questions? Join the chat

<a href="https://discordapp.com/invite/SJexsCG" title="Join our Discord chat" target="_blank"><img src="https://discordapp.com/api/guilds/498978399801573396/widget.png?style=banner2" align="center"></a>
