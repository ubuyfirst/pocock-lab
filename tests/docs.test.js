import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// The README's Layout table names every page and module, so it can't drift.
test("README names every page in site/ and every module in site/src/", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  const files = [
    ...readdirSync(new URL("../site/", import.meta.url)).filter((f) => f.endsWith(".html")).map((f) => `site/${f}`),
    ...readdirSync(new URL("../site/src/", import.meta.url)).filter((f) => f.endsWith(".js")).map((f) => `site/src/${f}`),
  ];
  const missing = files.filter((f) => !readme.includes(`\`${f}\``));
  assert.deepEqual(missing, [], `Add these to the Layout table in README.md: ${missing.join(", ")}`);
});
