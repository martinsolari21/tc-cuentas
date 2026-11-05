// Partes fijas de la pantalla de un equipo: tarjeta de balance, barra inferior,
// botón "+" y hoja para cargar o editar un movimiento.
import { CATS, VOUCHERS } from "../constants.js";
import { esc } from "../format.js";
import { find, ofTeam, spent } from "../calc.js";
import { ICON } from "./icons.js";
import { options, raceOptions, val } from "./ui.js";

/** Pestañas de la barra inferior. El resto vive en "Más". */
export const NAV = [
  ["res", "Inicio", ICON.home], ["car", "Carreras", ICON.flag], ["mov", "Movimientos", ICON.list],
  ["pen", "Pendientes", ICON.clock], ["mas", "Más", ICON.dots],
];
/** Secciones de "Más": [vista, nombre, ícono, descripción]. */
export const MORE = [
  ["con", "Contratos", ICON.contract, "Auspicios y cuotas"],
  ["inv", "Inventario", ICON.tire, "Neumáticos, motores y repuestos"],
  ["pre", "Presupuesto", ICON.chart, "Real vs presupuestado y proyección"],
  ["eq", "Equipo", ICON.team, "Dueño del auto, aportes y personal"],
  ["rep", "Reportes", ICON.report, "CSV, PDF y copia de seguridad"],
];
const IN_MORE = MORE.map((x) => x[0]);

/** Tarjeta oscura con el balance de la temporada (estilo box de pista). */
export function hero({ t, tot, m }) {
  return '<section class="hero"><div class="hero-top"><span>' + esc(t.name) + (t.pilot ? " · " + esc(t.pilot) : "") + "</span></div>"
    + '<div class="hero-lbl">Balance de la temporada</div>'
    + '<div class="hero-bal num ' + (tot.bal >= 0 ? "ok" : "ko") + '">' + m(tot.bal) + "</div>"
    + '<div class="hero-kpis"><div><small>Ingresos</small><b class="num ok">' + m(tot.inc) + '</b></div><div><small>Gastos</small><b class="num ko">' + m(tot.exp) + "</b></div></div></section>";
}

export function bottomNav({ S, t }) {
  const np = ofTeam(S.pend, t.id).length;
  const cur = IN_MORE.includes(S.view) ? "mas" : NAV.some((n) => n[0] === S.view) ? S.view : "res";
  return NAV.map(([k, name, ic]) => '<button class="' + (cur === k ? "on" : "") + '" data-act="setView" data-v="' + k + '"' + (cur === k ? ' aria-current="page"' : "") + ">"
    + ic + '<span class="nl">' + name + "</span>" + (k === "pen" && np ? '<span class="badge num">' + np + "</span>" : "") + "</button>").join("");
}

/** Hoja inferior para cargar o editar un movimiento. Siempre está en el DOM; se muestra con S.sheet. */
export function moveSheet({ S, races, ref }) {
  const e = S.edit && S.edit.k === "m" ? find(S.moves, S.edit.id) : null;
  const x = e || {};
  const usd = x.cur === "USD";
  const hasVoucher = e && (x.vt || x.vn || x.vp || x.vc || x.vi || usd);
  return '<div class="sheet-back" data-act="closeSheet"></div>'
    + '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title"><div class="sheet-grab"></div>'
    + '<div class="sheet-head"><h2 id="sheet-title">' + (e ? "Editar movimiento" : "Nuevo movimiento") + '</h2><button class="icon-btn" data-act="closeSheet" aria-label="Cerrar">' + ICON.x + "</button></div>"
    + '<div class="seg"><button class="' + (S.type === "g" ? "on" : "") + '" data-act="setType" data-v="g">Gasto</button><button class="' + (S.type === "i" ? "on" : "") + '" data-act="setType" data-v="i">Ingreso</button></div>'
    + '<label class="amount"><span class="sr-only">Monto</span><input id="a" type="number" min="0" inputmode="decimal" placeholder="Monto ARS"' + (e ? val(usd ? x.usd : x.amt) : "") + "></label>"
    + '<div class="grid2"><label class="f"><span>Carrera</span><select id="r" data-change="hint">' + raceOptions(races, e ? x.race || "" : S.race) + "</select></label>"
    + '<label class="f"><span>Categoría</span><select id="c">' + options(CATS[S.type], e ? x.cat : undefined) + "</select></label>"
    + '<label class="f"><span>Fecha</span><input id="d" type="date"' + val(e ? x.date : ref) + "></label>"
    + '<label class="f"><span>Nota</span><input id="nt" placeholder="Nota (opcional)"' + (e ? val(x.note || "") : "") + "></label></div>"
    + '<div id="hint" class="hint"></div>'
    + "<details class=\"more\"" + (hasVoucher ? " open" : "") + "><summary>Moneda y comprobante</summary><div class=\"grid2\">"
    + '<label class="f"><span>Moneda</span><select id="mc">' + options(["ARS", "USD"], e ? x.cur || "ARS" : undefined) + "</select></label>"
    + '<label class="f"><span>Cotización</span><input id="mx" type="number" min="0" placeholder="Cotiz. (si USD)"' + (e ? val(x.fx || "") : "") + "></label>"
    + '<label class="f"><span>Comprobante</span><select id="vt"><option value="">Comprobante</option>' + options(VOUCHERS, e ? x.vt || "" : undefined) + "</select></label>"
    + '<label class="f"><span>Número</span><input id="vn" placeholder="N° comprobante"' + (e ? val(x.vn || "") : "") + "></label>"
    + '<label class="f"><span>Proveedor / cliente</span><input id="vp" placeholder="Proveedor / cliente"' + (e ? val(x.vp || "") : "") + "></label>"
    + '<label class="f"><span>CUIT</span><input id="vc" placeholder="CUIT"' + (e ? val(x.vc || "") : "") + "></label>"
    + '<label class="f"><span>IVA discriminado</span><input id="vi" type="number" min="0" placeholder="IVA discriminado ARS"' + (e ? val(x.vi || "") : "") + "></label></div></details>"
    + '<div class="sheet-actions">' + (e ? '<button data-act="cancel">Cancelar</button>' : "") + '<button class="p big" data-act="addMove">' + (e ? "Guardar cambios" : "Guardar") + "</button></div></div>";
}

/** Aviso de presupuesto restante para la carrera elegida en el formulario de movimiento. */
export function hintHTML({ S, rid, m }) {
  const r = find(S.races, rid);
  if (!r || !r.budget || S.type !== "g") return "";
  const rem = r.budget - spent(S, S.sel, rid);
  return rem >= 0
    ? "Presupuesto restante de <b>" + esc(r.name) + "</b>: <b>" + m(rem) + '</b> <button class="link" data-act="fill" data-v="' + rem + '">Completar con el restante</button>'
    : '<span class="ko">Presupuesto excedido en ' + m(-rem) + "</span>";
}

/** Pantalla "Más": accesos a las secciones que no están en la barra inferior. */
export function viewMas() {
  return '<h1 class="page-title">Más</h1><div class="tiles">' + MORE.map(([k, name, ic, desc]) =>
    '<button class="tile" data-act="setView" data-v="' + k + '">' + ic + '<span class="tl"><span class="tn">' + name + '</span><span class="td">' + desc + "</span></span>" + ICON.chevron + "</button>").join("") + "</div>";
}

/** Título de sección con volver a "Más" para las vistas que viven ahí. */
export function pageTitle(view) {
  const m = MORE.find((x) => x[0] === view);
  if (!m) return "";
  return '<div class="page-head"><button class="link back" data-act="setView" data-v="mas">‹ Más</button><h1 class="page-title">' + m[1] + "</h1></div>";
}
