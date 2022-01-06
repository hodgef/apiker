import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import nodePolyfills from 'rollup-plugin-node-polyfills';
import replace from '@rollup/plugin-replace';

export default [
  {
    input: "src/pages.ts",
    output: [
      {
        name: 'pages',
        file: "./src/components/Static/staticPages.ts",
        format: "iife"
      }
    ],
    external: ['apiker', "react", "react-dom", "react-dom/server", "cfw-crypto", "cfw-bcrypt"],
    plugins: [
      replace({
        "process.env.NODE_ENV": JSON.stringify("production")
      }),
      nodePolyfills(),
      resolve({
        browser: true
      }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.comp.json" }),
      {
        name: 'modify-output',
        renderChunk: (source) => {
          return {
            code: `export const apikerPagesStatic = \`var cryptojs = bcrypt = function(){}; ${source}\`;`
          }
        }
      },
    ],
  }
];
