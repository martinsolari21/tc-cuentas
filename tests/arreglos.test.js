// Comportamiento que cambió a propósito respecto del prototipo original.
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.js";
import { sampleState, NOW } from "./fixtures.js";

test("guardar un movimiento desde otra pestaña funciona (el original tiraba error)", async () => {
  const a = await boot("nuevo", { state: sampleState(), now: NOW });
  for (const tab of ["Carreras", "Pendientes (3)", "Inventario", "Equipo"]) {
    a.tab(tab).fill({ a: "1000", mc: "USD", mx: "1000" }).click("Guardar");
    const mv = a.saved().moves.at(-1);
    assert.deepEqual([mv.amt, mv.cur], [1000000, "USD"], tab);
  }
});
