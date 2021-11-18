#!/usr/bin/env node
const { spawnSync } = require("child_process");
const { resolve } = require("path");

const dirName = process.argv[2];
const cmd = "node --no-warnings " + resolve(__dirname, `../dist/scripts/create.js ${dirName}`);
spawnSync(cmd, { stdio: "inherit", shell: true });