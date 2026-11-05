// Pestaña Reportes: exportaciones, copia de seguridad y resumen.
import { esc } from "../format.js";
import { spent, totalExpense, totalIncome } from "../calc.js";
import { diffCell } from "./ui.js";

export function viewReportes({ S, t, m, races }) {
  const I = totalIncome(S, t.id), G = totalExpense(S, t.id);
  return '<div class="card"><h2>Exportar</h2><div class="row"><button class="p" data-act="exCSV">Movimientos (CSV)</button><button class="p" data-act="exPDF">Informe (PDF)</button></div></div>'
    + '<div class="card"><h2>Copia de seguridad</h2><div class="row"><button data-act="exJSON">Descargar copia (JSON)</button><label class="mu">Importar copia <input type="file" accept=".json" data-change="impF"></label></div><div class="mu" style="margin-top:6px"><small>Incluye todos los equipos y datos. Importar reemplaza lo que hay ahora.</small></div></div>'
    + '<div class="card"><h2>Resumen de temporada</h2><div class="k"><div><small>Ingresos</small><b class="ok">' + m(I) + '</b></div><div><small>Gastos</small><b class="ko">' + m(G) + "</b></div><div><small>Balance</small><b>" + m(I - G) + "</b></div></div></div>"
    + '<div class="card"><h2>Por carrera</h2><div class="sc"><table><tr><th>Carrera</th><th class="n">Gasto</th><th class="n">Presupuesto</th><th class="n">Diferencia</th></tr>'
    + races.map((r) => { const s = spent(S, t.id, r.id), b = r.budget || 0; return "<tr><td>" + esc(r.name) + '</td><td class="n">' + m(s) + '</td><td class="n">' + (b ? m(b) : "–") + "</td>" + diffCell(b, s, m) + "</tr>"; }).join("")
    + "</table></div></div>";
}
