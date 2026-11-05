// Partes fijas de la pantalla de un equipo: aviso de vencimientos, encabezado,
// totales, formulario de movimiento y pestañas.
import { CATS, VOUCHERS } from "../constants.js";
import { esc } from "../format.js";
import { alertCounts, find, ofTeam, spent } from "../calc.js";
import { options, raceOptions, submit, val } from "./ui.js";

export const TABS = [
  ["res", "Resumen"], ["car", "Carreras"], ["pen", "Pendientes"], ["con", "Contratos"],
  ["inv", "Inventario"], ["pre", "Presupuesto"], ["eq", "Equipo"], ["rep", "Reportes"],
];

export function alertsCard({ S, t, ref }) {
  const { late: v, soon: p } = alertCounts(S, t.id, ref);
  if (!v && !p) return "";
  return '<div class="card" style="border-color:var(--ko)"><b class="ko">⚠ ' + (v ? v + " vencido" + (v > 1 ? "s" : "") : "") + (v && p ? " · " : "") + (p ? p + " por vencer en 7 días" : "") + '</b> <span class="mu">— revisá Pendientes y Contratos</span></div>';
}

export function header({ t, tot, m }) {
  return '<div class="row" style="justify-content:space-between;margin-bottom:8px"><div><b>' + esc(t.name) + "</b>" + (t.pilot ? ' <span class="mu">· ' + esc(t.pilot) + "</span>" : "") + '</div><button class="g" data-act="delTeam">Eliminar equipo</button></div>'
    + '<div class="k"><div><small>Ingresos</small><b class="ok">' + m(tot.inc) + '</b></div><div><small>Gastos</small><b class="ko">' + m(tot.exp) + '</b></div><div><small>Balance</small><b class="' + (tot.bal >= 0 ? "ok" : "ko") + '">' + m(tot.bal) + "</b></div></div>";
}

export function moveForm({ S, races, ref }) {
  const e = S.edit && S.edit.k === "m" ? find(S.moves, S.edit.id) : null;
  const x = e || {};
  const usd = x.cur === "USD";
  return '<div class="card" style="margin-top:12px"><h2>Nuevo movimiento</h2><div class="row seg" style="margin-bottom:8px"><button class="' + (S.type === "g" ? "on" : "") + '" data-act="setType" data-v="g">Gasto</button><button class="' + (S.type === "i" ? "on" : "") + '" data-act="setType" data-v="i">Ingreso</button></div>'
    + '<div class="row"><select id="r" data-change="hint">' + raceOptions(races, e ? x.race || "" : S.race) + "</select>"
    + '<select id="c">' + options(CATS[S.type], e ? x.cat : undefined) + "</select>"
    + '<input id="a" type="number" min="0" inputmode="decimal" placeholder="Monto ARS"' + (e ? val(usd ? x.usd : x.amt) : "") + ">"
    + '<input id="d" type="date"' + val(e ? x.date : ref) + ">"
    + '<input id="nt" placeholder="Nota (opcional)"' + (e ? val(x.note || "") : "") + ">"
    + '<select id="mc">' + options(["ARS", "USD"], e ? x.cur || "ARS" : undefined) + "</select>"
    + '<input id="mx" type="number" min="0" placeholder="Cotiz. (si USD)"' + (e ? val(x.fx || "") : "") + ">"
    + '<select id="vt"><option value="">Comprobante</option>' + options(VOUCHERS, e ? x.vt || "" : undefined) + "</select>"
    + '<input id="vn" placeholder="N° comprobante"' + (e ? val(x.vn || "") : "") + ">"
    + '<input id="vp" placeholder="Proveedor / cliente"' + (e ? val(x.vp || "") : "") + ">"
    + '<input id="vc" placeholder="CUIT"' + (e ? val(x.vc || "") : "") + ">"
    + '<input id="vi" type="number" min="0" placeholder="IVA discriminado ARS"' + (e ? val(x.vi || "") : "") + ">"
    + submit("addMove", "Guardar", !!e)
    + '</div><div id="hint" style="margin-top:8px;font-size:13px"></div></div>';
}

/** Aviso de presupuesto restante para la carrera elegida en el formulario de movimiento. */
export function hintHTML({ S, rid, m }) {
  const r = find(S.races, rid);
  if (!r || !r.budget || S.type !== "g") return "";
  const rem = r.budget - spent(S, S.sel, rid);
  return rem >= 0
    ? "Presupuesto restante de <b>" + esc(r.name) + "</b>: <b>" + m(rem) + '</b> <button data-act="fill" data-v="' + rem + '">Completar con el restante</button>'
    : '<span class="ko">Presupuesto excedido en ' + m(-rem) + "</span>";
}

export function tabs({ S, t }) {
  const np = ofTeam(S.pend, t.id).length;
  return '<div class="tabs">' + TABS.map(([k, name]) => '<button class="' + (S.view === k ? "on" : "") + '" data-act="setView" data-v="' + k + '">' + name + (k === "pen" && np ? " (" + np + ")" : "") + "</button>").join("") + "</div>";
}
