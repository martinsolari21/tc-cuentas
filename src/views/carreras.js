// Pestaña Carreras: alta y edición, presupuesto por carrera, comparación y costo por km.
import { CATS, FASES } from "../constants.js";
import { esc, fd } from "../format.js";
import { costPerKm, find, logistics, spent } from "../calc.js";
import { diffCell, options, progress, submit, val } from "./ui.js";

function raceForm({ S }) {
  const e = S.edit && S.edit.k === "r" ? find(S.races, S.edit.id) : null;
  const r = e || {};
  return '<details class="card add"' + (e ? " open" : "") + "><summary>" + (e ? "Editar carrera" : "Nueva carrera") + '</summary><div class="row">'
    + '<input id="rn" placeholder="Carrera (ej: Fecha 3 · Rafaela)"' + (e ? val(r.name) : "") + ">"
    + '<input id="rd" type="date"' + (e ? val(r.date || "") : "") + ">"
    + '<input id="rb" type="number" min="0" inputmode="decimal" placeholder="Presupuesto ARS (opcional)"' + (e ? val(r.budget || "") : "") + ">"
    + '<input id="rs" placeholder="Sede"' + (e ? val(r.sede || "") : "") + ">"
    + '<input id="rk" type="number" min="0" placeholder="Km de traslado"' + (e ? val(r.km || "") : "") + ">"
    + '<select id="rf">' + options(FASES, e ? r.fase || FASES[0] : undefined) + "</select>"
    + '<input id="rr" placeholder="Resultado final (opcional)"' + (e ? val(r.res || "") : "") + ">"
    + submit("addRace", "Agregar", !!e) + "</div></details>";
}

/** Sede, fase, km, resultado y costo por km de una carrera. */
function raceInfo(S, t, r, s, m) {
  const p = [];
  if (r.sede) p.push(esc(r.sede));
  if (r.fase) p.push(r.fase);
  if (r.km) p.push(r.km + " km");
  if (r.res) p.push("Resultado: " + esc(r.res));
  let h = p.length ? '<div class="mu"><small>' + p.join(" · ") + "</small></div>" : "";
  if (r.km > 0) h += '<div class="mu"><small>Costo por km: ' + m(costPerKm(s, r.km)) + " · logística por km: " + m(costPerKm(logistics(S, t.id, r.id), r.km)) + "</small></div>";
  return h;
}

function raceCard(S, t, r, m, k) {
  const s = spent(S, t.id, r.id), b = r.budget, p = b > 0 ? s / b * 100 : 0;
  return '<div class="card race"><div class="race-head"><span class="pos num" aria-hidden="true">' + (k + 1) + '</span><b class="race-name">' + esc(r.name) + '</b><span class="mu small">' + fd(r.date) + "</span></div>"
    + raceInfo(S, t, r, s, m)
    + '<div class="row" style="margin-top:6px"><span>Gastado <b class="ko">' + m(s) + '</b></span><label class="mu">Presupuesto <input type="number" min="0" value="' + (b || "") + '" placeholder="Sin presupuesto" data-change="setBud" data-i="' + r.id + '" style="max-width:150px"></label>'
    + '<button data-act="useRace" data-i="' + r.id + '">Cargar gasto</button><button class="g" data-act="delRace" data-i="' + r.id + '">Eliminar</button><button class="g" data-act="editRace" data-i="' + r.id + '">Editar</button></div>'
    + (b > 0
      ? progress(p) + '<small class="' + (p > 100 ? "ko" : "mu") + '">' + (p > 100 ? "Excedido en " + m(s - b) : p.toFixed(0) + "% usado · restan " + m(b - s)) + "</small>"
      : '<div class="mu" style="margin-top:6px"><small>Sin presupuesto definido</small></div>')
    + "</div>";
}

function comparison(S, t, rs, m) {
  const G = rs.slice();
  if (S.moves.some((x) => x.team === t.id && x.type === "g" && !x.race)) G.push({ id: "", name: "Sin carrera", budget: 0 });
  if (G.length <= 1) return '<div class="mu">Cargá al menos dos carreras con gastos para ver la comparación.</div>';
  const sp = (g) => spent(S, t.id, g.id);
  const mx = Math.max(...G.map((g) => Math.max(sp(g), g.budget || 0)), 1);
  const cs = CATS.g.filter((c) => S.moves.some((x) => x.team === t.id && x.type === "g" && x.cat === c));
  const cell = (c, g) => S.moves.filter((x) => x.team === t.id && x.type === "g" && x.cat === c && (x.race || "") === g.id).reduce((a, x) => a + x.amt, 0);
  return '<div class="card"><h2>Gasto por carrera <span class="mu" style="font-weight:400">(la marca negra es el presupuesto)</span></h2>'
    + G.map((g) => '<div class="br"><span>' + esc(g.name) + '</span><span class="t"><i style="width:' + (sp(g) / mx * 100) + '%"></i>' + (g.budget ? '<b class="tk" style="left:' + (g.budget / mx * 100) + '%"></b>' : "") + "</span><span>" + m(sp(g)) + "</span></div>").join("") + "</div>"
    + '<div class="card"><h2>Comparación por categoría</h2><div class="sc"><table><tr><th>Categoría</th>' + G.map((g) => '<th class="n">' + esc(g.name) + "</th>").join("") + "</tr>"
    + cs.map((c) => "<tr><td>" + c + "</td>" + G.map((g) => { const v = cell(c, g); return '<td class="n">' + (v ? m(v) : "–") + "</td>"; }).join("") + "</tr>").join("")
    + "<tr><th>Total</th>" + G.map((g) => '<th class="n">' + m(sp(g)) + "</th>").join("") + "</tr>"
    + '<tr><td class="mu">Presupuesto</td>' + G.map((g) => '<td class="n mu">' + (g.budget ? m(g.budget) : "–") + "</td>").join("") + "</tr>"
    + '<tr><td class="mu">Diferencia</td>' + G.map((g) => diffCell(g.budget, sp(g), m)).join("") + "</tr></table></div></div>";
}

function costTable(S, t, rs, m) {
  if (!rs.length) return "";
  return '<div class="card"><h2>Costo por carrera</h2><div class="sc"><table><tr><th>Carrera</th><th>Sede</th><th>Fase</th><th class="n">Km</th><th class="n">Gasto</th><th class="n">$/km</th><th>Resultado</th></tr>'
    + rs.map((r) => { const s = spent(S, t.id, r.id); return "<tr><td>" + esc(r.name) + "</td><td>" + esc(r.sede || "–") + "</td><td>" + (r.fase || "–") + '</td><td class="n">' + (r.km || "–") + '</td><td class="n">' + m(s) + '</td><td class="n">' + (r.km ? m(s / r.km) : "–") + "</td><td>" + esc(r.res || "–") + "</td></tr>"; }).join("")
    + "</table></div></div>";
}

export function viewCarreras({ S, t, m, races }) {
  return '<h1 class="page-title">Carreras</h1>' + raceForm({ S }) + (races.length ? "" : '<div class="empty"><b>Agregá la primera fecha</b><span class="mu">Con presupuesto, sede y km para ver el costo por km.</span></div>') + races.map((r, k) => raceCard(S, t, r, m, k)).join("") + comparison(S, t, races, m) + costTable(S, t, races, m);
}
