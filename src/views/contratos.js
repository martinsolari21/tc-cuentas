// Pestaña Contratos: auspicios con cuotas.
import { esc, fd } from "../format.js";
import { contractPending, ofTeam } from "../calc.js";
import { badge } from "./ui.js";

function contractCard(c, m, ref) {
  let cob = 0;
  c.inst.forEach((i) => { if (i.paid) cob += i.amt; });
  return '<div class="card"><div class="row" style="justify-content:space-between"><b>' + esc(c.sponsor) + (c.num ? " · N° " + esc(c.num) : "") + '</b><button class="g" data-act="delCon" data-i="' + c.id + '">Eliminar</button></div>'
    + '<div class="mu"><small>' + (c.from || c.to ? "Vigencia " + fd(c.from) + " – " + fd(c.to) + " · " : "") + "Total " + m(c.total) + " · Cobrado " + m(cob) + "</small></div>"
    + (c.deliv ? '<div style="margin:6px 0"><small class="mu">Entregables:</small> ' + esc(c.deliv) + "</div>" : "")
    + '<div class="sc"><table><tr><th>#</th><th>Fecha</th><th>Monto</th><th></th></tr>'
    + c.inst.map((i, k) => {
      const a = 'data-c="' + c.id + '" data-i="' + i.id + '"', d = i.paid ? " disabled" : "";
      return "<tr><td>" + (k + 1) + '</td><td><input type="date" value="' + i.date + '"' + d + " " + a + ' data-change="setInst" data-f="date"></td>'
        + '<td><input type="number" value="' + i.amt + '"' + d + " " + a + ' data-change="setInst" data-f="amt"></td><td class="n">'
        + (i.paid ? '<span class="ok">Cobrada</span> <button class="g" ' + a + ' data-act="payInst">Deshacer</button>' : badge(i.date, ref) + " <button " + a + ' data-act="payInst">Cobrada</button>')
        + "</td></tr>";
    }).join("") + "</table></div></div>";
}

export function viewContratos({ S, t, m, ref }) {
  const L = ofTeam(S.cons, t.id);
  const { pen, ven } = contractPending(L, ref);
  return '<div class="card"><h2>Nuevo contrato de auspicio</h2><div class="row"><input id="cs" placeholder="Sponsor"><input id="cn" placeholder="N° de contrato"><input id="ct" type="number" min="0" inputmode="decimal" placeholder="Monto total ARS"><label class="mu">Desde <input id="cf" type="date"></label><label class="mu">Hasta <input id="cu" type="date"></label><input id="cq" type="number" min="1" placeholder="Cantidad de cuotas"><label class="mu">1ª cuota <input id="c1" type="date"></label><input id="cd" placeholder="Entregables comprometidos"><button class="p" data-act="addCon">Agregar contrato</button></div><div class="mu" style="margin-top:6px"><small>Genera cuotas mensuales iguales; después podés cambiar fecha y monto de cada una.</small></div></div>'
    + (L.length ? '<div class="k" style="margin-bottom:12px"><div><small>Por cobrar (auspicios)</small><b>' + m(pen) + '</b></div><div><small>Vencido</small><b class="' + (ven ? "ko" : "") + '">' + m(ven) + "</b></div><div><small>Contratos</small><b>" + L.length + "</b></div></div>" : "")
    + L.map((c) => contractCard(c, m, ref)).join("");
}
