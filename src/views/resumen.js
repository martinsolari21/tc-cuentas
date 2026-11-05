// Inicio (balance, lo urgente, próxima fecha, gastos por categoría) y Movimientos.
import { esc, fd, daysLeft } from "../format.js";
import { alertCounts, ofTeam, raceName, spent, teamMoves } from "../calc.js";
import { hero } from "./shell.js";
import { badge, progress } from "./ui.js";

/** Datos del comprobante y de la moneda, al lado de la nota. */
export function voucherInfo(x, m) {
  return (x.vt || x.vn ? " <small>· " + esc(x.vt || "") + " " + esc(x.vn || "") + "</small>" : "")
    + (x.vp ? " <small>· " + esc(x.vp) + (x.vc ? " CUIT " + esc(x.vc) : "") + "</small>" : "")
    + (x.vi ? " <small>· IVA " + m(x.vi) + "</small>" : "")
    + (x.cur === "USD" ? " <small>· USD " + x.usd + " @ " + x.fx + "</small>" : "");
}

const initials = (cat) => cat.split(/\s+/).filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || cat.slice(0, 2).toUpperCase();

/** Fila de movimiento (lista tipo billetera). */
function moveRow(S, x, m) {
  const inc = x.type === "i";
  return '<div class="item"><span class="av ' + (inc ? "av-ok" : "") + '" aria-hidden="true">' + initials(x.cat) + "</span>"
    + '<div class="it-main"><div class="it-title">' + x.cat + '</div><div class="it-sub">' + fd(x.date) + " · " + esc(raceName(S, x.race)) + (x.note ? " · " + esc(x.note) : "") + voucherInfo(x, m) + "</div></div>"
    + '<div class="it-right"><div class="it-amt num ' + (inc ? "ok" : "ko") + '">' + (inc ? "+" : "−") + m(x.amt) + "</div>"
    + '<div class="it-act"><button class="g" data-act="editMove" data-i="' + x.id + '" aria-label="Editar">✎</button><button class="g" data-act="delMove" data-i="' + x.id + '" aria-label="Borrar">✕</button></div></div></div>';
}

/** Pendientes y cuotas vencidas o que vencen en 7 días, con acción directa. */
function toResolve(S, t, m, ref) {
  const items = [];
  ofTeam(S.pend, t.id).forEach((p) => {
    if (p.due && daysLeft(p.due, ref) <= 7) items.push({ due: p.due, html: '<div class="it-main"><div class="it-title">' + esc(p.party || p.cat) + (p.fine && p.fine.art ? ' <span class="chip">art. ' + esc(p.fine.art) + "</span>" : "") + '</div><div class="it-sub">' + badge(p.due, ref) + "</div></div>"
      + '<div class="it-amt num ' + (p.kind === "c" ? "ok" : "ko") + '">' + m(p.amt) + '</div><button class="pill" data-act="markPaid" data-i="' + p.id + '">' + (p.kind === "c" ? "Cobrado" : "Pagado") + "</button>" });
  });
  ofTeam(S.cons, t.id).forEach((c) => c.inst.forEach((i, k) => {
    if (!i.paid && daysLeft(i.date, ref) <= 7) items.push({ due: i.date, html: '<div class="it-main"><div class="it-title">Cuota ' + (k + 1) + " · " + esc(c.sponsor) + '</div><div class="it-sub">' + badge(i.date, ref) + "</div></div>"
      + '<div class="it-amt num ok">' + m(i.amt) + '</div><button class="pill" data-c="' + c.id + '" data-i="' + i.id + '" data-act="payInst">Cobrada</button>' });
  }));
  if (!items.length) return "";
  items.sort((a, b) => (a.due > b.due ? 1 : -1));
  const { late, soon } = alertCounts(S, t.id, ref);
  return '<section class="card"><div class="sec-head"><h2>A resolver</h2><span class="ko small">' + (late ? late + " vencido" + (late > 1 ? "s" : "") : "") + (late && soon ? " · " : "") + (soon ? soon + " por vencer en 7 días" : "") + "</span></div>"
    + '<div class="list">' + items.map((x) => '<div class="item">' + x.html + "</div>").join("") + "</div></section>";
}

/** Próxima carrera (hoy o después) con su presupuesto. */
function nextRace(S, t, m, races, ref) {
  const r = races.find((x) => x.date && x.date >= ref);
  if (!r) return "";
  const s = spent(S, t.id, r.id), b = r.budget, p = b > 0 ? s / b * 100 : 0, n = daysLeft(r.date, ref);
  return '<section class="card race-next"><div class="sec-head"><h2>Próxima fecha</h2><span class="mu small">' + (n === 0 ? "hoy" : "en " + n + " día" + (n > 1 ? "s" : "")) + "</span></div>"
    + '<div class="rn-name">' + esc(r.name) + '</div><div class="mu small">' + fd(r.date) + (r.sede ? " · " + esc(r.sede) : "") + "</div>"
    + (b > 0 ? progress(p) + '<div class="small ' + (p > 100 ? "ko" : "mu") + '">' + (p > 100 ? "Excedido en " + m(s - b) : "Gastado " + m(s) + " de " + m(b)) + "</div>" : '<div class="mu small" style="margin-top:6px">Sin presupuesto</div>')
    + '<button class="pill" style="margin-top:10px" data-act="useRace" data-i="' + r.id + '">Cargar gasto</button></section>';
}

export function viewResumen({ S, t, m, tot, races, ref }) {
  const by = tot.by;
  const cats = Object.keys(by).sort((a, b) => by[b] - by[a]);
  const max = Math.max(...cats.map((k) => by[k]), 1);
  const mv = teamMoves(S, t.id);
  return hero({ t, tot, m }) + toResolve(S, t, m, ref) + nextRace(S, t, m, races, ref)
    + (cats.length ? '<section class="card"><h2>Gastos por categoría</h2>' + cats.map((c) => '<div class="br"><span>' + c + '</span><span class="t"><i style="width:' + (by[c] / max * 100) + '%"></i></span><span class="num">' + m(by[c]) + "</span></div>").join("") + "</section>" : "")
    + '<section class="card"><div class="sec-head"><h2>Últimos movimientos</h2>' + (mv.length > 5 ? '<button class="link" data-act="setView" data-v="mov">Ver todos</button>' : "") + "</div>"
    + (mv.length ? '<div class="list">' + mv.slice(0, 5).map((x) => moveRow(S, x, m)).join("") + "</div>" : empty()) + "</section>";
}

const empty = () => '<div class="empty"><b>Cargá tu primer movimiento</b><span class="mu">Tocá el botón + para registrar un gasto o un ingreso.</span></div>';

export function viewMovimientos({ S, t, m }) {
  const mv = teamMoves(S, t.id);
  let last = "";
  return '<h1 class="page-title">Movimientos</h1><section class="card">' + (mv.length
    ? '<div class="list">' + mv.map((x) => {
      const head = x.date !== last ? '<div class="day">' + fd(x.date) + "</div>" : "";
      last = x.date;
      return head + moveRow(S, x, m);
    }).join("") + "</div>"
    : empty()) + "</section>";
}

