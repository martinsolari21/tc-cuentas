// Interacciones propias del diseño "Box TC": barra inferior, botón +, hoja de movimiento,
// "A resolver" y "Más".
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.js";
import { sampleState, NOW } from "./fixtures.js";

const app = (state = sampleState()) => boot("nuevo", { state, now: NOW });
const sheetOpen = (a) => a.doc.getElementById("sheet").classList.contains("open");

test("el botón + abre la hoja vacía y guardar la cierra", async () => {
  const a = await app();
  assert.equal(sheetOpen(a), false);
  a.doc.getElementById("fab").click();
  assert.equal(sheetOpen(a), true);
  assert.equal(a.doc.getElementById("sheet-title").textContent, "Nuevo movimiento");
  a.fill({ a: "15000", c: "Seguro" }).click("Guardar");
  assert.equal(sheetOpen(a), false);
  assert.equal(a.saved().moves.at(-1).cat, "Seguro");
});

test("cerrar la hoja (botón, fondo o Escape) no guarda nada", async () => {
  const a = await app();
  const n = a.saved().moves.length;
  for (const close of [
    () => a.doc.querySelector('.sheet [data-act="closeSheet"]').click(),
    () => a.doc.querySelector(".sheet-back").click(),
    () => a.doc.dispatchEvent(new a.win.KeyboardEvent("keydown", { key: "Escape" })),
  ]) {
    a.doc.getElementById("fab").click();
    a.set("a", "999");
    close();
    assert.equal(sheetOpen(a), false);
  }
  assert.equal(a.saved().moves.length, n);
});

test("editar un movimiento abre la hoja con sus datos y queda en la misma sección", async () => {
  const a = await app();
  a.tab("Movimientos").clickIn("Nafta", "✎");
  assert.equal(sheetOpen(a), true);
  assert.equal(a.doc.getElementById("sheet-title").textContent, "Editar movimiento");
  assert.equal(a.doc.getElementById("a").value, "2000000");
  a.click("Cancelar");
  assert.equal(sheetOpen(a), false);
  assert.equal(a.doc.querySelector(".page-title").textContent, "Movimientos");
});

test("Inicio: A resolver lista vencidos y por vencer, y se pagan desde ahí", async () => {
  const a = await app();
  const items = [...a.doc.querySelectorAll(".card .item")].map((x) => x.textContent);
  assert.ok(items.some((t) => t.includes("Taller Gómez") && t.includes("vencido hace 5 d")));
  assert.ok(items.some((t) => t.includes("Cuota 2 · YPF")));
  assert.ok(!items.some((t) => t.includes("ACTC"))); // vence en abril: no es urgente
  a.clickIn("Taller Gómez", "Pagado");
  assert.equal(a.saved().pend.some((p) => p.id === "p1"), false);
  assert.equal(a.saved().moves.at(-1).amt, 750000);
});

test("Inicio: próxima fecha con Cargar gasto abre la hoja con esa carrera", async () => {
  const a = await app();
  assert.match(a.text(), /Próxima fechaen 12 díasFecha 3 · Rafaela/);
  a.clickIn("Fecha 3 · Rafaela", "Cargar gasto", ".card");
  assert.equal(sheetOpen(a), true);
  assert.equal(a.doc.getElementById("r").value, "r3");
});

test("Pendientes muestra la cantidad en la barra inferior", async () => {
  const a = await app();
  assert.equal(a.doc.querySelector('.bottomnav [data-v="pen"] .badge').textContent, "3");
});

test("Más lleva a cada sección y vuelve", async () => {
  const a = await app();
  a.tab("Más");
  for (const name of ["Contratos", "Inventario", "Presupuesto", "Equipo", "Reportes"]) {
    a.tab(name);
    assert.equal(a.doc.querySelector(".page-title").textContent, name);
    assert.ok(a.doc.querySelector('.bottomnav [data-v="mas"]').classList.contains("on"));
    a.click("‹ Más");
  }
});

test("sin equipos: pantalla de bienvenida, sin barra ni botón +", async () => {
  const a = await boot("nuevo", { raw: null, now: NOW });
  assert.match(a.text(), /Empezá creando tu equipo/);
  assert.equal(a.doc.getElementById("bottom").hidden, true);
  assert.equal(a.doc.getElementById("fab").hidden, true);
});
