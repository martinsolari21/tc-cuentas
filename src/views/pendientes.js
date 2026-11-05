// Pestaña Pendientes: pagos, cobros y multas que todavía no cuentan como movimiento.
import { CATS, FINE_WHO, PEND_LABEL } from "../constants.js";
import { esc, fd } from "../format.js";
import { find, ofTeam, pendTotals } from "../calc.js";
import { badge, options, raceOptions, submit, val } from "./ui.js";

/** Categorías del pendiente según su tipo: cobro → ingresos, pago o multa → gastos. */
export function pendCats(kind) { return kind === "c" ? CATS.i : CATS.g; }

function pendForm({ S, races }) {
  const e = S.edit && S.edit.k === "p" ? find(S.pend, S.edit.id) : null;
  const p = e || { kind: "p" };
  const f = (e && p.fine) || null;
  const isFine = p.kind === "f";
  return '<details class="card add"' + (e ? " open" : "") + "><summary>" + (e ? "Editar pendiente" : "Nuevo pago, cobro o multa pendiente") + '</summary><div class="row">'
    + '<select id="pk" data-change="pkch">' + [["p", "Pago a proveedor"], ["c", "Cobro pendiente"], ["f", "Multa"]].map(([v, l]) => '<option value="' + v + '"' + (p.kind === v ? " selected" : "") + ">" + l + "</option>").join("") + "</select>"
    + '<select id="pcat"' + (isFine ? ' style="display:none"' : "") + ">" + options(pendCats(p.kind), e ? p.cat : undefined) + "</select>"
    + '<input id="pa" type="number" min="0" inputmode="decimal" placeholder="Monto ARS"' + (e ? val(p.amt) : "") + ">"
    + '<input id="pp" placeholder="Proveedor / cliente"' + (e ? val(p.party || "") : "") + ">"
    + '<label class="mu">Vence <input id="pd" type="date"' + (e ? val(p.due || "") : "") + "></label>"
    + '<select id="pr">' + raceOptions(races, e ? p.race || "" : undefined) + "</select>"
    + '<input id="pn" placeholder="Nota (opcional)"' + (e ? val(p.note || "") : "") + "></div>"
    + '<div class="row" id="fg" style="margin-top:8px;display:' + (isFine ? "flex" : "none") + '">'
    + '<select id="fw">' + options(FINE_WHO, f ? f.who : undefined) + "</select>"
    + '<input id="fa" placeholder="Artículo infringido (opcional)"' + (f ? val(f.art || "") : "") + ">"
    + '<label class="mu">Notificada <input id="fn" type="date" data-change="fineNotified"' + (f ? val(f.notif || "") : "") + "></label>"
    + '<select id="fs"><option value="pend"' + (f && f.st === "pend" ? " selected" : "") + '>Pendiente</option><option value="apel"' + (f && f.st === "apel" ? " selected" : "") + ">Apelada</option></select></div>"
    + '<div class="row" style="margin-top:8px">' + submit("addPend", "Agregar", !!e) + "</div></details>";
}

/** Al cambiar el tipo de pendiente: cambia las categorías y muestra u oculta los datos de multa. */
export function onKindChange(doc, keep) {
  const k = doc.getElementById("pk").value;
  const pcat = doc.getElementById("pcat");
  pcat.innerHTML = options(pendCats(k));
  doc.getElementById("fg").style.display = k === "f" ? "flex" : "none";
  pcat.style.display = k === "f" ? "none" : "";
  if (keep) pcat.value = keep;
}

export function viewPendientes({ S, t, m, races, ref }) {
  const L = ofTeam(S.pend, t.id).sort((a, b) => ((a.due || "9") > (b.due || "9") ? 1 : -1));
  const { pay, collect } = pendTotals(L);
  return '<h1 class="page-title">Pendientes</h1>' + pendForm({ S, races })
    + '<div class="card"><h2>Pendientes</h2><div class="row mu" style="margin-bottom:8px"><span>Por pagar: <b class="ko">' + m(pay) + '</b></span><span>Por cobrar: <b class="ok">' + m(collect) + "</b></span></div>"
    + (L.length
      ? '<div class="sc"><table><tr><th></th><th>Detalle</th><th>Vencimiento</th><th style="text-align:right">Monto</th><th></th></tr>'
        + L.map((x) => {
          const f = x.fine;
          return "<tr><td>" + PEND_LABEL[x.kind] + "</td><td>" + esc(x.party || x.cat)
            + (f ? '<div class="mu"><small>' + f.who + (f.art ? " · art. " + esc(f.art) : "") + " · " + (f.st === "apel" ? "Apelada" : "Pendiente") + (f.notif ? " · notif. " + fd(f.notif) : "") + "</small></div>" : "")
            + (x.note ? '<div class="mu"><small>' + esc(x.note) + "</small></div>" : "")
            + "</td><td>" + badge(x.due, ref) + '</td><td class="n ' + (x.kind === "c" ? "ok" : "ko") + '">' + m(x.amt) + "</td>"
            + '<td class="n"><button data-act="markPaid" data-i="' + x.id + '">' + (x.kind === "c" ? "Cobrado" : "Pagado") + '</button><button class="g" data-act="editPend" data-i="' + x.id + '">✎</button><button class="g" data-act="delPend" data-i="' + x.id + '">✕</button></td></tr>';
        }).join("") + "</table></div>"
      : '<span class="mu">No hay pendientes.</span>')
    + '<div class="mu" style="margin-top:8px"><small>Los pendientes no cuentan como gasto ni ingreso hasta que los marcás como pagados o cobrados.</small></div></div>';
}
