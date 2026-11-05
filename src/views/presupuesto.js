// Pestaña Presupuesto: presupuesto de temporada por categoría y proyección.
import { CATS } from "../constants.js";
import { projection, realByCat, spent, sum, teamCfg, totalExpense } from "../calc.js";
import { diffCell, progress } from "./ui.js";

export function viewPresupuesto({ S, t, m, races }) {
  const c = teamCfg(S, t.id);
  const gt = totalExpense(S, t.id);
  const pr = projection({ spentNow: gt, races: races.map((r) => ({ spent: spent(S, t.id, r.id) })), seasonRaces: c.total });
  let G = 0, B = 0;
  const rows = CATS.g.map((k) => {
    const r = realByCat(S, t.id, k), b = c.bud[k] || 0, p = b > 0 ? r / b * 100 : 0;
    G += r; B += b;
    if (!b && !r) return "";
    return "<tr><td>" + k + '</td><td class="n">' + m(b) + '</td><td class="n">' + m(r) + "</td>" + diffCell(b, r, m) + '<td style="min-width:90px">' + (b > 0 ? progress(p) : "") + "</td></tr>";
  }).join("");
  const editor = CATS.g.map((k) => '<label class="mu" style="flex:1 1 200px;display:flex;justify-content:space-between;gap:6px">' + k + '<input type="number" min="0" value="' + (c.bud[k] || "") + '" placeholder="ARS" data-c="' + k + '" data-change="setCB" style="max-width:120px;flex:0 1 120px"></label>').join("");

  return '<div class="card"><h2>Presupuesto de temporada por categoría (ARS)</h2><div class="row">' + editor + "</div></div>"
    + '<div class="card"><h2>Real vs presupuestado</h2>'
    + (rows
      ? '<div class="sc"><table><tr><th>Categoría</th><th class="n">Presup.</th><th class="n">Real</th><th class="n">Diferencia</th><th></th></tr>' + rows
        + '<tr><th>Total</th><th class="n">' + m(B) + '</th><th class="n">' + m(G) + "</th>" + diffCell(B, G, m, "th") + "<th></th></tr></table></div>"
      : '<span class="mu">Cargá presupuestos o gastos para ver la comparación.</span>')
    + '<div class="mu" style="margin-top:6px"><small>Por carrera: presupuesto sumado ' + m(sum(races, (r) => r.budget || 0)) + " · gasto asignado a carreras " + m(sum(races, (r) => spent(S, t.id, r.id))) + "</small></div></div>"
    + '<div class="card"><h2>Proyección de la temporada</h2><div class="row"><label class="mu">Carreras de la temporada <input type="number" min="0" value="' + (c.total || "") + '" data-change="setTot" style="max-width:90px"></label></div>'
    + (c.total > 0
      ? '<div class="k" style="margin-top:8px"><div><small>Gasto actual</small><b>' + m(gt) + "</b></div><div><small>Promedio por carrera (" + pr.done + " con gasto)</small><b>" + m(pr.avg) + "</b></div><div><small>Cierre estimado (" + pr.rem + " restantes)</small><b>" + m(pr.close) + "</b></div></div>"
        + (B ? '<div class="' + (pr.close <= B ? "ok" : "ko") + '" style="margin-top:8px">Contra el presupuesto de ' + m(B) + ": " + (pr.close <= B ? "quedarías " + m(B - pr.close) + " por debajo" : "te pasarías " + m(pr.close - B)) + "</div>" : "")
        + '<div class="mu"><small>Estimación simple: gasto actual + promedio por carrera × carreras restantes.</small></div>'
      : '<div class="mu" style="margin-top:6px"><small>Ingresá la cantidad de carreras de la temporada para estimar el cierre.</small></div>')
    + "</div>";
}
