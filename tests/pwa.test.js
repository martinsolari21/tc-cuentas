// Uso sin señal: el service worker guarda toda la app, la versión está al día y la
// página no depende de nada en internet.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { computeVersion, swFiles } from "../scripts/sw-version.js";
import { boot } from "./harness.js";
import { sampleState, NOW } from "./fixtures.js";

const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f).replace(/\\/g, "/"); return statSync(p).isDirectory() ? walk(p) : [p]; });

test("el service worker guarda todos los archivos que usa la app (y nada que no exista)", () => {
  const listed = new Set(swFiles());
  const expected = [
    "index.html", "manifest.webmanifest",
    ...walk("src"), ...walk("assets").filter((f) => !/\.(txt|md)$/.test(f)), ...walk("vendor").filter((f) => f.endsWith(".js")),
  ];
  for (const f of expected) assert.ok(listed.has(f), `falta en sw.js FILES: ${f}`);
  for (const f of listed) assert.ok(existsSync(f), `sw.js lista un archivo que no existe: ${f}`);
});

test("la versión del service worker corresponde al contenido actual", () => {
  const current = readFileSync("sw.js", "utf8").match(/const VERSION = "([^"]*)";/)[1];
  assert.equal(current, computeVersion(), "Corré: npm run sw:version");
});

test("la página no carga nada de internet", () => {
  const html = readFileSync("index.html", "utf8");
  assert.deepEqual(html.match(/(?:src|href)="https?:[^"]*"/g) || [], []);
  for (const f of ["src/styles.css", "assets/fonts.css"]) assert.doesNotMatch(readFileSync(f, "utf8"), /url\(\s*["']?https?:/, f);
  for (const f of walk("src")) assert.doesNotMatch(readFileSync(f, "utf8"), /https?:\/\/(?!localhost)[a-z]/i, f);
});

test("las fuentes y los íconos referenciados existen", () => {
  for (const [, url] of readFileSync("assets/fonts.css", "utf8").matchAll(/url\(([^)]+)\)/g)) assert.ok(existsSync(join("assets", url)), url);
  const man = JSON.parse(readFileSync("manifest.webmanifest", "utf8"));
  assert.equal(man.display, "standalone");
  assert.ok(man.icons.some((i) => i.sizes === "512x512" && i.purpose === "maskable"));
  for (const i of man.icons) assert.ok(existsSync(i.src), i.src);
});

test("sin señal aparece el aviso y la app sigue funcionando", async () => {
  const a = await boot("nuevo", { state: sampleState(), now: NOW });
  assert.equal(a.doc.getElementById("net").hidden, true);
  a.win.dispatchEvent(new a.win.Event("offline"));
  assert.equal(a.doc.getElementById("net").hidden, false);
  assert.equal(a.doc.getElementById("net").textContent, "Sin señal");
  a.doc.getElementById("fab").click();
  a.fill({ a: "5000" }).click("Guardar");
  assert.equal(a.saved().moves.at(-1).amt, 5000);
  a.win.dispatchEvent(new a.win.Event("online"));
  assert.equal(a.doc.getElementById("net").hidden, true);
});

test("Más muestra el estado de uso sin señal", async () => {
  const a = await boot("nuevo", { state: sampleState(), now: NOW });
  a.tab("Más");
  assert.match(a.text(), /Usar sin señal/);
  assert.match(a.text(), /Tus datos se guardan en este dispositivo/);
});

test("el PDF carga jsPDF desde la app, no desde internet", async () => {
  const a = await boot("nuevo", { state: sampleState(), now: NOW });
  delete a.win.jspdf;
  a.tab("Reportes").click("Informe (PDF)");
  const s = [...a.doc.querySelectorAll("script[src]")].map((x) => x.getAttribute("src"));
  assert.deepEqual(s, ["vendor/jspdf.umd.min.js"]);
});
