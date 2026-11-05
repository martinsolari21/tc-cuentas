// Chequeo de sintaxis de todos los .js de src/ (npm run check).
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".js")) files.push(p);
  }
})("src");

let bad = 0;
for (const f of files) {
  try { execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }); }
  catch (e) { bad++; console.error(String(e.stderr)); }
}
console.log(`${files.length - bad}/${files.length} archivos OK`);
process.exit(bad ? 1 : 0);
