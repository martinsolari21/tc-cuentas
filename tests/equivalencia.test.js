// Equivalencia: corre los mismos escenarios en el prototipo original y en la versión
// refactorizada, y después de cada paso compara todo lo visible (textos, campos, valores,
// colores, barras) y todo lo guardado en localStorage.
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, snapshot, normalizeSaved, normalizeIds } from "./harness.js";
import { sampleState, stage1State, NOW } from "./fixtures.js";

const onchange = (name) => `[onchange*="${name}"], [data-change="${name}"]`;
const changeSel = (a, name, v, i = 0) => a.changeEl(a.doc.querySelectorAll(onchange(name))[i], v);

async function trace(impl, init, steps) {
  const a = await boot(impl, { now: NOW, ...init });
  const out = [];
  // La copia JSON nueva lleva "version"; se ignora al comparar descargas.
  const record = (label) => {
    out.push({ label, snap: normalizeIds(a.snapshot()), snapSinMoneda: normalizeIds(snapshot(a.doc, { sinMoneda: true })), saved: normalizeSaved(a.saved() || {}), io: { alerts: [...a.io.alerts], downloads: a.io.downloads.map((d) => d.name + ":" + String(d.data).replace(/,"version":1/, "")), pdf: [...a.io.pdf] } });
  };
  record("inicio");
  for (const [label, fn] of steps) {
    await fn(a);
    record(label);
  }
  return out;
}

async function same(init, steps) {
  const [o, n] = [await trace("original", init, steps), await trace("nuevo", init, steps)];
  for (let k = 0; k < o.length; k++) {
    const sinMoneda = !o[k].snap.controles.some((c) => c.startsWith("select#mc"));
    const ns = sinMoneda ? n[k].snapSinMoneda : n[k].snap;
    assert.deepEqual(ns, o[k].snap, `pantalla distinta después de: ${o[k].label}`);
    assert.deepEqual(n[k].saved, o[k].saved, `datos guardados distintos después de: ${o[k].label}`);
    assert.deepEqual(n[k].io, o[k].io, `avisos/descargas distintos después de: ${o[k].label}`);
  }
}

const sample = () => ({ state: sampleState() });
const TABS = ["Carreras", "Pendientes (3)", "Contratos", "Inventario", "Presupuesto", "Equipo", "Reportes", "Resumen"];

test("todas las pestañas en ARS", () => same(sample(), TABS.map((n) => [n, (a) => a.tab(n)])));

test("todas las pestañas mostrando en USD", () => same({ state: { ...sampleState(), disp: "USD", fxref: 1250 } }, TABS.map((n) => [n, (a) => a.tab(n)])));

test("cambiar moneda de visualización y equipo", () => same(sample(), [
  ["USD", (a) => a.change("dp", "USD")],
  ["cotización", (a) => a.change("fr", "1300")],
  ["otro equipo", (a) => a.click("Equipo Chevrolet")],
  ["volver", (a) => a.click("Equipo Ford")],
  ["ARS", (a) => a.change("dp", "ARS")],
]));

test("movimientos: alta, aviso de presupuesto, edición y baja", () => same(sample(), [
  ["elegir carrera", (a) => a.change("r", "r1")],
  ["completar", (a) => a.click("Completar con el restante")],
  ["guardar gasto", (a) => a.fill({ c: "Seguro", d: "2026-03-09", nt: "Póliza", vt: "Factura B", vn: "12", vp: "La Segunda", vc: "30-1", vi: "21000" }).click("Guardar")],
  ["ingreso", (a) => a.click("Ingreso")],
  ["guardar ingreso", (a) => a.fill({ a: "250000", c: "Premio" }).click("Guardar")],
  ["sin monto no guarda", (a) => a.fill({ a: "" }).click("Guardar")],
  ["editar", (a) => a.clickIn("Hotel Viedma", "✎")],
  ["guardar edición", (a) => a.fill({ nt: "Hotel 2 noches", a: "900000" }).click("Guardar cambios")],
  ["editar y cancelar", (a) => a.clickIn("Nafta", "✎")],
  ["cancelar", (a) => a.click("Cancelar")],
  ["borrar", (a) => a.clickIn("Sueldos", "✕")],
  ["gasto", (a) => a.click("Gasto")],
]));

test("carreras: alta, edición, presupuesto, cargar gasto y baja", () => same(sample(), [
  ["pestaña", (a) => a.tab("Carreras")],
  ["alta", (a) => a.fill({ rn: "Fecha 4 · La Plata", rd: "2026-04-12", rb: "7000000", rs: "La Plata", rk: "60", rf: "Copa de Oro", rr: "" }).clickNear("rn", "Agregar")],
  ["editar", (a) => a.clickIn("El Calafate", "Editar", ".card")],
  ["guardar", (a) => a.fill({ rr: "2°", rk: "2600" }).click("Guardar cambios")],
  ["presupuesto", (a) => changeSel(a, "setBud", "4000000", 2)],
  ["cargar gasto", (a) => a.clickIn("Rafaela", "Cargar gasto", ".card")],
  ["guardar en esa carrera", (a) => a.fill({ a: "100000" }).click("Guardar")],
  ["volver", (a) => a.tab("Carreras")],
  ["no confirmar baja", (a) => { a.io.confirm = false; a.clickIn("Viedma", "Eliminar", ".card"); a.io.confirm = true; }],
  ["baja", (a) => a.clickIn("Viedma", "Eliminar", ".card")],
]));

test("pendientes: alta, edición, cambio de tipo, pago y baja", () => same(sample(), [
  ["pestaña", (a) => a.tab("Pendientes (3)")],
  ["alta pago", (a) => a.fill({ pcat: "Motor", pa: "1200000", pp: "Motores Rossi", pd: "2026-03-20", pr: "r3", pn: "Anticipo" }).clickNear("pa", "Agregar")],
  ["editar multa", (a) => a.clickIn("art. 32", "✎")],
  ["guardar multa", (a) => a.fill({ fa: "33", fs: "apel" }).click("Guardar cambios")],
  ["editar pago", (a) => a.clickIn("Taller Gómez", "✎")],
  ["a cobro", (a) => a.change("pk", "c")],
  ["guardar cobro", (a) => a.fill({ pcat: "Aporte" }).click("Guardar cambios")],
  ["cobrar", (a) => a.clickIn("ACTC", "Cobrado")],
  ["pagar", (a) => a.clickIn("Motores Rossi", "Pagado")],
  ["baja", (a) => a.clickIn("Taller Gómez", "✕")],
]));

test("contratos: alta, cuotas, cobro y baja", () => same(sample(), [
  ["pestaña", (a) => a.tab("Contratos")],
  ["alta", (a) => a.fill({ cs: "Shell", cn: "S-1", ct: "1000000", cf: "2026-02-01", cu: "2026-11-30", cq: "4", c1: "", cd: "Calcos" }).click("Agregar contrato")],
  ["monto cuota", (a) => a.changeEl(a.inputsIn("vence 01/04/2026").at(-1), "450000")],
  ["cobrar", (a) => a.clickIn("vence 01/04/2026", "Cobrada")],
  ["deshacer", (a) => { [...a.doc.querySelectorAll("tr")].filter((r) => r.textContent.includes("Deshacer")).at(-1).querySelector("button").click(); }],
  ["baja", (a) => a.clickIn("Shell", "Eliminar", ".card")],
]));

test("inventario: neumáticos y motores", () => same(sample(), [
  ["pestaña", (a) => a.tab("Inventario")],
  ["neumáticos", (a) => a.fill({ ir: "r3", inw: "7", irs: "2", ic: "2000000" }).clickNear("inw", "Agregar")],
  ["editar neumáticos", (a) => a.clickIn("Fecha 1 · Viedma", "✎")],
  ["guardar", (a) => a.fill({ inw: "5" }).clickNear("inw", "Guardar cambios")],
  ["motor", (a) => a.fill({ xk: "Motor", xi: "Motor 4", xr: "", xs: "En uso", xc: "18000000", xd: "2026-03-01" }).clickNear("xi", "Agregar")],
  ["+1", (a) => a.clickIn("Caja", "+1")],
  ["−1", (a) => a.clickIn("Motor 3", "−1")],
  ["cerrar carrera", (a) => a.click("+1 carrera a los que están En uso")],
  ["editar motor", (a) => a.clickIn("Motor 4", "✎")],
  ["guardar motor", (a) => a.fill({ xs: "En reconstrucción" }).clickNear("xi", "Guardar cambios")],
  ["borrar", (a) => a.clickIn("Caja", "✕")],
  ["borrar neumáticos", (a) => a.clickIn("Fecha 3 · Rafaela", "✕")],
]));

test("presupuesto y equipo", () => same(sample(), [
  ["pestaña", (a) => a.tab("Presupuesto")],
  ["presupuesto Seguro", (a) => a.changeEl(a.doc.querySelector('input[data-c="Seguro"]'), "900000")],
  ["temporada", (a) => changeSel(a, "setTot", "3")],
  ["equipo", (a) => a.tab("Equipo")],
  ["dueño", (a) => changeSel(a, "setOwner", "Piloto")],
  ["aporte", (a) => a.fill({ apn: "Familia", app: "10" }).clickNear("apn", "Agregar")],
  ["personal", (a) => a.fill({ stn: "Ana", str: "Chasista", stp: "200000", stv: "" }).clickNear("stn", "Agregar")],
  ["borrar aporte", (a) => a.clickIn("YPF", "✕")],
  ["otro equipo sin config", (a) => a.click("Equipo Chevrolet")],
  ["presupuesto vacío", (a) => a.tab("Presupuesto")],
]));

test("equipos: alta y baja", () => same(sample(), [
  ["sin nombre", (a) => a.click("Agregar equipo")],
  ["alta", (a) => a.fill({ tn: "Equipo Dodge", tp: "Ana Gómez" }).click("Agregar equipo")],
  ["guardar gasto", (a) => a.fill({ a: "5000" }).click("Guardar")],
  ["baja", (a) => a.click("Eliminar equipo")],
]));

test("reportes: exportaciones en USD e importación", () => same({ state: { ...sampleState(), disp: "USD", fxref: 1000 } }, [
  ["pestaña", (a) => a.tab("Reportes")],
  ["csv", (a) => a.click("Movimientos (CSV)")],
  ["pdf", (a) => a.click("Informe (PDF)")],
  ["json", (a) => a.click("Descargar copia (JSON)")],
  ["importar copia vieja", (a) => a.importJSON(JSON.stringify(stage1State()))],
]));

test("copia de la etapa 1", () => same({ state: stage1State() }, ["Resumen", "Pendientes", "Contratos", "Inventario", "Presupuesto", "Equipo", "Reportes", "Carreras"].map((n) => [n, (a) => a.tab(n)])));
