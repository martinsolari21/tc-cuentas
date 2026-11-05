// Piezas de HTML compartidas por las vistas.
import { esc, fd, daysLeft } from "../format.js";

/** <option> de una lista; `sel` marca la elegida. */
export function options(list, sel) {
  return list.map((o) => "<option" + (sel !== undefined && o === sel ? " selected" : "") + ">" + o + "</option>").join("");
}

/** Opciones de carrera con "Sin carrera" primero. */
export function raceOptions(races, sel) {
  return '<option value="">Sin carrera</option>' + races.map((r) => '<option value="' + r.id + '"' + (sel !== undefined && r.id === sel ? " selected" : "") + ">" + esc(r.name) + "</option>").join("");
}

/** Aviso de vencimiento. */
export function badge(d, ref) {
  if (!d) return "";
  const n = daysLeft(d, ref);
  return n < 0 ? '<b class="ko">vencido hace ' + -n + " d</b>" : n <= 7 ? '<b class="ko">vence en ' + n + " d</b>" : '<span class="mu">vence ' + fd(d) + "</span>";
}

/** Botón principal de un formulario: "Agregar" o, si se está editando, "Guardar cambios" + Cancelar. */
export function submit(act, label, editing) {
  return '<button class="p" data-act="' + act + '">' + (editing ? "Guardar cambios" : label) + "</button>" + (editing ? ' <button data-act="cancel">Cancelar</button>' : "");
}

/** Atributo value="" escapado. */
export function val(v) { return ' value="' + esc(v == null ? "" : v) + '"'; }

/** Barra de progreso de presupuesto. */
export function progress(p) {
  return '<div class="pb"><i class="' + (p > 100 ? "x" : "") + '" style="width:' + Math.min(p, 100) + '%"></i></div>';
}

/** Diferencia presupuesto − real con signo y color. */
export function diffCell(budget, real, m, tag = "td") {
  return "<" + tag + ' class="n ' + (budget ? (real <= budget ? "ok" : "ko") : "mu") + '">' + (budget ? (real <= budget ? "+" : "−") + m(Math.abs(budget - real)) : "–") + "</" + tag + ">";
}
