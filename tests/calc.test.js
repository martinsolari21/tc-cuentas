// Tests unitarios de los cálculos, el formato y la migración (funciones puras, sin DOM).
import { test } from "node:test";
import assert from "node:assert/strict";
import { alertCounts, contractPending, costPerKm, logistics, pendTotals, projection, realByCat, spent, splitInstallments, teamRaces, totals } from "../src/calc.js";
import { addDays, addMonths, csvq, daysLeft, esc, fd, money, toARS } from "../src/format.js";
import { loadState, migrate } from "../src/state.js";
import { sampleState, stage1State } from "./fixtures.js";

const nb = (s) => s.replace(/ /g, " ");

test("moneda: formato es-AR y conversión a USD para mostrar", () => {
  assert.equal(nb(money(1234567)), "$ 1.234.567");
  assert.equal(nb(money(-4500)), "-$ 4.500");
  assert.equal(nb(money(1500000, "USD", 1500)), "US$ 1.000");
  assert.equal(nb(money(1500000, "USD", 0)), "$ 1.500.000"); // sin cotización queda en ARS
  assert.equal(toARS(1000, "USD", 1450), 1450000);
  assert.equal(toARS(1000, "ARS", 1450), 1000);
});

test("fechas", () => {
  assert.equal(fd("2026-03-10"), "10/03/2026");
  assert.equal(fd(""), "");
  assert.equal(addDays("2026-03-01", 30), "2026-03-31");
  assert.equal(addMonths("2026-01-15", 1), "2026-02-15");
  assert.equal(addMonths("2026-01-31", 1), "2026-03-03"); // comportamiento heredado (ver bugs conocidos)
  assert.equal(daysLeft("2026-03-05", "2026-03-10"), -5);
  assert.equal(daysLeft("2026-03-14", "2026-03-10"), 4);
});

test("texto", () => {
  assert.equal(esc('<b>"x" & y</b>'), "&lt;b&gt;&quot;x&quot; &amp; y&lt;/b&gt;");
  assert.equal(csvq('dice "hola"'), '"dice ""hola"""');
  assert.equal(csvq(null), '""');
});

test("totales y gasto por carrera", () => {
  const S = sampleState();
  const t = totals(S.moves.filter((x) => x.team === "tA"));
  assert.deepEqual([t.inc, t.exp, t.bal], [8500000, 13000000, -4500000]);
  assert.equal(t.by.Motor, 4500000);
  assert.equal(spent(S, "tA", "r1"), 5800000);
  assert.equal(spent(S, "tA", ""), 900000);
  assert.equal(logistics(S, "tA", "r2"), 1800000);
  assert.equal(costPerKm(5800000, 1000), 5800);
  assert.equal(costPerKm(5800000, 0), 0);
  assert.equal(realByCat(S, "tA", "Combustible"), 2000000);
  assert.deepEqual(teamRaces(S, "tA").map((r) => r.id), ["r1", "r2", "r3"]);
});

test("proyección de temporada", () => {
  const p = projection({ spentNow: 13000000, races: [{ spent: 5800000 }, { spent: 6300000 }, { spent: 0 }], seasonRaces: 14 });
  assert.deepEqual(p, { done: 2, avg: 6050000, rem: 12, close: 85600000 });
  assert.deepEqual(projection({ spentNow: 100, races: [], seasonRaces: 0 }), { done: 0, avg: 0, rem: 0, close: 100 });
  assert.equal(projection({ spentNow: 0, races: [{ spent: 1 }, { spent: 1 }], seasonRaces: 1 }).rem, 0); // nunca negativo
});

test("cuotas", () => {
  assert.deepEqual(splitInstallments(1000000, 3, "2026-02-10"), [
    { date: "2026-02-10", amt: 333333 }, { date: "2026-03-10", amt: 333333 }, { date: "2026-04-10", amt: 333334 },
  ]);
  assert.deepEqual(splitInstallments(500, 1, "2026-01-01"), [{ date: "2026-01-01", amt: 500 }]);
  const sum = splitInstallments(24000001, 7, "2026-01-01").reduce((s, q) => s + q.amt, 0);
  assert.equal(sum, 24000001);
  assert.deepEqual(contractPending(sampleState().cons, "2026-03-10"), { pen: 16000000, ven: 8000000 });
});

test("pendientes y avisos de vencimiento", () => {
  const S = sampleState();
  assert.deepEqual(pendTotals(S.pend), { pay: 1150000, collect: 300000 });
  assert.deepEqual(alertCounts(S, "tA", "2026-03-10"), { late: 2, soon: 1 });
  assert.deepEqual(alertCounts(S, "tB", "2026-03-10"), { late: 0, soon: 0 });
});

test("migración: copia de la etapa 1 conserva todo y suma lo que falta", () => {
  const S = loadState(JSON.stringify(stage1State()));
  const old = stage1State();
  assert.deepEqual([S.teams, S.moves, S.races], [old.teams, old.moves, old.races]);
  assert.deepEqual([S.pend, S.cons, S.tires, S.parts, S.cfg, S.disp, S.fxref, S.version], [[], [], [], [], {}, "ARS", 0, 1]);
  assert.equal(S.edit, null);
});

test("migración: datos actuales quedan iguales", () => {
  const orig = sampleState();
  const S = migrate(sampleState());
  delete S.version;
  assert.deepEqual(S, orig);
});

test("migración: datos ilegibles o vacíos arrancan sin equipos", () => {
  assert.deepEqual(loadState("{roto").teams, []);
  assert.deepEqual(loadState(null).teams, []);
  assert.equal(loadState(JSON.stringify({ moves: [1] })).moves.length, 0); // sin teams no se toma
  assert.equal(loadState(JSON.stringify({ teams: [{ id: "a", name: "A" }] })).sel, "a");
});
