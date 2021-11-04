 <div align="center">
 <img align="center" width="230" src="https://i.imgur.com/iHgtvmg.png" />
  <h2>Typescript Library Boilerplate Basic</h2>
  <blockquote>Minimal Library Starter Kit for your Typescript projects</blockquote>
 
 <a href="https://www.npmjs.com/package/@hodgef/ts-library-boilerplate-basic"><img src="https://badgen.net/npm/v/@hodgef/ts-library-boilerplate-basic?color=blue" alt="npm version"></a> <a href="https://github.com/hodgef/ts-library-boilerplate"><img src="https://img.shields.io/github/last-commit/hodgef/ts-library-boilerplate" alt="latest commit"></a> <a href="https://github.com/hodgef/ts-library-boilerplate-basic/actions"><img alt="Build Status" src="https://github.com/hodgef/ts-library-boilerplate-basic/workflows/Build/badge.svg?color=green" /></a> <a href="https://github.com/hodgef/ts-library-boilerplate-basic/actions"> <img alt="Publish Status" src="https://github.com/hodgef/ts-library-boilerplate-basic/workflows/Publish/badge.svg?color=green" /></a>

<strong>For a plain Javascript alternative, check out [js-library-boilerplate-basic](https://github.com/hodgef/js-library-boilerplate-basic).</strong>

</div>

## ⭐️ Features

- Webpack 5
- Babel 7
- Hot reloading (`npm start`)
- Automatic Types file generation (index.d.ts)
- UMD exports, so your library works everywhere.
- Jest unit testing
- Customizable file headers for your build [(Example 1)](https://github.com/hodgef/ts-library-boilerplate-basic/blob/master/build/index.js) [(Example2)](https://github.com/hodgef/ts-library-boilerplate-basic/blob/master/build/css/index.css)
- Daily [dependabot](https://dependabot.com) dependency updates

## 📦 Getting Started

```
git clone https://github.com/hodgef/ts-library-boilerplate-basic.git myLibrary
npm install
```

## 💎 Customization

> Before shipping, make sure to:

1. Edit `LICENSE` file
2. Edit `package.json` information (These will be used to generate the headers for your built files)
3. Edit `library: "MyLibrary"` with your library's export name in `./webpack.config.js`

## 🚀 Deployment

1. `npm publish`
2. Your users can include your library as usual

### npm

```
import MyLibrary from 'my-library';
const libraryInstance = new MyLibrary();
...
```

### self-host/cdn

```
<script src="build/index.js"></script>

const MyLibrary = window.MyLibrary.default;
const libraryInstance = new MyLibrary();
...
```

## ✅ Libraries built with this boilerplate

> Made a library using this starter kit? Share it here by [submitting a pull request](https://github.com/hodgef/ts-library-boilerplate-basic/pulls)!

- [simple-keyboard](https://github.com/hodgef/simple-keyboard) - Javascript Virtual Keyboard
- [react-simple-keyboard](https://github.com/hodgef/react-simple-keyboard) - React Virtual Keyboard
- [simple-keyboard-layouts](https://github.com/hodgef/simple-keyboard-layouts) - Keyboard layouts for simple-keyboard
