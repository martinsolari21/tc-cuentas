// Tests de caracterización: fijan lo que la app hace HOY (cálculos de presupuesto,
// proyección, cuotas, moneda, pendientes, exportación y carga de datos viejos).
// Corren contra el prototipo original y contra la versión refactorizada: las dos
// tienen que dar exactamente lo mismo.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { boot, IMPLS } from "./harness.js";
import { sampleState, stage1State, NOW } from "./fixtures.js";

const nbsp = (s) => s.replace(/ /g, " ");
const start = async (impl, state = sampleState()) => boot(impl, { state, now: NOW });

for (const impl of IMPLS) {
  describe(`[${impl}]`, () => {
    test("resumen: ingresos, gastos y balance en ARS", async () => {
      const a = await start(impl);
      const t = nbsp(a.text());
      assert.match(t, /Ingresos\$ 8\.500\.000/);
      assert.match(t, /Gastos\$ 13\.000\.000/);
      assert.match(t, /Balance[a-z ]{0,25}-\$ 4\.500\.000/);
      assert.match(t, /Gastos por categoríaMotor\$ 4\.500\.000Neumáticos\$ 3\.000\.000/);
      assert.match(t, /2 vencidos · 1 por vencer en 7 días/);
    });

    test("moneda: mostrar en USD divide por la cotización de referencia", async () => {
      const a = await start(impl, { ...sampleState(), disp: "USD", fxref: 1000 });
      const t = nbsp(a.text());
      assert.match(t, /IngresosUS\$ 8\.500(?!\.)/);
      assert.match(t, /GastosUS\$ 13\.000(?!\.)/);
      assert.match(t, /Balance[a-z ]{0,25}-US\$ 4\.500(?!\.)/);
      // Sin cotización de referencia sigue en ARS aunque se elija USD.
      const b = await start(impl, { ...sampleState(), disp: "USD", fxref: 0 });
      assert.match(nbsp(b.text()), /Ingresos\$ 8\.500\.000/);
    });

    test("moneda: un gasto en USD se guarda en ARS con monto y cotización", async () => {
      const a = await start(impl);
      a.fill({ c: "Motor", a: "1000", mc: "USD", mx: "1450", d: "2026-03-09", nt: "Pistones" }).click("Guardar");
      const mv = a.saved().moves.at(-1);
      assert.deepEqual(
        { type: mv.type, cat: mv.cat, amt: mv.amt, cur: mv.cur, usd: mv.usd, fx: mv.fx, date: mv.date, note: mv.note },
        { type: "g", cat: "Motor", amt: 1450000, cur: "USD", usd: 1000, fx: 1450, date: "2026-03-09", note: "Pistones" },
      );
    });

    test("moneda: USD sin cotización no guarda y avisa", async () => {
      const a = await start(impl);
      const n = a.saved().moves.length;
      a.fill({ a: "1000", mc: "USD" }).click("Guardar");
      assert.deepEqual(a.io.alerts, ["Ingresá la cotización para cargar en USD."]);
      assert.equal(a.saved().moves.length, n);
    });

    test("presupuesto: real vs presupuestado por categoría", async () => {
      const a = await start(impl);
      a.tab("Presupuesto");
      const t = nbsp(a.text());
      assert.match(t, /Neumáticos\$ 2\.500\.000\$ 3\.000\.000−\$ 500\.000/);
      assert.match(t, /Hospedaje\$ 0\$ 800\.000–/);
      assert.match(t, /Total\$ 20\.500\.000\$ 13\.000\.000\+\$ 7\.500\.000/);
      assert.match(t, /presupuesto sumado \$ 15\.000\.000 · gasto asignado a carreras \$ 12\.100\.000/);
    });

    test("proyección: gasto actual + promedio por carrera × restantes", async () => {
      const a = await start(impl);
      a.tab("Presupuesto");
      const t = nbsp(a.text());
      // 13.000.000 + (5.800.000 + 6.300.000) / 2 × (14 − 2) = 85.600.000
      assert.match(t, /Promedio por carrera \(2 con gasto\)\$ 6\.050\.000Cierre estimado \(12 restantes\)\$ 85\.600\.000/);
      assert.match(t, /Contra el presupuesto de \$ 20\.500\.000: te pasarías \$ 65\.100\.000/);
      a.changeEl(a.doc.querySelector('input[onchange*="setTot"], input[data-change="setTot"]'), "0");
      assert.match(a.text(), /Ingresá la cantidad de carreras de la temporada/);
    });

    test("carreras: presupuesto, exceso y costo por km", async () => {
      const a = await start(impl);
      a.tab("Carreras");
      const t = nbsp(a.text());
      assert.match(t, /Costo por km: \$ 5\.800 · logística por km: \$ 800/);
      assert.match(t, /Costo por km: \$ 2\.520 · logística por km: \$ 720/);
      assert.match(t, /58% usado · restan \$ 4\.200\.000/);
      assert.match(t, /Excedido en \$ 1\.300\.000/);
    });

    test("carreras: el aviso de presupuesto restante y Completar", async () => {
      const a = await start(impl);
      a.change("r", "r1");
      assert.match(nbsp(a.text("#hint")), /Presupuesto restante de Fecha 1 · Viedma: \$ 4\.200\.000/);
      a.click("Completar con el restante");
      assert.equal(a.doc.getElementById("a").value, "4200000");
      a.change("r", "r2");
      assert.match(nbsp(a.text("#hint")), /Presupuesto excedido en \$ 1\.300\.000/);
    });

    test("cuotas: división en cuotas mensuales con el resto en la última", async () => {
      const a = await start(impl);
      a.tab("Contratos");
      a.fill({ cs: "Shell", cn: "", ct: "1000000", cf: "2026-01-10", cu: "", cq: "3", c1: "2026-01-15", cd: "" }).click("Agregar contrato");
      const c = a.saved().cons.at(-1);
      assert.deepEqual(c.inst.map((i) => [i.date, i.amt, i.paid]), [
        ["2026-01-15", 333333, false],
        ["2026-02-15", 333333, false],
        ["2026-03-15", 333334, false],
      ]);
    });

    test("cuotas: cobrar genera un ingreso de Auspicio y deshacer lo borra", async () => {
      const a = await start(impl);
      a.tab("Contratos");
      a.clickIn("vencido hace 9 d", "Cobrada");
      let s = a.saved();
      const mv = s.moves.at(-1);
      assert.deepEqual({ type: mv.type, cat: mv.cat, amt: mv.amt, date: mv.date, note: mv.note, ci: mv.ci }, { type: "i", cat: "Auspicio", amt: 8000000, date: "2026-03-10", note: "Cuota 2 · YPF", ci: "i2" });
      assert.equal(s.cons[0].inst[1].paid, true);
      assert.match(nbsp(a.text()), /Por cobrar \(auspicios\)\$ 8\.000\.000Vencido\$ 0/);
      const conDeshacer = [...a.doc.querySelectorAll("tr")].filter((r) => r.textContent.includes("Deshacer"));
      conDeshacer[1].querySelector("button").click(); // la cuota 2
      s = a.saved();
      assert.equal(s.cons[0].inst[1].paid, false);
      assert.equal(s.moves.filter((m) => m.ci === "i2").length, 0);
    });

    test("cuotas: editar fecha y monto de una cuota", async () => {
      const a = await start(impl);
      a.tab("Contratos");
      const [fecha, monto] = a.inputsIn("vence 01/04/2026");
      a.changeEl(monto, "9000000");
      const [fecha2] = a.inputsIn("vence 01/04/2026");
      a.changeEl(fecha2, "2026-04-15");
      assert.deepEqual(a.saved().cons[0].inst[2], { id: "i3", date: "2026-04-15", amt: 9000000, paid: false });
      assert.ok(fecha);
    });

    test("pendientes: pagar una multa crea el gasto y saca el pendiente", async () => {
      const a = await start(impl);
      a.tab("Pendientes (3)");
      a.clickIn("art. 32", "Pagado");
      const s = a.saved();
      assert.equal(s.pend.length, 2);
      const mv = s.moves.at(-1);
      assert.deepEqual({ type: mv.type, cat: mv.cat, amt: mv.amt, race: mv.race, date: mv.date, note: mv.note }, { type: "g", cat: "Multa", amt: 400000, race: "r1", date: "2026-03-10", note: "Multa a Piloto (art. 32) · Largada" });
    });

    test("pendientes: multa nueva vence 30 días después de notificada", async () => {
      const a = await start(impl);
      a.tab("Pendientes (3)");
      a.change("pk", "f");
      assert.equal(a.doc.getElementById("fg").style.display, "flex");
      a.change("fn", "2026-03-01");
      assert.equal(a.doc.getElementById("pd").value, "2026-03-31");
      a.fill({ pa: "250000", fw: "Motorista", fa: "15", fs: "apel" }).clickNear("pa", "Agregar");
      const p = a.saved().pend.at(-1);
      assert.deepEqual({ kind: p.kind, cat: p.cat, amt: p.amt, due: p.due, fine: p.fine }, { kind: "f", cat: "Multa", amt: 250000, due: "2026-03-31", fine: { who: "Motorista", art: "15", notif: "2026-03-01", st: "apel" } });
    });

    test("editar un movimiento en USD conserva los datos del comprobante", async () => {
      const a = await start(impl);
      a.clickIn("Reconstrucción", "✎");
      assert.equal(a.doc.getElementById("a").value, "3000");
      assert.equal(a.doc.getElementById("mc").value, "USD");
      a.set("mx", "1600").click("Guardar cambios");
      const mv = a.saved().moves.find((m) => m.id === "m4");
      assert.equal(mv.amt, 4800000);
      assert.equal(a.doc.querySelector('[data-act="addMove"], [onclick="addMove()"]').textContent, "Guardar"); // salió de edición
    });

    test("inventario: neumáticos cargados también como gasto", async () => {
      const a = await start(impl);
      a.tab("Inventario");
      a.fill({ ir: "r3", inw: "6", irs: "6", ic: "2400000", ik: true }).clickNear("inw", "Agregar");
      const s = a.saved();
      assert.deepEqual(Object.values({ ...s.tires.at(-1), id: 0 }), [0, "tA", "r3", 6, 6, 2400000]);
      const mv = s.moves.at(-1);
      assert.deepEqual([mv.cat, mv.amt, mv.race, mv.note], ["Neumáticos", 2400000, "r3", "6 nuevos, 6 resellados"]);
    });

    test("inventario: +1 carrera a los motores En uso", async () => {
      const a = await start(impl);
      a.tab("Inventario");
      a.click("+1 carrera a los que están En uso");
      assert.deepEqual(a.saved().parts.map((p) => p.races), [3, 0]);
    });

    test("exportar CSV de movimientos", async () => {
      const a = await start(impl);
      a.tab("Reportes").click("Movimientos (CSV)");
      const d = a.io.downloads[0];
      assert.equal(d.name, "movimientos-Equipo-Ford-2026-03-10.csv");
      const lines = d.data.split("\r\n");
      assert.equal(lines[0], '﻿"Fecha";"Tipo";"Categoría";"Carrera";"Monto ARS";"Moneda";"Monto USD";"Cotización";"Nota";"Comprobante";"Número";"Proveedor/Cliente";"CUIT";"IVA ARS"');
      assert.equal(lines[1], '"2026-02-01";"Ingreso";"Auspicio";"Sin carrera";"8000000";"ARS";"";"";"Cuota 1 · YPF";"";"";"";"";""');
      assert.equal(lines.length, 10);
    });

    test("exportar PDF resumen", async () => {
      const a = await start(impl);
      a.tab("Reportes").click("Informe (PDF)");
      assert.equal(a.io.downloads[0].name, "informe-Equipo-Ford-2026-03-10.pdf");
      assert.deepEqual(a.io.pdf.map(nbsp).slice(0, 8), [
        "Informe - Equipo Ford (Juan Pérez)",
        "Fecha: 10/03/2026 · Valores en ARS",
        "Resumen de temporada",
        "Ingresos: $ 8.500.000",
        "Gastos: $ 13.000.000",
        "Balance: -$ 4.500.000",
        "Por pagar: $ 1.150.000 · Por cobrar: $ 300.000",
        "Gastos por categoria",
      ]);
    });

    test("copia JSON: exportar e importar", async () => {
      const a = await start(impl);
      a.tab("Reportes").click("Descargar copia (JSON)");
      const copia = a.io.downloads[0];
      assert.equal(copia.name, "tc-cuentas-copia-2026-03-10.json");
      assert.equal(JSON.parse(copia.data).moves.length, 10);
      const b = await start(impl, stage1State());
      b.tab("Reportes");
      await b.importJSON(copia.data);
      assert.equal(b.saved().moves.length, 10);
      assert.equal(b.saved().teams[0].name, "Equipo Ford");
      await b.importJSON("{nada");
      assert.deepEqual(b.io.alerts, ["El archivo no es una copia válida de TC Cuentas."]);
    });

    test("datos viejos: una copia de la etapa 1 se abre sin perder nada", async () => {
      const a = await start(impl, stage1State());
      assert.match(nbsp(a.text()), /Fecha 12/);
      for (const v of ["Pendientes", "Contratos", "Inventario", "Presupuesto", "Equipo", "Reportes", "Resumen"]) a.tab(v);
      a.change("r", "r1");
      a.fill({ a: "1000" }).click("Guardar");
      const s = a.saved();
      assert.deepEqual(s.teams, stage1State().teams);
      assert.equal(s.moves[0].amt, 50000);
      assert.equal(s.moves.length, 2);
      assert.deepEqual([s.pend, s.cons, s.tires, s.parts], [[], [], [], []]);
    });

    test("datos guardados ilegibles: arranca vacío sin romperse", async () => {
      const a = await boot(impl, { raw: "{roto", now: NOW });
      assert.match(a.text("#tb"), /Creá tu primer equipo/);
      a.set("tn", "Equipo Nuevo").click("Agregar equipo");
      assert.equal(a.saved().teams[0].name, "Equipo Nuevo");
    });
  });
}
