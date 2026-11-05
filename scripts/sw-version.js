// Calcula la versión del service worker a partir del contenido de los archivos que guarda.
//   node scripts/sw-version.js          → actualiza VERSION en sw.js
//   node scripts/sw-version.js --check  → sale con error si está desactualizada
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

export function swFiles(sw = readFileSync("sw.js", "utf8")) {
  const list = sw.match(/const FILES = \[([\s\S]*?)\];/)[1];
  // "./" es la página: su contenido es index.html.
  return [...list.matchAll(/"([^"]+)"/g)].map((m) => (m[1] === "./" ? "index.html" : m[1]));
}

export function computeVersion(sw = readFileSync("sw.js", "utf8")) {
  const h = createHash("sha256");
  for (const f of swFiles(sw)) { h.update(f); h.update(readFileSync(f)); }
  // El propio sw.js también cuenta, sin su línea de versión.
  h.update(sw.replace(/const VERSION = "[^"]*";/, ""));
  return h.digest("hex").slice(0, 12);
}

if (process.argv[1] && process.argv[1].endsWith("sw-version.js")) {
  const sw = readFileSync("sw.js", "utf8");
  const v = computeVersion(sw);
  const current = sw.match(/const VERSION = "([^"]*)";/)[1];
  if (process.argv.includes("--check")) {
    if (v !== current) { console.error(`sw.js desactualizado (${current} → ${v}). Corré: npm run sw:version`); process.exit(1); }
    console.log("sw.js al día: " + v);
  } else {
    writeFileSync("sw.js", sw.replace(/const VERSION = "[^"]*";/, `const VERSION = "${v}";`));
    console.log("VERSION = " + v);
  }
}
