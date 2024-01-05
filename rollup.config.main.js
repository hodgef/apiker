import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import copy from "rollup-plugin-copy";
import nodePolyfills from 'rollup-plugin-node-polyfills';
import replace from '@rollup/plugin-replace';
import { string } from "rollup-plugin-string";
import image from '@rollup/plugin-image';
import alias from '@rollup/plugin-alias';
import path from 'path';

const globals = {
  "react": "React",
  "react-dom": "ReactDOM"
};

const packageJson = require("./package.json");

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        name: "Apiker",
        exports: "named",
        globals
      },
      {
        file: packageJson.module,
        format: "esm",
        globals
      }
    ],
    external: Object.keys(globals),
    plugins: [
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"),
        preventAssignment: true
      }),
      nodePolyfills(),
      resolve({
        browser: true
      }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      alias({
        entries: {
          '@panelAssets': path.resolve(__dirname, './src/components/Admin/assets')
        }
      }),
      image(),
      string({
        // Required to be specified
        include: "**/*.css",
      }),
      copy({
        targets: [
          { src: "plugins/PostBuild.js", dest: "dist/plugins" },
          { src: "scripts/create.js", dest: "dist/scripts" }
        ]
      })
    ],
  },
  {
    input: "dist/esm/index.d.ts",
    output: [{ file: "dist/types/index.d.ts", format: "esm" }],
    plugins: [dts()],
  },
];
