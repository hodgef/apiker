import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import replace from '@rollup/plugin-replace';
import { string } from "rollup-plugin-string";
import image from '@rollup/plugin-image';
import alias from '@rollup/plugin-alias';
import path from 'path';

const globals = {
  "react": "React",
  "react-dom": "ReactDOM",
  "apiker": "null",
  "react-dom/server": "null",
  "cfw-crypto": "function(){}",
  "cfw-bcrypt": "function(){}"
};

export default [
  {
    input: "src/pages.ts",
    output: {
      name: 'pages',
      file: "./src/components/Static/staticPages.ts",
      format: "iife",
      globals
    },
    external: Object.keys(globals),
    plugins: [
      replace({
        "process.env.NODE_ENV": JSON.stringify("production")
      }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.comp.json" }),
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
      {
        name: 'modify-output',
        renderChunk: (source) => {
          return {
            code: `export const apikerPagesStatic = \`${source}\`;`
          }
        }
      },
    ],
  }
];
