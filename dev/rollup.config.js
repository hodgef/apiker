/**
 * Browser bundle for the admin panel sandbox (`npm run dev:panel`).
 *
 * Mirrors rollup.config.comp.js — same entry and loaders — but unminified and
 * emitted to a gitignored folder. Nothing here is published: `files` is `dist`.
 */
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import { string } from "rollup-plugin-string";
import image from "@rollup/plugin-image";
import alias from "@rollup/plugin-alias";
import path from "path";

const globals = {
  react: "React",
  "react-dom": "ReactDOM",
  apiker: "null",
  "react-dom/server": "null",
  "cfw-crypto": "function(){}",
  "cfw-bcrypt": "function(){}"
};

export default [
  {
    input: "src/pages.ts",
    output: {
      name: "pages",
      file: "./dev/.build/pages.js",
      format: "iife",
      globals
    },
    external: Object.keys(globals),
    plugins: [
      replace({
        "process.env.NODE_ENV": JSON.stringify("development"),
        preventAssignment: true
      }),
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.comp.json", exclude: ["**/tests/**", "**/*.spec.*"] }),
      alias({
        entries: {
          "@panelAssets": path.resolve(__dirname, "../src/components/Admin/assets")
        }
      }),
      image(),
      string({ include: "**/*.css" })
    ]
  }
];
