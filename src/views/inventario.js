// Pestaña Inventario: neumáticos por carrera y motores/repuestos.
import { EST, TIRE_REF } from "../constants.js";
import { esc, fd } from "../format.js";
import { find, ofTeam, raceName } from "../calc.js";
import { options, raceOptions, submit, val } from "./ui.js";

const over = (n) => (n > TIRE_REF ? ' <small class="ko">&gt;' + TIRE_REF + "</small>" : "");

function tires({ S, t, m, races }) {
  const L = ofTeam(S.tires, t.id);
  const e = S.edit && S.edit.k === "t" ? find(S.tires, S.edit.id) : null;
  let tn = 0, tr = 0, tc = 0;
  L.forEach((x) => { tn += x.nw; tr += x.rs; tc += x.cost; });
  return '<div class="card"><h2>Neumáticos por carrera</h2><div class="row"><select id="ir">' + raceOptions(races, e ? e.race || "" : undefined) + "</select>"
    + '<input id="inw" type="number" min="0" placeholder="Nuevos comprados"' + (e ? val(e.nw) : "") + ">"
    + '<input id="irs" type="number" min="0" placeholder="Resellados de la anterior"' + (e ? val(e.rs) : "") + ">"
    + '<input id="ic" type="number" min="0" placeholder="Costo ARS"' + (e ? val(e.cost || "") : "") + ">"
    + '<label class="mu"><input id="ik" type="checkbox" style="flex:0"> Cargar también como gasto</label>' + submit("addTire", "Agregar", !!e) + "</div>"
    + '<div class="mu" style="margin:6px 0"><small>Referencia: por fecha se usan 6 neumáticos nuevos sellados por la ACTC y se pueden resellar 6 de la anterior. Verificá el reglamento vigente.</small></div>'
    + (L.length
      ? '<div class="sc"><table><tr><th>Carrera</th><th class="n">Nuevos</th><th class="n">Resellados</th><th class="n">Costo</th><th class="n">Por nuevo</th><th></th></tr>'
        + L.map((x) => "<tr><td>" + esc(raceName(S, x.race)) + '</td><td class="n">' + x.nw + over(x.nw) + '</td><td class="n">' + x.rs + over(x.rs) + '</td><td class="n">' + m(x.cost) + '</td><td class="n">' + (x.nw && x.cost ? m(x.cost / x.nw) : "–") + '</td><td class="n"><button class="g" data-act="editTire" data-i="' + x.id + '">✎</button><button class="g" data-act="delTire" data-i="' + x.id + '">✕</button></td></tr>').join("")
        + '<tr><th>Total</th><th class="n">' + tn + '</th><th class="n">' + tr + '</th><th class="n">' + m(tc) + "</th><th></th><th></th></tr></table></div>"
      : '<span class="mu">Sin registros todavía.</span>')
    + "</div>";
}

function parts({ S, t, m }) {
  const P = ofTeam(S.parts, t.id);
  const e = S.edit && S.edit.k === "x" ? find(S.parts, S.edit.id) : null;
  return '<div class="card"><h2>Motores y repuestos</h2><div class="row"><select id="xk">' + options(["Motor", "Repuesto"], e ? e.kind : undefined) + "</select>"
    + '<input id="xi" placeholder="Identificación (ej: Motor 3)"' + (e ? val(e.ident) : "") + ">"
    + '<input id="xr" type="number" min="0" placeholder="Carreras de uso"' + (e ? val(e.races) : "") + ">"
    + '<select id="xs">' + options(EST, e ? e.state : undefined) + "</select>"
    + '<input id="xc" type="number" min="0" placeholder="Costo ARS"' + (e ? val(e.cost || "") : "") + ">"
    + '<label class="mu">Últ. reconstrucción <input id="xd" type="date"' + (e ? val(e.rebuild || "") : "") + "></label>" + submit("addPart", "Agregar", !!e) + "</div>"
    + (P.length
      ? '<div class="row" style="margin:8px 0"><button data-act="closeRace">+1 carrera a los que están En uso</button></div><div class="sc"><table><tr><th>Tipo</th><th>Identificación</th><th class="n">Carreras</th><th>Estado</th><th class="n">Costo</th><th>Últ. reconstr.</th><th></th></tr>'
        + P.map((p) => {
          const a = 'data-i="' + p.id + '"';
          return "<tr><td>" + p.kind + "</td><td>" + esc(p.ident) + '</td><td class="n">' + p.races + "</td><td>" + p.state + '</td><td class="n">' + m(p.cost) + "</td><td>" + (fd(p.rebuild) || "–") + '</td><td class="n">'
            + '<button class="g" ' + a + ' data-act="bump" data-v="1">+1</button><button class="g" ' + a + ' data-act="bump" data-v="-1">−1</button><button class="g" ' + a + ' data-act="editPart">✎</button><button class="g" ' + a + ' data-act="delPart">✕</button></td></tr>';
        }).join("") + "</table></div>"
      : '<div class="mu" style="margin-top:8px"><small>Sin ítems todavía.</small></div>')
    + "</div>";
}

export function viewInventario(ctx) { return tires(ctx) + parts(ctx); }
