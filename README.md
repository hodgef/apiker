 <div>
 <p align="center">
  <a href="https://github.com/hodgef/apiker" title="View Documentation"><img width="110" src="https://user-images.githubusercontent.com/25509135/142580530-07c335a7-5a11-47dd-8acc-b45842e8da32.png" /></a>
 </p>
 
 <div align="center">
  <p>Create Serverless APIs using Cloudflare Workers, Durable Objects & Wrangler</p>

 <a href="https://www.npmjs.com/package/apiker"><img src="https://badgen.net/npm/v/apiker" alt="npm version"></a> <a href="https://github.com/hodgef/apiker/actions"><img alt="Build Status" src="https://github.com/hodgef/apiker/workflows/Build/badge.svg" /></a> <a href="https://github.com/hodgef/apiker/actions"><img alt="Publish Status" src="https://github.com/hodgef/apiker/workflows/Publish/badge.svg" /></a> <a href="https://discord.com/invite/SJexsCG"><img src="https://img.shields.io/discord/498978399801573396.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2" alt="join our chat"></a>
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
Note: To run Apiker, you need a Cloudflare account with [Durable Objects access](https://developers.cloudflare.com/workers/platform/pricing#durable-objects).

## 📖 Documentation

Check out the [Apiker documentation](https://hodgef.com/apiker/) site.

## ✅ Contributing 

PRs and issues are welcome. Feel free to submit any issues you have at:
[https://github.com/hodgef/Apiker/issues](https://github.com/hodgef/Apiker/issues)

### Questions? Join the chat

<a href="https://discordapp.com/invite/SJexsCG" title="Join our Discord chat" target="_blank"><img src="https://discordapp.com/api/guilds/498978399801573396/widget.png?style=banner2" align="center"></a>
