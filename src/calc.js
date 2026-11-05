// Cálculos de la app. Funciones puras: reciben el estado y devuelven números.
// No tocan el DOM ni el almacenamiento, así se pueden testear directo.
import { LOG } from "./constants.js";
import { addMonths, daysLeft } from "./format.js";

export const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
export const find = (arr, id) => arr.filter((x) => x.id === id)[0];
export const ofTeam = (arr, team) => arr.filter((x) => x.team === team);

/** Carreras del equipo ordenadas por fecha (las sin fecha al final). */
export function teamRaces(S, team) {
  return ofTeam(S.races, team).sort((a, b) => ((a.date || "9") > (b.date || "9") ? 1 : -1));
}

/** Movimientos del equipo, del más nuevo al más viejo. */
export function teamMoves(S, team) {
  return ofTeam(S.moves, team).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function raceName(S, rid) {
  const r = find(S.races, rid || "");
  return r ? r.name : "Sin carrera";
}

const expenses = (S, team) => S.moves.filter((x) => x.team === team && x.type === "g");

/** Gasto asignado a una carrera ("" = sin carrera). */
export function spent(S, team, rid) {
  return sum(expenses(S, team).filter((x) => (x.race || "") === rid), (x) => x.amt);
}

/** Gasto de logística (traslado, hospedaje, viáticos) de una carrera. */
export function logistics(S, team, rid) {
  return sum(expenses(S, team).filter((x) => (x.race || "") === rid && LOG.indexOf(x.cat) >= 0), (x) => x.amt);
}

/** Ingresos, gastos y gastos por categoría de una lista de movimientos. */
export function totals(moves) {
  let inc = 0, exp = 0;
  const by = {};
  moves.forEach((x) => {
    if (x.type === "i") inc += x.amt;
    else { exp += x.amt; by[x.cat] = (by[x.cat] || 0) + x.amt; }
  });
  return { inc, exp, bal: inc - exp, by };
}

export function realByCat(S, team, cat) { return sum(expenses(S, team).filter((x) => x.cat === cat), (x) => x.amt); }
export function totalExpense(S, team) { return sum(expenses(S, team), (x) => x.amt); }
export function totalIncome(S, team) { return sum(ofTeam(S.moves, team).filter((x) => x.type === "i"), (x) => x.amt); }

/** Costo por km de una carrera: gasto total / km. */
export function costPerKm(spentAmt, km) { return km > 0 ? spentAmt / km : 0; }

/**
 * Proyección de temporada: gasto actual + promedio por carrera con gasto × carreras restantes.
 * @param races lista de {spent}
 */
export function projection({ spentNow, races, seasonRaces }) {
  const done = races.filter((r) => r.spent > 0);
  const avg = done.length ? sum(done, (r) => r.spent) / done.length : 0;
  const rem = seasonRaces > 0 ? Math.max(0, seasonRaces - done.length) : 0;
  return { done: done.length, avg, rem, close: spentNow + avg * rem };
}

/** Cuotas mensuales iguales; la última absorbe el resto. */
export function splitInstallments(total, n, firstDate) {
  const base = Math.floor(total / n), out = [];
  for (let i = 0; i < n; i++) out.push({ date: addMonths(firstDate, i), amt: i < n - 1 ? base : total - base * (n - 1) });
  return out;
}

/** Lo que falta cobrar de los contratos y cuánto de eso está vencido. */
export function contractPending(cons, ref) {
  let pen = 0, ven = 0;
  cons.forEach((c) => c.inst.forEach((i) => {
    if (!i.paid) { pen += i.amt; if (daysLeft(i.date, ref) < 0) ven += i.amt; }
  }));
  return { pen, ven };
}

/** Vencidos y por vencer (≤ 7 días) entre pendientes y cuotas sin cobrar. */
export function alertCounts(S, team, ref) {
  let late = 0, soon = 0;
  const check = (d) => { const n = daysLeft(d, ref); if (n < 0) late++; else if (n <= 7) soon++; };
  ofTeam(S.pend, team).forEach((x) => { if (x.due) check(x.due); });
  ofTeam(S.cons, team).forEach((k) => k.inst.forEach((i) => { if (!i.paid) check(i.date); }));
  return { late, soon };
}

/** Total por pagar (pagos y multas) y por cobrar de los pendientes. */
export function pendTotals(list) {
  let pay = 0, collect = 0;
  list.forEach((x) => { if (x.kind === "c") collect += x.amt; else pay += x.amt; });
  return { pay, collect };
}

/** Configuración del equipo; la crea vacía si no existe (comportamiento heredado). */
export function teamCfg(S, team) {
  return S.cfg[team] || (S.cfg[team] = { bud: {}, total: 0, owner: "", aport: [], staff: [] });
}
