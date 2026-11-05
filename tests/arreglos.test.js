// Comportamiento que cambió a propósito respecto del prototipo original.
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.js";
import { sampleState, stage1State, NOW } from "./fixtures.js";

const nuevo = (opts = {}) => boot("nuevo", { state: sampleState(), now: NOW, ...opts });

test("guardar un movimiento desde otra pestaña funciona (el original tiraba error)", async () => {
  const a = await nuevo();
  for (const tab of ["Carreras", "Pendientes (3)", "Inventario", "Equipo"]) {
    a.tab(tab).fill({ a: "1000", mc: "USD", mx: "1000" }).click("Guardar");
    const mv = a.saved().moves.at(-1);
    assert.deepEqual([mv.amt, mv.cur], [1000000, "USD"], tab);
  }
});

test("'hoy' es la fecha local: a las 22:30 de Argentina sigue siendo el mismo día", async () => {
  const noche = "2026-03-11T01:30:00Z"; // 10/03 22:30 en Argentina
  for (const impl of ["original", "nuevo"]) {
    const a = await boot(impl, { state: sampleState(), now: noche });
    assert.equal(a.doc.getElementById("d").value, impl === "nuevo" ? "2026-03-10" : "2026-03-11", impl);
  }
  const a = await nuevo({ now: noche });
  a.tab("Pendientes (3)").clickIn("ACTC", "Cobrado");
  assert.equal(a.saved().moves.at(-1).date, "2026-03-10");
  assert.match(a.text(), /vencido hace 5 d/); // Taller Gómez, vencía el 05/03
});

test("cuotas a fin de mes caen el último día del mes", async () => {
  const a = await nuevo();
  a.tab("Contratos").fill({ cs: "Shell", ct: "1200000", cq: "4", c1: "2028-01-31" }).click("Agregar contrato");
  assert.deepEqual(a.saved().cons.at(-1).inst.map((i) => i.date), ["2028-01-31", "2028-02-29", "2028-03-31", "2028-04-30"]);
});

test("los datos se guardan sin el estado de la interfaz", async () => {
  const a = await nuevo();
  a.tab("Presupuesto").change("dp", "USD");
  const data = a.raw("tc-cuentas"), ui = a.raw("tc-cuentas-ui");
  assert.deepEqual(Object.keys(data).sort(), ["cfg", "cons", "moves", "parts", "pend", "races", "teams", "tires", "version"]);
  assert.equal(data.version, 2);
  assert.deepEqual(ui, { sel: "tA", view: "pre", disp: "USD", fxref: 0 });
  // Al volver a abrir se recuerdan la pestaña y la moneda.
  const b = await boot("nuevo", { raw: JSON.stringify(data), ui: JSON.stringify(ui), now: NOW });
  assert.equal(b.doc.querySelector(".tabs .on").textContent, "Presupuesto");
  assert.equal(b.doc.getElementById("dp").value, "USD");
});

test("la copia JSON lleva solo datos", async () => {
  const a = await nuevo();
  a.tab("Reportes").click("Descargar copia (JSON)");
  const copia = JSON.parse(a.io.downloads[0].data);
  assert.deepEqual(Object.keys(copia).sort(), ["cfg", "cons", "moves", "parts", "pend", "races", "teams", "tires", "version"]);
  assert.equal(copia.moves.length, 10);
});

test("importar una copia reemplaza todo, aunque sea de una etapa vieja", async () => {
  const a = await nuevo();
  a.tab("Reportes");
  await a.importJSON(JSON.stringify(stage1State()));
  const s = a.saved();
  assert.deepEqual(s.teams, stage1State().teams);
  assert.deepEqual([s.pend, s.cons, s.tires, s.parts, s.cfg], [[], [], [], [], {}]); // antes quedaban los actuales
  assert.equal(s.sel, "tA");
  assert.equal(s.view, "rep"); // la pantalla actual se mantiene
});

test("importar: si el equipo elegido no está en la copia, se elige el primero", async () => {
  const a = await nuevo({ state: { ...sampleState(), sel: "tB" } });
  a.tab("Reportes");
  await a.importJSON(JSON.stringify(stage1State()));
  assert.match(a.text(), /Equipo Viejo/);
});

test("importar: cancelar no cambia nada", async () => {
  const a = await nuevo();
  const antes = a.raw();
  a.tab("Reportes");
  a.io.confirm = false;
  await a.importJSON(JSON.stringify(stage1State()));
  assert.deepEqual(a.raw(), antes);
});

test("eliminar un equipo borra también sus pendientes, contratos, inventario y configuración", async () => {
  const a = await nuevo();
  a.click("Eliminar equipo");
  const s = a.saved();
  assert.deepEqual(s.teams.map((t) => t.id), ["tB"]);
  for (const k of ["moves", "races", "pend", "cons", "tires", "parts"]) assert.ok(s[k].every((x) => x.team !== "tA"), k);
  assert.ok(!("tA" in s.cfg));
  assert.equal(s.moves.length, 1); // el del otro equipo sigue
  assert.equal(s.sel, "tB");
});
