import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = resolve(projectRoot, "dist");
const staticEntries = [
  "index.html",
  "styles.css",
  "script.js",
  "favicon.svg",
  "og-image.svg",
  "robots.txt",
  "sitemap.xml",
  "demos",
  "src",
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const entry of staticEntries) {
  await cp(resolve(projectRoot, entry), resolve(outputDirectory, entry), {
    recursive: true,
  });
}

console.log(`Static site built in ${outputDirectory}`);
