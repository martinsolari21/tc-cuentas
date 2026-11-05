// Pestaña Resumen: gastos por categoría y lista de movimientos.
import { esc, fd } from "../format.js";
import { raceName, teamMoves } from "../calc.js";

/** Datos del comprobante y de la moneda, al lado de la nota. */
export function voucherInfo(x, m) {
  return (x.vt || x.vn ? " <small>· " + esc(x.vt || "") + " " + esc(x.vn || "") + "</small>" : "")
    + (x.vp ? " <small>· " + esc(x.vp) + (x.vc ? " CUIT " + esc(x.vc) : "") + "</small>" : "")
    + (x.vi ? " <small>· IVA " + m(x.vi) + "</small>" : "")
    + (x.cur === "USD" ? " <small>· USD " + x.usd + " @ " + x.fx + "</small>" : "");
}

export function viewResumen({ S, t, m, tot }) {
  const mv = teamMoves(S, t.id);
  const by = tot.by;
  const cats = Object.keys(by).sort((a, b) => by[b] - by[a]);
  const max = Math.max(...cats.map((k) => by[k]), 1);
  return (cats.length ? '<div class="card"><h2>Gastos por categoría</h2>' + cats.map((c) => '<div class="br"><span>' + c + '</span><span class="t"><i style="width:' + (by[c] / max * 100) + '%"></i></span><span>' + m(by[c]) + "</span></div>").join("") + "</div>" : "")
    + '<div class="card"><h2>Movimientos</h2>' + (mv.length
      ? '<div class="sc"><table><tr><th>Fecha</th><th>Carrera</th><th>Categoría</th><th>Nota</th><th style="text-align:right">Monto</th><th></th></tr>'
        + mv.map((x) => "<tr><td>" + fd(x.date) + "</td><td>" + esc(raceName(S, x.race)) + "</td><td>" + x.cat + '</td><td class="mu">' + esc(x.note) + voucherInfo(x, m) + '</td><td class="n ' + (x.type === "i" ? "ok" : "ko") + '">' + (x.type === "i" ? "+" : "−") + m(x.amt) + '</td><td><button class="g" data-act="delMove" data-i="' + x.id + '" aria-label="Borrar">✕</button><button class="g" data-act="editMove" data-i="' + x.id + '" aria-label="Editar">✎</button></td></tr>').join("")
        + "</table></div>"
      : '<span class="mu">Todavía no hay movimientos.</span>') + "</div>";
}
