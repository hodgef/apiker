 <div>
 <p align="center">
  <a href="https://github.com/hodgef/apiker" title="View Documentation"><img width="110" src="https://user-images.githubusercontent.com/25509135/142580530-07c335a7-5a11-47dd-8acc-b45842e8da32.png" /></a>
 </p>
 
 <div align="center">
  <p>Create Serverless APIs using Cloudflare Workers, Durable Objects & Wrangler</p>

 <a href="https://www.npmjs.com/package/apiker"><img src="https://badgen.net/npm/v/apiker?color=blue" alt="npm version"></a> <a href="https://github.com/hodgef/apiker"><img src="https://img.shields.io/github/last-commit/hodgef/apiker" alt="latest commit"></a> <a href="https://discord.com/invite/SJexsCG"><img src="https://img.shields.io/discord/498978399801573396.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2" alt="join our chat"></a>
</div>
 
</div>

## Features

- Easy routing & state management
- Basic JWT-based Auth (register, login, refresh token, delete user)
- Automatically updates [Durable Object](https://developers.cloudflare.com/workers/learning/using-durable-objects) migrations, classes and bindings so you don't have to.
- Get and set object state easily. e.g: `await state().get(paramInCommonObj);` or `await state("MyObjectName").put({ myParam });`

## Install
To get started with your Apiker project, run:

```
npx apiker your-site-name
```

## 📦 Usage

Once your project is created, you can edit the [`app.toml`](https://github.com/hodgef/apiker-demo/blob/master/app.toml) and [`src/`](https://github.com/hodgef/apiker-demo/tree/master/src) files as desired :

### Counter Example

#### src/index.js

```js
import { apiker } from "apiker";
import { getUserCounter } from "./controllers/counter";
import objects from "./objects.json";

const routes = {
  "/users/:id/counter": getUserCounter
};

apiker.init({
  routes,
  objects,
  exports,
  auth: false
});
```

#### controllers/counter.ts

```ts
import { Handler, res } from "apiker";

export const getUserCounter: Handler = async ({ state }) => {
  const initialCount = (await state().get("counter")) ?? 0;
  const counter = initialCount + 1;
  await state().put({ counter });
  return res({ counter });
};
```

#### \> GET /users/test/counter

```
{"counter":1}
{"counter":2}
...
```
Demo: https://apiker-demo.spv.workers.dev/users/test/counter

Full example: [Apiker Demo](https://github.com/hodgef/apiker-demo) or `npx apiker my-demo`

## 🔓 Auth

When the **auth** option is set to true, Apiker will register the following default routes:

`/auth/register`
`/auth/login`
`/auth/refresh`
`/auth/delete`

#### \> POST [/auth/register](https://github.com/hodgef/apiker/blob/86033015a3f320a35867db01e277189e6b109378/src/components/Auth/Auth.ts#L10)
Request body:

```
email: xxxxx
password: xxxxx
```
Response (example):

```json
{
    "userId": "6e9a13f1577f397b9989c4a856f2524cfb9093b4e3d7feea728e6ec24aa0663c",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiPiI2ZTlhMTNmMTU3N2YzOTdiOTk4OWM0YTg1NmYyNTc0Y2ZiOTA5M2I0ZTNkN2ZlZWE3MjhlNmVjMjRhYTA2NjNjIiwiY2xpZW50SWQiOiJYQ0VxT1FsSTllWjIwV1lwTmhwRjdGZ0pwQWhuamlHTTU2cHE0NW5iYnFJPSIsImV4cCI6MTYzNzIyNjY3MzU3OH0=.TRfp8bJeb9VBDobm8MAu4GirCCLwL+Cq+W+mIgSSizY=",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ZTlhSTNmMTU3N2YzOTdiOTk4OWM0YTg1NmYyNTc0Y2ZiOTA5M2I0ZTNkN2ZlZWE3MjhlNmVjMjRhYTA2NjNjIiwiY2xpZW50SWQiOiJYQ0VxT1FsSTllWjIwV1lwTmhwRjdGZ0pwQWhuamlHTTU2cHE0NW5iYnFJPSJ9.Q535MhFUb4WhfsZPcxpAa18WzN4I1xKllT+2WHXyg7M="
}
```
#### Notes:

- For the implementation details, check out the source at [Auth.ts](https://github.com/hodgef/apiker/blob/master/src/components/Auth/Auth.ts)

- If you would like to implement your own auth, you can always copy the Auth.ts routes to your Apiker project and edit the authentication flow as needed.

- ⚠️ <b>Note:</b> Auth routes are in active development. There might be signifiant changes in future versions. PRs and suggestions are always welcome!

## 🚀 Development & Deployment

0. Install [Cloudflare Wrangler](https://developers.cloudflare.com/workers/cli-wrangler/install-update)
1. Edit your Apiker project's app.toml
2. `npm run build`
3. `wrangler publish`

⚠️ <b>Note:</b> Make sure you've read the <a href="https://developers.cloudflare.com/workers/learning/using-durable-objects">Durable Object</a> documentation if you need to install <a href="https://developers.cloudflare.com/workers/cli-wrangler/install-update">wrangler</a> or have any doubts about <code>app.toml</code> (also known as wrangler.toml).

## ✅ Contributing

PRs and issues are always welcome. Feel free to submit any issues you have at:
[https://github.com/hodgef/apiker/issues](https://github.com/hodgef/apiker/issues)
