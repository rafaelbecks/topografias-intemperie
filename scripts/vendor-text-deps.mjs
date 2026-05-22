#!/usr/bin/env node
/**
 * Copy three-text + WOFF2 decode deps into lib/ for static deploy (Netlify).
 * Run after npm install: npm run vendor:text
 */
import { cp, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Avoid a "dist/" path — root .gitignore ignores **/dist/**
const copies = [
  ["node_modules/three-text/dist/index.js", "lib/three-text/index.js"],
  ["node_modules/three-text/dist/three/index.js", "lib/three-text/three/index.js"],
  ["node_modules/woff-lib/dist/woff2-decode.js", "lib/woff-lib/woff2-decode.js"],
  ["node_modules/brotli-lib/dist/decode.js", "lib/brotli-lib/decode.js"],
];

await mkdir(join(root, "lib/three-text/three"), { recursive: true });
await mkdir(join(root, "lib/woff-lib"), { recursive: true });
await mkdir(join(root, "lib/brotli-lib"), { recursive: true });

for (const [src, dest] of copies) {
  await cp(join(root, src), join(root, dest));
  console.log(`vendored ${dest}`);
}
