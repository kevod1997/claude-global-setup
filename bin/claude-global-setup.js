#!/usr/bin/env node

const { runCli } = require("../lib/cli");

runCli().catch((error) => {
  const message = error && error.message ? error.message : String(error);
  console.error(message);
  process.exitCode = error && error.exitCode ? error.exitCode : 1;
});
