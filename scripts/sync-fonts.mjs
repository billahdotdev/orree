/**
 * Copies the exact font weights we use out of the @fontsource packages into
 * public/fonts/ under stable, un-hashed filenames.
 *
 * Stable names matter: index.html preloads two of these by path, and a
 * content-hashed name would break the preload on every dependency bump.
 * Because the names are stable, /fonts/* is cached immutable for a year in
 * public/_headers — so if you ever swap a font, change the filename too.
 *
 * Weights are deliberately minimal. Audited against the codebase:
 * display uses 600 and 800, body uses 400 and 600. Everything else was
 * either unused or being synthesised by the browser.
 *
 * Run: npm run fonts:sync
 */
import { mkdirSync, copyFileSync, existsSync } from "node:fs";

const FAMILIES = {
  "anek-bangla": [600, 800],
  "hind-siliguri": [400, 600],
};
const SUBSETS = ["bengali", "latin"];
const OUT = "public/fonts";

mkdirSync(OUT, { recursive: true });

let copied = 0;
for (const [family, weights] of Object.entries(FAMILIES)) {
  for (const weight of weights) {
    for (const subset of SUBSETS) {
      const from = `node_modules/@fontsource/${family}/files/${family}-${subset}-${weight}-normal.woff2`;
      const to = `${OUT}/${family}-${subset}-${weight}.woff2`;
      if (!existsSync(from)) {
        console.error(`missing: ${from} — run npm install first`);
        process.exit(1);
      }
      copyFileSync(from, to);
      copied++;
    }
  }
}
console.log(`fonts:sync — ${copied} files copied to ${OUT}/`);
